import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth, useProjects } from "../../context/StoreContext";
import { aiRecommendations } from "../../services/generators";
import { BurndownChart } from "../../components/charts";
import { Badge, Button, Card, EmptyState, ErrorState, PageHead, ProgressBar, Ring, RiskBadge, Skeleton, Stat, StatusBadge } from "../../components/ui";
import { Icon } from "../../components/Icon";
import { cn, greeting, timeAgo, todayLong } from "../../utils";
import { usePageTitle } from "../../hooks";

export default function Dashboard() {
  usePageTitle("Dashboard");
  const { user } = useAuth();
  const { projects, loading, error, refresh } = useProjects();
  const navigate = useNavigate();

  const active = useMemo(() => projects.filter((p) => p.status !== "completed"), [projects]);
  const featured = useMemo(
    () => [...active].sort((a, b) => b.lastUpdate.localeCompare(a.lastUpdate))[0] ?? projects[0],
    [active, projects],
  );
  const avgProgress = projects.length ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length) : 0;

  const flagged = useMemo(
    () =>
      [...projects]
        .flatMap((p) => [
          ...p.tasks.filter((t) => t.status === "delayed").map((t) => ({ id: `${p.id}-${t.id}`, pid: p.id, title: p.title, text: t.title, kind: "delayed" as const })),
          ...p.blueprint.risks.filter((r) => r.severity === "High").slice(0, 1).map((r) => ({ id: `${p.id}-${r.id}`, pid: p.id, title: p.title, text: r.risk, kind: "risk" as const })),
        ])
        .slice(0, 5),
    [projects],
  );

  const recs = useMemo(() => (featured ? aiRecommendations(featured) : []), [featured]);
  const activity = useMemo(
    () =>
      projects
        .flatMap((p) => p.activity.slice(0, 3).map((a) => ({ ...a, pid: p.id, ptitle: p.title })))
        .sort((a, b) => b.ts.localeCompare(a.ts))
        .slice(0, 7),
    [projects],
  );

  return (
    <>
      <PageHead
        title={`${greeting()}, ${user?.name.split(" ")[0] ?? "there"}`}
        desc={`${todayLong()} — here is where your projects stand.`}
        actions={
          <Button icon="plus" onClick={() => navigate("/app/projects/new")}>
            New project
          </Button>
        }
      />

      {error && <ErrorState message={error} onRetry={() => void refresh()} />}

      {!error && loading && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[104px]" />
            ))}
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <Skeleton className="h-[360px] lg:col-span-2" />
            <Skeleton className="h-[360px]" />
          </div>
        </div>
      )}

      {!error && !loading && projects.length === 0 && (
        <EmptyState
          icon="compass"
          title="No projects yet"
          desc="Feed the orchestrator an idea and six agents will turn it into a scored, scheduled, de-risked blueprint."
          action={
            <Button icon="spark" size="lg" onClick={() => navigate("/app/projects/new")}>
              Create your first project
            </Button>
          }
        />
      )}

      {!error && !loading && projects.length > 0 && (
        <>
          {/* stats */}
          <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Active projects" value={active.length} sub={`${projects.length} total`} icon="folder" tone="pine" />
            <Stat label="Average progress" value={`${avgProgress}%`} sub={<ProgressBar value={avgProgress} className="h-1.5 w-24" />} icon="chart" tone="gold" />
            <Stat
              label="Current milestone"
              value={<span className="text-[17px] leading-tight">{featured?.phase ?? "—"}</span>}
              sub={featured ? `${featured.title}` : undefined}
              icon="flag"
            />
            <Stat
              label="Upcoming task"
              value={<span className="text-[15px] leading-tight">{featured?.nextTask ?? "—"}</span>}
              sub={featured ? `week ${featured.currentWeek}/${featured.durationWeeks}` : undefined}
              icon="calendar"
              tone="pine"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {/* featured project */}
            {featured && (
              <Card className="p-6 lg:col-span-2">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] font-semibold tracking-[0.2em] text-ink-400 uppercase">Focus project</p>
                    <Link to={`/app/projects/${featured.id}`} className="font-display mt-1 block text-xl font-bold text-ink-900 transition hover:text-pine-700">
                      {featured.title}
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={featured.status} />
                      <RiskBadge level={featured.riskLevel} />
                      <Badge tone="paper" dot={false}>{featured.domain}</Badge>
                      <span className="font-mono text-[10px] tracking-wider text-ink-400 uppercase">week {featured.currentWeek}/{featured.durationWeeks}</span>
                    </div>
                  </div>
                  <Ring value={featured.progress} size={92} stroke={9}>
                    <span className="font-display text-xl font-bold text-ink-900">{featured.progress}%</span>
                  </Ring>
                </div>
                <div className="mt-5">
                  <p className="mb-2 flex items-center justify-between font-mono text-[10px] font-semibold tracking-[0.18em] text-ink-400 uppercase">
                    <span>Planned vs actual completion</span>
                    <Link to={`/app/projects/${featured.id}/progress`} className="normal-case hover:text-pine-700">Progress board →</Link>
                  </p>
                  <BurndownChart project={featured} />
                </div>
                <div className="mt-5 flex flex-wrap gap-2 border-t border-ink-100 pt-5">
                  <Button size="sm" icon="compass" onClick={() => navigate(`/app/projects/${featured.id}/blueprint`)}>Blueprint</Button>
                  <Button size="sm" variant="outline" icon="chat" onClick={() => navigate(`/app/projects/${featured.id}/mentor`)}>Ask mentor</Button>
                  <Button size="sm" variant="outline" icon="file" onClick={() => navigate(`/app/projects/${featured.id}/docs`)}>Documents</Button>
                </div>
              </Card>
            )}

            {/* right rail */}
            <div className="space-y-5">
              <Card className="p-5">
                <h3 className="font-display flex items-center gap-2 text-sm font-bold text-ink-900">
                  <Icon name="spark" size={15} className="text-pine-600" /> AI recommendations
                </h3>
                <ul className="mt-3 space-y-3">
                  {recs.map((r) => (
                    <li key={r} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-600">
                      <span className="mt-[8px] size-1.5 shrink-0 rounded-full bg-pine-500" />
                      {r}
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-5">
                <h3 className="font-display flex items-center gap-2 text-sm font-bold text-ink-900">
                  <Icon name="warning" size={15} className="text-clay-600" /> Risk alerts
                </h3>
                {flagged.length === 0 ? (
                  <p className="mt-3 text-[13px] text-ink-500">Nothing flagged — the agents are watching.</p>
                ) : (
                  <ul className="mt-3 space-y-2.5">
                    {flagged.map((f) => (
                      <li key={f.id}>
                        <Link
                          to={`/app/projects/${f.pid}/${f.kind === "risk" ? "blueprint/risks" : "progress"}`}
                          className="flex items-start gap-2.5 rounded-lg border border-ink-100 bg-paper-100/70 px-3 py-2.5 transition hover:border-clay-300"
                        >
                          <span className={cn("mt-1 size-2 shrink-0 rounded-full", f.kind === "risk" ? "bg-clay-500" : "bg-gold-500")} />
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-medium text-ink-800">{f.text}</span>
                            <span className="font-mono text-[9px] tracking-wider text-ink-400 uppercase">{f.kind === "risk" ? "high risk" : "delayed"} · {f.title}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>

          {/* project grid + activity */}
          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="mb-3 font-mono text-[10.5px] font-semibold tracking-[0.2em] text-ink-400 uppercase">Your projects</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {projects.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Link to={`/app/projects/${p.id}`}>
                      <Card hover className="h-full p-5">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-display text-[15px] leading-snug font-bold text-ink-900">{p.title}</p>
                          <StatusBadge status={p.status} />
                        </div>
                        <p className="mt-1 text-xs text-ink-500">{p.domain} · week {p.currentWeek}/{p.durationWeeks}</p>
                        <div className="mt-4 flex items-center gap-3">
                          <ProgressBar value={p.progress} className="flex-1" tone={p.status === "delayed" ? "clay" : "pine"} />
                          <span className="font-mono text-[11px] font-bold text-ink-700">{p.progress}%</span>
                        </div>
                        <p className="mt-3 truncate text-xs text-ink-500">
                          <span className="font-semibold text-ink-700">Next:</span> {p.nextTask}
                        </p>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 font-mono text-[10.5px] font-semibold tracking-[0.2em] text-ink-400 uppercase">Recent activity</h2>
              <Card className="p-5">
                <ol className="relative space-y-4 border-l border-ink-100 pl-4">
                  {activity.map((a) => (
                    <li key={`${a.pid}-${a.id}`} className="relative">
                      <span className={cn("absolute top-1 -left-[21.5px] size-2.5 rounded-full ring-4 ring-paper-50", a.kind === "ai" ? "bg-pine-500" : a.kind === "user" ? "bg-gold-500" : "bg-ink-300")} />
                      <p className="text-[13px] leading-snug text-ink-700">{a.text}</p>
                      <p className="mt-0.5 font-mono text-[9.5px] tracking-wider text-ink-400 uppercase">{a.kind} · {a.ptitle.slice(0, 28)} · {timeAgo(a.ts)}</p>
                    </li>
                  ))}
                </ol>
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  );
}
