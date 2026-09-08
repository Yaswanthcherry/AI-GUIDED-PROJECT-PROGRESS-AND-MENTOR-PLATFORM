import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth, useProjects } from "../../context/StoreContext";
import { RiskDonut } from "../../components/charts";
import { Badge, Button, Card, EmptyState, ErrorState, PageHead, ProgressBar, RiskBadge, Skeleton, Stat, StatusBadge } from "../../components/ui";
import { Icon } from "../../components/Icon";
import { cn, timeAgo } from "../../utils";
import { usePageTitle } from "../../hooks";
import type { Project } from "../../types";

function usePortfolio() {
  const { projects, loading, error, refresh } = useProjects();
  const totals = useMemo(() => {
    const students = new Set(projects.map((p) => p.studentId));
    return {
      students: students.size,
      projects: projects.length,
      active: projects.filter((p) => p.status === "active" || p.status === "planning").length,
      completed: projects.filter((p) => p.status === "completed").length,
      delayed: projects.filter((p) => p.status === "delayed").length,
      highRisk: projects.filter((p) => p.riskLevel === "high").length,
    };
  }, [projects]);
  const riskCounts = useMemo(
    () => ({
      low: projects.filter((p) => p.riskLevel === "low").length,
      medium: projects.filter((p) => p.riskLevel === "medium").length,
      high: projects.filter((p) => p.riskLevel === "high").length,
    }),
    [projects],
  );
  const avg = projects.length ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length) : 0;
  return { projects, loading, error, refresh, totals, riskCounts, avg };
}

