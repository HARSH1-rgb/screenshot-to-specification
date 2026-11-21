import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState, type FormEvent } from "react";

import { OptionGroup } from "@/components/app/option-group";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DIFFICULTIES,
  INTERVIEW_TYPES,
  LEVELS,
  QUESTION_COUNTS,
  interviewConfigSchema,
  type InterviewConfig,
} from "@/lib/interview/schemas";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Set up your mock interview — TalentLens" },
      { name: "description", content: "Choose a job role, experience level, interview type, difficulty and number of questions." },
      { property: "og:title", content: "Set up your mock interview — TalentLens" },
      { property: "og:description", content: "Choose a job role, experience level, interview type, difficulty and number of questions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SetupPage,
});

const ROLE_SUGGESTIONS = [
  "Frontend Developer",
  "Backend Developer",
  "Data Analyst",
  "Product Manager",
  "Software Engineer",
  "UX Designer",
];

const TYPE_HINTS: Record<(typeof INTERVIEW_TYPES)[number], string> = {
  Technical: "Concepts & problem solving",
  Behavioral: "Past experience, STAR",
  HR: "Motivation & fit",
  Mixed: "A bit of everything",
};

function SetupPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<InterviewConfig>({
    role: "",
    level: "Fresher (0-1 yrs)",
    type: "Technical",
    difficulty: "Medium",
    questionCount: 5,
  });
  const [roleError, setRoleError] = useState<string | null>(null);

  const update = <K extends keyof InterviewConfig>(key: K, value: InterviewConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = interviewConfigSchema.safeParse(config);
    if (!parsed.success) {
      setRoleError(parsed.error.issues[0]?.message ?? "Check the details above");
      return;
    }
    navigate({ to: "/interview", search: parsed.data });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Step 1 of 3"
        title="Set up your interview"
        description="Tell us what you're preparing for. The interviewer adapts its questions to these choices and to your answers."
      />

      <form onSubmit={onSubmit} className="surface-card space-y-8 p-6 sm:p-8" noValidate>
        <div>
          <Label htmlFor="role" className="mb-3 block text-sm font-semibold">
            Job role
          </Label>
          <Input
            id="role"
            value={config.role}
            maxLength={80}
            placeholder="e.g. Frontend Developer"
            aria-invalid={!!roleError}
            aria-describedby={roleError ? "role-error" : undefined}
            onChange={(e) => {
              update("role", e.target.value);
              setRoleError(null);
            }}
            className="h-11 text-base"
          />
          {roleError && (
            <p id="role-error" className="mt-2 text-sm text-destructive">
              {roleError}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {ROLE_SUGGESTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  update("role", r);
                  setRoleError(null);
                }}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <OptionGroup label="Experience level" options={LEVELS} value={config.level} onChange={(v) => update("level", v)} columns="sm:grid-cols-3" />
        <OptionGroup
          label="Interview type"
          options={INTERVIEW_TYPES}
          value={config.type}
          onChange={(v) => update("type", v)}
          describe={(v) => TYPE_HINTS[v]}
        />
        <div className="grid gap-8 sm:grid-cols-2">
          <OptionGroup label="Difficulty" options={DIFFICULTIES} value={config.difficulty} onChange={(v) => update("difficulty", v)} columns="grid-cols-3 sm:grid-cols-3" />
          <OptionGroup
            label="Number of questions"
            options={QUESTION_COUNTS}
            value={config.questionCount as (typeof QUESTION_COUNTS)[number]}
            onChange={(v) => update("questionCount", v)}
            columns="grid-cols-4 sm:grid-cols-4"
          />
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Takes about {config.questionCount * 2}–{config.questionCount * 3} minutes.</p>
          <Button type="submit" size="lg">
            Start interview <ArrowRight />
          </Button>
        </div>
      </form>
    </div>
  );
}
