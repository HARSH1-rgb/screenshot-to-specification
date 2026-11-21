import { createFileRoute } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";

import { PointList } from "@/components/app/evaluation-card";
import { ErrorNotice, PageHeader } from "@/components/app/page-header";
import { ScoreRing } from "@/components/app/score";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, errorMessage } from "@/lib/api";
import { resumeRequestSchema, type ResumeResult } from "@/lib/interview/schemas";

export const Route = createFileRoute("/resume")({
  head: () => ({
    meta: [
      { title: "Resume match — compare your resume to a job | TalentLens" },
      { name: "description", content: "Paste your resume and a job description to see matching skills, missing skills and suggested edits." },
      { property: "og:title", content: "Resume match — compare your resume to a job" },
      { property: "og:description", content: "Paste your resume and a job description to see matching skills, missing skills and suggested edits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResumePage,
});

function ResumePage() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeResult | null>(null);

  const analyze = async (e?: FormEvent) => {
    e?.preventDefault();
    const parsed = resumeRequestSchema.safeParse({ resumeText, jobDescription });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Check both fields");
      return;
    }
    setFieldError(null);
    setError(null);
    setLoading(true);
    try {
      setResult(await api.resume(parsed.data.resumeText, parsed.data.jobDescription));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Resume match"
        title="How well does your resume fit the job?"
        description={
          <span className="inline-flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            Your resume is only used for this comparison and is never stored.
          </span>
        }
      />

      <form onSubmit={analyze} className="grid gap-6 md:grid-cols-2" noValidate>
        <div>
          <Label htmlFor="resume" className="mb-2 block font-semibold">
            Your resume
          </Label>
          <Textarea
            id="resume"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            maxLength={15000}
            placeholder="Paste the text of your resume…"
            className="min-h-72 bg-card"
          />
        </div>
        <div>
          <Label htmlFor="jd" className="mb-2 block font-semibold">
            Job description
          </Label>
          <Textarea
            id="jd"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            maxLength={10000}
            placeholder="Paste the job description…"
            className="min-h-72 bg-card"
          />
        </div>
        <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive" role={fieldError ? "alert" : undefined}>
            {fieldError}
          </p>
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="animate-spin" /> Comparing…
              </>
            ) : (
              "Compare"
            )}
          </Button>
        </div>
      </form>

      {error && (
        <div className="mt-6">
          <ErrorNotice message={error} onRetry={() => void analyze()} />
        </div>
      )}

      {result && (
        <section className="mt-10 grid gap-6 lg:grid-cols-[280px_1fr]" aria-live="polite">
          <div className="surface-card flex flex-col items-center gap-3 p-8 text-center">
            <ScoreRing score={result.matchScore} label="Match" />
            <p className="text-sm text-muted-foreground">{result.summary}</p>
          </div>
          <div className="surface-card space-y-6 p-6 sm:p-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <PointList title="Matching skills" items={result.matchingSkills} tone="good" empty="No clear matches found." />
              <PointList title="Missing or weak" items={result.missingSkills} tone="bad" empty="Nothing important is missing." />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Suggested improvements</p>
              <ol className="list-decimal space-y-2 pl-5 text-sm">
                {result.improvements.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
