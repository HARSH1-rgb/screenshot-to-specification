/** Optional browser voice features (Web Speech API). Everything falls back to typing. */

type RecognitionResultEvent = { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};
type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export const speechSupport = () => ({
  dictation: !!getRecognitionCtor(),
  readAloud: typeof window !== "undefined" && "speechSynthesis" in window,
});

/** Start dictation. Calls onText with each finalised chunk. Returns a stop function. */
export function startDictation(handlers: {
  onText: (text: string) => void;
  onEnd: () => void;
  onError: (message: string) => void;
}): () => void {
  const Ctor = getRecognitionCtor();
  if (!Ctor) {
    handlers.onError("Voice input isn't supported in this browser. You can type your answer instead.");
    handlers.onEnd();
    return () => {};
  }
  const rec = new Ctor();
  rec.lang = "en-US";
  rec.continuous = true;
  rec.interimResults = false;
  rec.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r?.isFinal) handlers.onText(r[0].transcript.trim());
    }
  };
  rec.onerror = (e) => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed")
      handlers.onError("Microphone access was blocked. Allow it in your browser, or type your answer.");
    else if (e.error !== "no-speech" && e.error !== "aborted") handlers.onError("Voice input stopped unexpectedly.");
  };
  rec.onend = handlers.onEnd;
  try {
    rec.start();
  } catch {
    handlers.onError("Couldn't start voice input.");
    handlers.onEnd();
  }
  return () => rec.stop();
}

export function speak(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1;
  if (onEnd) u.onend = onEnd;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