export default function FacultyDashboard() {
  usePageTitle("Faculty dashboard");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { projects, loading, error, refresh, totals, riskCounts, avg } = usePortfolio();

  const attention = useMemo(() => {
    const score = (p: Project) =>
      (p.status === "delayed" ? 3 : 0) + (p.riskLevel === "high" ? 2 : p.riskLevel === "medium" ? 1 : 0) + p.tasks.filter((t) => t.status === "delayed").length;
    return [...projects].filter((p) => score(p) > 0).sort((a, b) => score(b) - score(a)).slice(0, 5);
  }, [projects]);

  return (
    <>
      <PageHead
        title={`Portfolio · ${user?.name ?? "Faculty"}`}
        desc="Every student project against its AI-issued plan — pace, milestones, risk and delays."
        actions={<Button variant="outline" icon="users" onClick={() => navigate("/faculty/projects")}>All projects</Button>}
      />

      {error && <ErrorState message={error} onRetry={() => void refresh()} />}

      {!error && loading && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[104px]" />)}
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <Skeleton className="h-[300px] lg:col-span-2" />
            <Skeleton className="h-[300px]" />
          </div>
        </div>
      )}

      {!error && !loading && projects.length === 0 && (
        <EmptyState icon="users" title="No student projects yet" desc="Once students create projects, their plans, progress and risks appear here in real time." />
      )}

      {!error && !loading && projects.length > 0 && (
        <>
          <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Stat label="Total students" value={totals.students} icon="users" />
            <Stat label="Active projects" value={totals.active} sub={`${totals.projects} total`} icon="folder" tone="pine" />
            <Stat label="Completed" value={totals.completed} icon="check" tone="pine" />
            <Stat label="Delayed" value={totals.delayed} icon="clock" tone={totals.delayed ? "clay" : "ink"} />
            <Stat label="High risk" value={totals.highRisk} icon="warning" tone={totals.highRisk ? "clay" : "gold"} />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-ink-900">Needs attention</h3>
                <span className="font-mono text-[10px] tracking-wider text-ink-400 uppercase">avg progress {avg}%</span>
              </div>
              <ul className="divide-y divide-ink-100">
                {attention.map((p) => <NeedsAttentionRow key={p.id} project={p} />)}
                {attention.length === 0 && <p className="py-6 text-center text-sm text-ink-500">Nothing flagged — the portfolio is healthy.</p>}
              </ul>
            </Card>

            <Card className="p-6">
              <h3 className="font-display mb-4 text-base font-bold text-ink-900">Risk distribution</h3>
              <RiskDonut counts={riskCounts} />
            </Card>
          </div>

          {/* table preview */}
          <Card className="mt-5 overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <h3 className="font-display text-base font-bold text-ink-900">Project monitoring</h3>
              <Link to="/faculty/projects" className="text-xs font-semibold text-pine-700 hover:underline">Open full list</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 bg-paper-100/70 font-mono text-[9.5px] font-semibold tracking-[0.16em] text-ink-400 uppercase">
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Project</th>
                    <th className="px-5 py-3">Progress</th>
                    <th className="px-5 py-3">Milestone</th>
                    <th className="px-5 py-3">Risk</th>
                    <th className="px-5 py-3">Last update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {projects.slice(0, 6).map((p) => (
                    <tr key={p.id} onClick={() => navigate(`/faculty/projects/${p.id}`)} className="cursor-pointer transition hover:bg-pine-50/50">
                      <td className="px-5 py-3.5 font-medium text-ink-800">{p.studentName}</td>
                      <td className="max-w-[220px] truncate px-5 py-3.5 text-ink-700">{p.title}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={p.progress} className="w-20" tone={p.status === "delayed" ? "clay" : "pine"} />
                          <span className="font-mono text-[11px] font-bold text-ink-700">{p.progress}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-ink-600">{p.phase}</td>
                      <td className="px-5 py-3.5"><RiskBadge level={p.riskLevel} /></td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-ink-500">{timeAgo(p.lastUpdate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}

function NeedsAttentionRow({ project: p }: { project: Project }) {
  const navigate = useNavigate();
  const delayed = p.tasks.filter((t) => t.status === "delayed").length;
  return (
    <button onClick={() => navigate(`/faculty/projects/${p.id}`)} className="flex w-full cursor-pointer flex-wrap items-center gap-3 px-1 py-3 text-left transition hover:bg-pine-50/50">
      <span className={cn("size-2 shrink-0 rounded-full", p.status === "delayed" ? "bg-clay-500" : p.riskLevel === "high" ? "bg-clay-400" : "bg-gold-500")} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink-800">{p.studentName} — {p.title}</span>
        <span className="font-mono text-[9.5px] tracking-wider text-ink-400 uppercase">
          {[p.status === "delayed" && "delayed", p.riskLevel === "high" && "high risk", delayed > 0 && `${delayed} delayed task${delayed > 1 ? "s" : ""}`].filter(Boolean).join(" · ") || "behind plan"}
        </span>
      </span>
      <StatusBadge status={p.status} />
      <RiskBadge level={p.riskLevel} />
      <Icon name="chevronRight" size={15} className="text-ink-300" />
    </button>
  );
}

/* ================= Student Projects page ================= */

export function FacultyProjectsPage() {
  usePageTitle("Student projects");
  const navigate = useNavigate();
  const { projects, loading, error, refresh } = usePortfolio();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | Project["status"]>("all");

  const filtered = useMemo(
    () =>
      projects.filter((p) => {
        const q = query.trim().toLowerCase();
        const matchesQ = !q || p.title.toLowerCase().includes(q) || p.studentName.toLowerCase().includes(q) || p.domain.toLowerCase().includes(q);
        const matchesS = status === "all" || p.status === status;
        return matchesQ && matchesS;
      }),
    [projects, query, status],
  );

  return (
    <>
      <PageHead
        back={<Link to="/faculty" className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-400 transition hover:text-pine-700"><Icon name="arrowLeft" size={13} /> Dashboard</Link>}
        title="Student projects"
        desc="Click any row for detailed monitoring: milestones, task ledger, risks and AI insights."
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1 sm:max-w-sm">
          <Icon name="search" size={15} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search student, title or domain…"
            className="w-full rounded-lg border border-ink-200 bg-paper-50 py-2.5 pr-3.5 pl-10 text-sm text-ink-900 transition placeholder:text-ink-300 focus:border-pine-500 focus:ring-2 focus:ring-pine-200 focus:outline-none"
            aria-label="Search projects"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "planning", "delayed", "completed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 font-mono text-[10.5px] font-bold tracking-wider uppercase transition",
                status === s ? "border-ink-900 bg-ink-900 text-paper-50" : "border-ink-200 bg-paper-50 text-ink-500 hover:border-ink-400",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={() => void refresh()} />}

      {!error && loading && (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[76px]" />)}
        </div>
      )}

      {!error && !loading && filtered.length === 0 && (
        <EmptyState icon="search" title="No projects match" desc={query ? `Nothing found for "${query}".` : "No projects with this status yet."} />
      )}

      {!error && !loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((p, i) => {
            const delayed = p.tasks.filter((t) => t.status === "delayed").length;
            const planned = Math.round((p.currentWeek / Math.max(p.durationWeeks, 1)) * 100);
            const behind = p.progress < planned - 5;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card hover className="cursor-pointer p-5" >
                  <button onClick={() => navigate(`/faculty/projects/${p.id}`)} className="w-full text-left">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                      <div className="min-w-[220px] flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display text-[15px] font-bold text-ink-900">{p.title}</p>
                          <StatusBadge status={p.status} />
                          <RiskBadge level={p.riskLevel} />
                        </div>
                        <p className="mt-1 text-xs text-ink-500">
                          {p.studentName} · {p.domain} · week {p.currentWeek}/{p.durationWeeks} · updated {timeAgo(p.lastUpdate)}
                        </p>
                      </div>
                      <div className="w-44">
                        <div className="mb-1 flex justify-between font-mono text-[10px] text-ink-400 uppercase">
                          <span>{p.phase}</span>
                          <span className="font-bold text-ink-700">{p.progress}%</span>
                        </div>
                        <ProgressBar value={p.progress} tone={p.status === "delayed" ? "clay" : "pine"} className="h-1.5" />
                      </div>
                      <div className="flex items-center gap-2">
                        {behind && <Badge tone="clay">behind plan</Badge>}
                        {delayed > 0 && <Badge tone="gold">{delayed} delayed</Badge>}
                        <Icon name="chevronRight" size={16} className="text-ink-300" />
                      </div>
                    </div>
                  </button>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </>
  );
}
