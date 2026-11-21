import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Clock, Flag, Loader2, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

import { EvaluationDetails, EvaluationHeader } from "@/components/app/evaluation-card";
import { ErrorNotice } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { api, errorMessage } from "@/lib/api";
import {
  MAX_ANSWER_CHARS,
  interviewConfigSchema,
  type Evaluation,
  type InterviewConfig,
  type NextQuestion,
} from "@/lib/interview/schemas";
import { speak, speechSupport, startDictation, stopSpeaking } from "@/lib/speech";
import { newId, saveReport, type SavedReport } from "@/lib/storage";

export const Route = createFileRoute("/interview")({
  validateSearch: (search: Record<string, unknown>): Partial<InterviewConfig> => {
    const parsed = interviewConfigSchema.safeParse({ ...search, questionCount: Number(search["questionCount"]) });
    return parsed.success ? parsed.data : {};
  },
  head: () => ({
    meta: [
      { title: "Mock interview in progress — TalentLens" },
      { name: "description", content: "Answer adaptive interview questions and get instant scored feedback." },
      { property: "og:title", content: "Mock interview — TalentLens" },
      { property: "og:description", content: "Answer adaptive interview questions and get instant scored feedback." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InterviewRoute,
});

function InterviewRoute() {
  const search = Route.useSearch();
  const parsed = interviewConfigSchema.safeParse(search);
  if (!parsed.success) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Let's set up your interview first</h1>
        <p className="mt-2 text-muted-foreground">Choose a role and a few options, then we'll start.</p>
        <Button asChild className="mt-6">
          <Link to="/setup">Go to setup</Link>
        </Button>
      </div>
    );
  }
  return <InterviewSession config={parsed.data} />;
}

type Answered = SavedReport["items"][number];
type Phase = "loading" | "answering" | "evaluating" | "feedback" | "reporting";
type Prefetch = { status: "idle" } | { status: "loading" } | { status: "ready"; q: NextQuestion } | { status: "error"; message: string };

const DIRECTION_LABEL: Record<NextQuestion["direction"], string> = {
  opening: "Opening question",
  deeper: "Going deeper",
  clarify: "Clarifying",
  new_topic: "New topic",
};

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function InterviewSession({ config }: { config: InterviewConfig }) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("loading");
  const [current, setCurrent] = useState<NextQuestion | null>(null);
  const [items, setItems] = useState<Answered[]>([]);
  const [lastEval, setLastEval] = useState<Evaluation | null>(null);
  const [prefetch, setPrefetch] = useState<Prefetch>({ status: "idle" });
  const [answer, setAnswer] = useState("");
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; retry: () => void } | null>(null);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [support, setSupport] = useState({ dictation: false, readAloud: false });
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const stopDictationRef = useRef<() => void>(() => {});
  const startedRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const questionNumber = items.length + (phase === "feedback" ? 0 : 1);
  const isLast = items.length + 1 >= config.questionCount;

  useEffect(() => setSupport(speechSupport()), []);
  useEffect(() => () => {
    stopDictationRef.current();
    stopSpeaking();
  }, []);

  useEffect(() => {
    if (phase !== "answering") return;
    setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [phase, startedAt]);

  const showQuestion = useCallback((q: NextQuestion) => {
    setCurrent(q);
    setAnswer("");
    setAnswerError(null);
    setLastEval(null);
    setPrefetch({ status: "idle" });
    setStartedAt(Date.now());
    setPhase("answering");
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, []);

  const loadFirst = useCallback(async () => {
    setError(null);
    setPhase("loading");
    try {
      showQuestion(await api.nextQuestion(config, []));
    } catch (e) {
      setError({ message: errorMessage(e), retry: loadFirst });
    }
  }, [config, showQuestion]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void loadFirst();
  }, [loadFirst]);

  const fetchNext = useCallback(
    async (history: { question: string; answer: string }[]) => {
      setPrefetch({ status: "loading" });
      try {
        setPrefetch({ status: "ready", q: await api.nextQuestion(config, history) });
      } catch (e) {
        setPrefetch({ status: "error", message: errorMessage(e) });
      }
    },
    [config],
  );

  const finish = useCallback(
    async (answered: Answered[]) => {
      setError(null);
      setPhase("reporting");
      try {
        const report = await api.report(
          config,
          answered.map(({ question, answer, evaluation }) => ({ question, answer, evaluation })),
        );
        const id = newId();
        saveReport({ id, createdAt: new Date().toISOString(), config, report, items: answered });
        navigate({ to: "/report/$reportId", params: { reportId: id } });
      } catch (e) {
        setPhase(answered.length > items.length ? "feedback" : "answering");
        setError({ message: errorMessage(e), retry: () => void finish(answered) });
      }
    },
    [config, items.length, navigate],
  );

  const submit = async () => {
    if (!current || phase !== "answering") return;
    const text = answer.trim();
    if (!text) {
      setAnswerError("Write or dictate an answer before submitting.");
      textareaRef.current?.focus();
      return;
    }
    stopDictationRef.current();
    stopSpeaking();
    setError(null);
    setPhase("evaluating");
    const durationSec = Math.round((Date.now() - startedAt) / 1000);
    const history = [...items.map(({ question, answer }) => ({ question, answer })), { question: current.question, answer: text }];
    if (!isLast) void fetchNext(history);
    try {
      const evaluation = await api.evaluate(config, current.question, text);
      setItems((prev) => [...prev, { question: current.question, topic: current.topic, answer: text, durationSec, evaluation }]);
      setLastEval(evaluation);
      setPhase("feedback");
    } catch (e) {
      setPhase("answering");
      setPrefetch({ status: "idle" });
      setError({ message: errorMessage(e), retry: () => void submit() });
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void submit();
    }
  };

  const toggleDictation = () => {
    if (listening) {
      stopDictationRef.current();
      return;
    }
    setListening(true);
    stopDictationRef.current = startDictation({
      onText: (t) => {
        setAnswer((a) => (a ? `${a.trimEnd()} ${t}` : t).slice(0, MAX_ANSWER_CHARS));
        setAnswerError(null);
      },
      onEnd: () => setListening(false),
      onError: (m) => setError({ message: m, retry: () => setError(null) }),
    });
  };

  const toggleSpeak = () => {
    if (!current) return;
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speak(current.question, () => setSpeaking(false));
  };

  const progressValue = ((items.length + (phase === "feedback" || phase === "reporting" ? 0 : 0.5)) / config.questionCount) * 100;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="font-medium">
            {config.role} <span className="text-muted-foreground">· {config.type} · {config.difficulty} · {config.level}</span>
          </p>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="tabular">
              Question {Math.min(Math.max(questionNumber, 1), config.questionCount)} of {config.questionCount}
            </span>
            <span className="tabular inline-flex items-center gap-1" aria-label="Time on this question">
              <Clock className="size-4" aria-hidden="true" />
              {formatTime(phase === "answering" ? elapsed : 0)}
            </span>
          </div>
        </div>
        <Progress value={progressValue} aria-label="Interview progress" />
      </div>

      {error && (
        <div className="mb-6">
          <ErrorNotice message={error.message} onRetry={error.retry} />
        </div>
      )}

      {phase === "loading" && !error && <LoadingCard text="Preparing your first question…" />}
      {phase === "reporting" && <LoadingCard text="Writing your performance report and roadmap…" />}

      {current && (phase === "answering" || phase === "evaluating") && (
        <section className="surface-card p-6 sm:p-8" aria-live="polite">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
              {DIRECTION_LABEL[current.direction]}
            </span>
            <span className="text-xs text-muted-foreground">{current.topic}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-medium leading-snug sm:text-2xl">{current.question}</h1>
            {support.readAloud && (
              <Button variant="ghost" size="icon" onClick={toggleSpeak} aria-label={speaking ? "Stop reading" : "Read question aloud"}>
                {speaking ? <VolumeX /> : <Volume2 />}
              </Button>
            )}
          </div>

          <div className="mt-6">
            <label htmlFor="answer" className="sr-only">
              Your answer
            </label>
            <Textarea
              id="answer"
              ref={textareaRef}
              value={answer}
              maxLength={MAX_ANSWER_CHARS}
              disabled={phase === "evaluating"}
              onChange={(e) => {
                setAnswer(e.target.value);
                setAnswerError(null);
              }}
              onKeyDown={onKeyDown}
              placeholder={support.dictation ? "Type your answer, or use the microphone…" : "Type your answer…"}
              aria-invalid={!!answerError}
              aria-describedby="answer-help"
              className="min-h-48 resize-y text-base leading-relaxed"
            />
            <div id="answer-help" className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              {answerError ? <span className="text-destructive">{answerError}</span> : <span>Ctrl/⌘ + Enter to submit</span>}
              <span className="tabular">
                {answer.length}/{MAX_ANSWER_CHARS}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {support.dictation && (
                <Button
                  type="button"
                  variant={listening ? "destructive" : "outline"}
                  onClick={toggleDictation}
                  disabled={phase === "evaluating"}
                  aria-pressed={listening}
                >
                  {listening ? <MicOff /> : <Mic />}
                  {listening ? "Stop dictation" : "Dictate"}
                </Button>
              )}
              {items.length > 0 && (
                <Button type="button" variant="ghost" onClick={() => void finish(items)} disabled={phase === "evaluating"}>
                  <Flag /> End & get report
                </Button>
              )}
            </div>
            <Button onClick={() => void submit()} disabled={phase === "evaluating"} size="lg">
              {phase === "evaluating" ? (
                <>
                  <Loader2 className="animate-spin" /> Evaluating…
                </>
              ) : (
                <>
                  Submit answer <ArrowRight />
                </>
              )}
            </Button>
          </div>
        </section>
      )}

      {phase === "feedback" && lastEval && (
        <section className="surface-card p-6 sm:p-8" aria-live="polite">
          <p className="eyebrow mb-2">Feedback · Question {items.length}</p>
          <h1 className="mb-4 text-lg font-medium leading-snug text-muted-foreground">{items[items.length - 1]?.question}</h1>
          <EvaluationHeader evaluation={lastEval} />
          <div className="mt-6">
            <EvaluationDetails evaluation={lastEval} />
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-6">
            {items.length >= config.questionCount ? (
              <Button size="lg" onClick={() => void finish(items)}>
                See my report <ArrowRight />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => void finish(items)}>
                  <Flag /> End & get report
                </Button>
                {prefetch.status === "error" ? (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => void fetchNext(items.map(({ question, answer }) => ({ question, answer })))}
                  >
                    Couldn't load next question — retry
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    disabled={prefetch.status !== "ready"}
                    onClick={() => prefetch.status === "ready" && showQuestion(prefetch.q)}
                  >
                    {prefetch.status === "ready" ? (
                      <>
                        Next question <ArrowRight />
                      </>
                    ) : (
                      <>
                        <Loader2 className="animate-spin" /> Preparing next question…
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
          {prefetch.status === "error" && <p className="mt-3 text-right text-sm text-destructive">{prefetch.message}</p>}
        </section>
      )}
    </div>
  );
}

function LoadingCard({ text }: { text: string }) {
  return (
    <div className="surface-card flex items-center gap-3 p-8 text-muted-foreground" role="status">
      <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
      {text}
    </div>
  );
}
