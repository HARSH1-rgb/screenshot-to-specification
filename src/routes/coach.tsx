import { useChat } from "@ai-sdk/react";
import { createFileRoute } from "@tanstack/react-router";
import { DefaultChatTransport, type UIMessage } from "ai";
import { RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { LensMark } from "@/components/app/logo";
import { Button } from "@/components/ui/button";
import { clearCoachMessages, loadCoachMessages, newId, saveCoachMessages } from "@/lib/storage";

export const Route = createFileRoute("/coach")({
  head: () => ({
    meta: [
      { title: "IQ Coach — AI interview and learning assistant | TalentLens" },
      { name: "description", content: "Chat with IQ Coach to explain concepts, rehearse answers and build a study plan for your next interview." },
      { property: "og:title", content: "IQ Coach — AI interview and learning assistant" },
      { property: "og:description", content: "Chat with IQ Coach to explain concepts, rehearse answers and build a study plan for your next interview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CoachPage,
});

const SUGGESTIONS = [
  "How do I answer “Tell me about yourself” as a fresher?",
  "Explain the difference between REST and GraphQL with an interview-ready answer.",
  "Give me 3 behavioral questions and review my answer using STAR.",
  "Make a 2-week study plan for a junior data analyst interview.",
];

function CoachPage() {
  const [initial, setInitial] = useState<{ key: string; messages: UIMessage[] } | null>(null);
  const [hasMessages, setHasMessages] = useState(false);
  useEffect(() => {
    const messages = loadCoachMessages();
    setInitial({ key: newId(), messages });
    setHasMessages(messages.length > 0);
  }, []);

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-3xl flex-col px-4 pt-6 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <LensMark className="size-10" />
          <div>
            <h1 className="text-xl font-semibold">IQ Coach</h1>
            <p className="text-sm text-muted-foreground">Interview prep and technical learning, on demand.</p>
          </div>
        </div>
        {hasMessages && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearCoachMessages();
              setInitial({ key: newId(), messages: [] });
              setHasMessages(false);
            }}
          >
            <RotateCcw /> New chat
          </Button>
        )}
      </div>
      {initial && (
        <CoachChat
          key={initial.key}
          initialMessages={initial.messages}
          onHasMessages={setHasMessages}
        />
      )}
    </div>
  );
}

function CoachChat({ initialMessages, onHasMessages }: { initialMessages: UIMessage[]; onHasMessages: (has: boolean) => void }) {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/coach" }), []);
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { messages, sendMessage, status, stop, error } = useChat({
    messages: initialMessages,
    transport,
    onError: (e) => toast.error(readError(e)),
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (messages.length > 0) onHasMessages(true);
    if (status === "ready" || status === "error") {
      if (messages.length > 0) saveCoachMessages(messages);
      textareaRef.current?.focus();
    }
  }, [status, messages, onHasMessages]);

  useEffect(() => textareaRef.current?.focus(), []);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    void sendMessage({ text: t });
    setInput("");
  };

  const last = messages[messages.length - 1];
  const waiting = status === "submitted" || (status === "streaming" && last?.role !== "assistant");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="px-0">
          {messages.length === 0 && (
            <div className="py-8">
              <p className="font-display text-2xl font-semibold">What are you preparing for?</p>
              <p className="mt-2 text-muted-foreground">Ask anything about interviews, concepts, or your career path. Try one of these:</p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="surface-card p-4 text-left text-sm transition-colors hover:border-primary/40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent className="text-[0.95rem] leading-relaxed group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground">
                {m.parts.map((part, i) =>
                  part.type === "text" ? (
                    m.role === "assistant" ? (
                      <MessageResponse key={i} isAnimating={busy && m.id === last?.id}>
                        {part.text}
                      </MessageResponse>
                    ) : (
                      <p key={i} className="whitespace-pre-wrap">
                        {part.text}
                      </p>
                    )
                  ) : null,
                )}
              </MessageContent>
            </Message>
          ))}
          {waiting && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Thinking…</Shimmer>
              </MessageContent>
            </Message>
          )}
          {error && status === "error" && (
            <p role="alert" className="text-sm text-destructive">
              {readError(error)}
            </p>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="pb-4 pt-2">
        <PromptInput onSubmit={(msg) => send(msg.text)} className="bg-card shadow-card">
          <PromptInputTextarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask IQ Coach…"
            maxLength={4000}
            aria-label="Message IQ Coach"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} disabled={!busy && !input.trim()} />
          </PromptInputFooter>
        </PromptInput>
        <p className="mt-2 text-center text-xs text-muted-foreground">Chats are saved only in this browser. IQ Coach can make mistakes.</p>
      </div>
    </div>
  );
}

function readError(e: Error) {
  try {
    const parsed = JSON.parse(e.message) as { error?: unknown };
    if (typeof parsed.error === "string") return parsed.error;
  } catch {
    // not JSON
  }
  return e.message || "IQ Coach couldn't respond. Please try again.";
}
