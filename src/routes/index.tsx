import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, FileSearch, GitBranch, MessagesSquare, Mic, Route as RouteIcon } from "lucide-react";

import { ScoreBar, ScorePill } from "@/components/app/score";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TalentLens — Practice interviews with an adaptive AI interviewer" },
      {
        name: "description",
        content: "Mock interviews that adapt to your answers, scored feedback on five skills, and a learning roadmap made for you.",
      },
      { property: "og:title", content: "TalentLens — Practice interviews with an adaptive AI interviewer" },
      {
        property: "og:description",
        content: "Mock interviews that adapt to your answers, scored feedback on five skills, and a learning roadmap made for you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const STEPS = [
  { n: "01", title: "Set up your interview", body: "Pick the role, your experience level, interview type, difficulty and how many questions." },
  { n: "02", title: "Answer adaptive questions", body: "Type or speak. Strong answers lead to deeper follow-ups; shaky ones get clarifying questions." },
  { n: "03", title: "Get your report", body: "Scores, strengths, weaknesses and a step-by-step learning roadmap you can act on." },
];

const FEATURES = [
  { icon: GitBranch, title: "Adaptive interviewer", body: "Every question is chosen from your previous answer — no fixed question bank." },
  { icon: BarChart3, title: "Five-skill scoring", body: "Correctness, relevance, clarity, depth and communication, scored for every answer." },
  { icon: RouteIcon, title: "Personal roadmap", body: "A week-by-week plan with resources aimed at your weakest areas." },
  { icon: MessagesSquare, title: "IQ Coach", body: "Ask about concepts, rehearse answers, or get a study plan any time." },
  { icon: FileSearch, title: "Resume match", body: "Compare your resume with a job description to see matching and missing skills." },
  { icon: Mic, title: "Voice optional", body: "Hear questions read aloud and dictate answers in supported browsers." },
];

function Home() {
  return (
    <>
      <section className="bg-lens">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <p className="eyebrow mb-4">AI interview preparation</p>
            <h1 className="text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-[3.6rem]">
              Practise the interview <span className="text-primary">before</span> the interview.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              TalentLens runs realistic mock interviews that adapt to how you answer, scores each response, and turns your
              results into a clear plan to improve.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/setup">
                  Start a mock interview <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/coach">Ask IQ Coach</Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">Free to use · No sign-up · Results stay on your device</p>
          </div>

          <div className="surface-card relative p-6 shadow-lift" aria-label="Example of answer feedback">
            <div className="mb-4 flex items-center justify-between">
              <span className="eyebrow">Example feedback · Q3 of 5</span>
              <ScorePill score={78} />
            </div>
            <p className="font-display text-lg font-medium leading-snug">
              “You mentioned caching the API responses. How would you decide when that cache should be invalidated?”
            </p>
            <span className="mt-3 inline-flex rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
              Going deeper on caching
            </span>
            <div className="mt-6 space-y-3">
              <ScoreBar label="Correctness" value={8.5} />
              <ScoreBar label="Depth" value={7} />
              <ScoreBar label="Clarity" value={6} />
            </div>
            <div className="mt-6 rounded-lg bg-secondary p-4 text-sm">
              <span className="font-medium">Tip: </span>
              <span className="text-muted-foreground">Name one concrete strategy (e.g. TTL vs. event-based) and its trade-off.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold sm:text-3xl">How it works</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="surface-card p-6">
              <span className="tabular text-sm text-primary">{s.n}</span>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="text-2xl font-semibold sm:text-3xl">Everything you need to prepare</h2>
        <div className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-4">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                <f.icon className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="flex flex-col items-start gap-6 rounded-2xl bg-ink p-8 text-ink-foreground sm:p-12 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">Your next interview starts in two minutes.</h2>
            <p className="mt-2 text-ink-muted">Pick a role and see how you'd do today.</p>
          </div>
          <Button asChild size="lg" variant="highlight">
            <Link to="/setup">
              Start practising <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
