import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, MessagesSquare, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

import { EvaluationDetails, PointList } from "@/components/app/evaluation-card";
import { ScoreBar, ScorePill, ScoreRing } from "@/components/app/score";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { SCORE_KEYS, SCORE_LABELS } from "@/lib/interview/schemas";
import { getReport, type SavedReport } from "@/lib/storage";

export const Route = createFileRoute("/report/$reportId")({
  head: () => ({
    meta: [
      { title: "Interview performance report — TalentLens" },
      { name: "description", content: "Scores, strengths, weaknesses and a personalised learning roadmap from your mock interview." },
      { property: "og:title", content: "Interview performance report — TalentLens" },
      { property: "og:description", content: "Scores, strengths, weaknesses and a personalised learning roadmap from your mock interview." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportPage,
});

const READINESS_STYLE: Record<SavedReport["report"]["readiness"], string> = {
  "Interview ready": "bg-success-soft text-success",
  "Almost there": "bg-warning-soft text-warning",
  "Needs practice": "bg-destructive-soft text-destructive",
};

function ReportPage() {
  const { reportId } = Route.useParams();
  const [saved, setSaved] = useState<SavedReport | null | undefined>(undefined);
  useEffect(() => setSaved(getReport(reportId) ?? null), [reportId]);

  if (saved === undefined) return null;
  if (saved === null) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Report not found</h1>
        <p className="mt-2 text-muted-foreground">It may have been deleted, or it was saved in a different browser.</p>
        <Button asChild className="mt-6">
          <Link to="/report">See all reports</Link>
        </Button>
      </div>
    );
  }

  const { report, config, items } = saved;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-2">
        <p className="eyebrow">Performance report</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">{config.role}</h1>
        <p className="text-muted-foreground">
          {config.type} · {config.difficulty} · {config.level} · {items.length} questions ·{" "}
          {new Date(saved.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="surface-card flex flex-col items-center justify-center gap-4 p-8 text-center">
          <ScoreRing score={report.overallScore} />
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${READINESS_STYLE[report.readiness]}`}>{report.readiness}</span>
        </div>
        <div className="surface-card p-6 sm:p-8">
          <h2 className="mb-2 text-lg font-semibold">Summary</h2>
          <p className="text-muted-foreground">{report.summary}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {SCORE_KEYS.map((k) => (
              <ScoreBar key={k} label={SCORE_LABELS[k]} value={report.categoryScores[k]} />
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="surface-card p-6">
          <PointList title="Strengths" items={report.strengths} tone="good" empty="Keep practising to build clear strengths." />
        </div>
        <div className="surface-card p-6">
          <PointList title="Weaknesses" items={report.weaknesses} tone="bad" empty="No recurring weaknesses found." />
        </div>
      </section>

      <section className="surface-card mt-6 p-6 sm:p-8">
        <h2 className="mb-2 text-lg font-semibold">Most important advice</h2>
        <p className="text-muted-foreground">{report.feedback}</p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Your learning roadmap</h2>
        <p className="mt-1 text-muted-foreground">Work through these in order, then come back for another mock interview.</p>
        <ol className="relative mt-8 space-y-6 border-l-2 border-primary-soft pl-8">
          {report.roadmap.map((step, i) => (
            <li key={i} className="relative">
              <span className="tabular absolute -left-[2.6rem] grid size-8 place-items-center rounded-full bg-primary text-sm text-primary-foreground">
                {i + 1}
              </span>
              <div className="surface-card p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold">{step.title}</h3>
                  <span className="eyebrow">{step.timeframe}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                {step.resources.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {step.resources.map((r, j) => (
                      <li key={j} className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-xs">
                        <BookOpen className="size-3.5 text-primary" aria-hidden="true" />
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-semibold">Question by question</h2>
        <Accordion type="multiple" className="surface-card divide-y divide-border px-5">
          {items.map((it, i) => (
            <AccordionItem key={i} value={`q${i}`} className="border-0">
              <AccordionTrigger className="gap-4 text-left hover:no-underline">
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <ScorePill score={it.evaluation.overall} />
                  <span className="min-w-0">
                    <span className="block font-medium">{it.question}</span>
                    <span className="block text-xs font-normal text-muted-foreground">{it.topic}</span>
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="mb-6 rounded-lg border border-border p-4 text-sm">
                  <p className="mb-1 font-semibold">Your answer</p>
                  <p className="whitespace-pre-line text-muted-foreground">{it.answer}</p>
                </div>
                <EvaluationDetails evaluation={it.evaluation} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link to="/interview" search={config}>
            <RotateCcw /> Practise again
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/coach">
            <MessagesSquare /> Ask IQ Coach
          </Link>
        </Button>
        <Button asChild size="lg" variant="ghost">
          <Link to="/report">
            All reports <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
