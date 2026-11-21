import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/app/page-header";
import { ScorePill } from "@/components/app/score";
import { Button } from "@/components/ui/button";
import { deleteReport, listReports, type SavedReport } from "@/lib/storage";

export const Route = createFileRoute("/report/")({
  head: () => ({
    meta: [
      { title: "Your interview reports — TalentLens" },
      { name: "description", content: "Review past mock interview scores, feedback and learning roadmaps saved in this browser." },
      { property: "og:title", content: "Your interview reports — TalentLens" },
      { property: "og:description", content: "Review past mock interview scores, feedback and learning roadmaps saved in this browser." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const [reports, setReports] = useState<SavedReport[] | null>(null);
  useEffect(() => setReports(listReports()), []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="History"
        title="Your reports"
        description="Reports are saved only in this browser. Clearing your browser data removes them."
        actions={
          <Button asChild>
            <Link to="/setup">New interview</Link>
          </Button>
        }
      />

      {reports === null ? null : reports.length === 0 ? (
        <div className="surface-card bg-lens p-10 text-center">
          <h2 className="text-xl font-semibold">No reports yet</h2>
          <p className="mt-2 text-muted-foreground">Finish a mock interview and your report will appear here.</p>
          <Button asChild className="mt-6">
            <Link to="/setup">
              Start your first interview <ArrowRight />
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id} className="surface-card flex items-center gap-4 p-4 sm:p-5">
              <ScorePill score={r.report.overallScore} />
              <Link to="/report/$reportId" params={{ reportId: r.id }} className="min-w-0 flex-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <p className="truncate font-semibold">{r.config.role}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {r.config.type} · {r.config.difficulty} · {r.items.length} questions ·{" "}
                  {new Date(r.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </Link>
              <span className="hidden text-sm text-muted-foreground sm:inline">{r.report.readiness}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete report for ${r.config.role}`}
                onClick={() => {
                  deleteReport(r.id);
                  setReports(listReports());
                }}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
