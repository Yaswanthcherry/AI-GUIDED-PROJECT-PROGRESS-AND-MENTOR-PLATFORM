import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useProjects, useToast } from "../../context/StoreContext";
import { api, MOCK_MODE } from "../../services/api";
import { aiRecommendations, milestoneProgress } from "../../services/generators";
import type { TaskStatus } from "../../types";
import { Button, Callout, Card, EmptyState, ProgressBar, Ring, Skeleton, TASK_META, TaskBadge } from "../../components/ui";
import { Icon } from "../../components/Icon";
import { cn } from "../../utils";
import { usePageTitle } from "../../hooks";

type Filter = "all" | TaskStatus;
const CYCLE: Record<TaskStatus, TaskStatus> = { pending: "in-progress", "in-progress": "done", done: "pending", delayed: "pending" };

export default function ProgressPage() {
  const { id } = useParams<{ id: string }>();
  const { loading, getProject, updateTaskStatus } = useProjects();
  const { push } = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [serverRecs, setServerRecs] = useState<string[] | null>(null);
  const [recsLoading, setRecsLoading] = useState(!MOCK_MODE);
  const project = id ? getProject(id) : undefined;
  usePageTitle(project ? `Progress · ${project.title}` : "Progress");

  const counts = useMemo(() => {
    const c: Record<TaskStatus, number> = { done: 0, "in-progress": 0, pending: 0, delayed: 0 };
    project?.tasks.forEach((t) => c[t.status]++);
    return c;
  }, [project]);

  // In real mode the Progress Agent's recommendations come from the backend
  // (GET /api/projects/:id/progress). In mock mode we compute them locally.
  useEffect(() => {
    if (MOCK_MODE || !project) return;
    let live = true;
    setRecsLoading(true);
    api.progress
      .summary(project.id)
      .then((s) => live && setServerRecs(s.recommendations))
      .catch(() => live && setServerRecs(null))
      .finally(() => live && setRecsLoading(false));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, project?.progress]);

  if (loading && !project) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-9 w-1/2" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[420px]" />
      </div>
    );
  }
  if (!project) {
    return (
      <EmptyState
        icon="chart"
        title="Project not found"
        desc="Pick a live project from the dashboard to track its plan."
        action={<Link to="/app"><Button variant="outline" icon="arrowLeft">Back to dashboard</Button></Link>}
      />
    );
  }

  const p = project;
  const recommendations = serverRecs ?? aiRecommendations(p);

  const change = async (taskId: string, status: TaskStatus, title: string) => {
    try {
      await updateTaskStatus(p.id, taskId, status);
      if (status === "done") push("success", "Task completed", title);
      else if (status === "delayed") push("info", "Task flagged as delayed", "The Planner will account for it in its recommendations.");
    } catch (e) {
      push("error", "Update failed", e instanceof Error ? e.message : undefined);
    }
  };

  const weekCells = Array.from({ length: p.durationWeeks }, (_, i) => {
    const w = i + 1;
    const tasks = p.tasks.filter((t) => t.week === w);
    const done = tasks.filter((t) => t.status === "done").length;
    const delayed = tasks.some((t) => t.status === "delayed");
    const ratio = tasks.length ? done / tasks.length : 0;
    return { w, ratio, delayed, current: w === p.currentWeek };
  });

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to={`/app/projects/${p.id}`} className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-400 transition hover:text-pine-700">
            <Icon name="arrowLeft" size={13} /> {p.title}
          </Link>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-[28px]">Progress Tracking</h1>
          <p className="mt-1 text-sm text-ink-500">Click a status pill to cycle it · flag blockers so the Planner re-recommends.</p>
        </div>
        <Link to={`/app/projects/${p.id}/mentor`}><Button variant="outline" icon="chat">Ask mentor about delays</Button></Link>
      </div>

      {/* headline stats */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-[220px_1fr]">
        <Card className="flex items-center justify-center gap-5 p-5">
          <Ring value={p.progress} size={96} stroke={9} />
          <div>
            <p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-ink-400 uppercase">Overall</p>
            <p className="font-display mt-1 text-2xl font-bold text-ink-900">{p.progress}%</p>
            <p className="mt-0.5 text-xs text-ink-500">week {p.currentWeek}/{p.durationWeeks}</p>
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {([["done", "Completed", "check"], ["in-progress", "In progress", "play"], ["pending", "Pending", "clock"], ["delayed", "Delayed", "warning"]] as [TaskStatus, string, "check" | "play" | "clock" | "warning"][]).map(([k, label, icon]) => (
            <Card key={k} className="p-4">
              <span className={cn("flex size-8 items-center justify-center rounded-lg", k === "done" ? "bg-pine-100 text-pine-700" : k === "in-progress" ? "bg-gold-100 text-gold-700" : k === "delayed" ? "bg-clay-100 text-clay-600" : "bg-ink-100 text-ink-500")}>
                <Icon name={icon} size={15} />
              </span>
              <p className="font-display mt-2.5 text-2xl leading-none font-bold text-ink-900">{counts[k]}</p>
              <p className="mt-1 text-xs text-ink-500">{label}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* week strip */}
      <Card className="mb-5 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-ink-900">Week-wise timeline</h3>
          <span className="font-mono text-[10px] tracking-wider text-ink-400 uppercase">task completion per week</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {weekCells.map((c) => (
            <div key={c.w} className="min-w-[42px] flex-1 text-center" title={`Week ${c.w}: ${Math.round(c.ratio * 100)}% done`}>
              <div className={cn(
                "relative h-12 overflow-hidden rounded-md border transition",
                c.current ? "border-pine-600 ring-2 ring-pine-200" : "border-ink-100",
                c.delayed && "border-clay-300",
              )}>
                <div className="absolute inset-x-0 bottom-0 bg-pine-500/80 transition-all duration-500" style={{ height: `${c.ratio * 100}%` }} />
                {c.delayed && <span className="absolute top-1 right-1 size-1.5 rounded-full bg-clay-500" />}
                <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold text-ink-700 mix-blend-luminosity">{c.w}</span>
              </div>
              <span className={cn("mt-1 block font-mono text-[8.5px] tracking-wider uppercase", c.current ? "font-bold text-pine-700" : "text-ink-400")}>{c.current ? "now" : `w${c.w}`}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* AI recommendations */}
      <div className="mb-5">
        {recsLoading ? (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <svg className="size-4 animate-spin text-pine-600" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <p className="font-mono text-[10.5px] tracking-widest text-ink-400 uppercase">Progress Agent composing recommendations…</p>
            </div>
            <div className="mt-3 space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-4/5" />
            </div>
          </Card>
        ) : (
          <Callout tone="pine" icon="spark" title="AI progress recommendations">
            <ul className="space-y-1.5">
              {recommendations.map((r) => <li key={r}>— {r}</li>)}
            </ul>
          </Callout>
        )}
      </div>

      {/* filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "pending", "in-progress", "done", "delayed"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 font-mono text-[10.5px] font-bold tracking-wider uppercase transition",
              filter === f ? "border-ink-900 bg-ink-900 text-paper-50" : "border-ink-200 bg-paper-50 text-ink-500 hover:border-ink-400",
            )}
          >
            {f === "all" ? `All · ${p.tasks.length}` : `${TASK_META[f].label} · ${counts[f]}`}
          </button>
        ))}
      </div>

      {/* milestones + tasks */}
      <div className="space-y-5">
        {p.milestones.map((m) => {
          const tasks = p.tasks.filter((t) => t.milestoneId === m.id && (filter === "all" || t.status === filter));
          const all = p.tasks.filter((t) => t.milestoneId === m.id);
          const prog = milestoneProgress(p, m);
          if (!tasks.length) return null;
          return (
            <Card key={m.id} className="overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 bg-paper-100/70 px-5 py-3.5">
                <span className={cn("flex size-7 items-center justify-center rounded-lg", prog === 100 ? "bg-pine-500 text-paper-50" : "bg-ink-900 text-pine-300")}>
                  <Icon name={prog === 100 ? "check" : "flag"} size={13} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-bold text-ink-900">{m.title}</p>
                  <p className="font-mono text-[10px] tracking-wider text-ink-400 uppercase">weeks {m.weeks[0]}–{m.weeks[1]} · {all.filter((t) => t.status === "done").length}/{all.length} tasks</p>
                </div>
                <div className="flex w-36 items-center gap-2">
                  <ProgressBar value={prog} className="h-1.5" tone={prog === 100 ? "pine" : "gold"} />
                  <span className="font-mono text-[10.5px] font-bold text-ink-600">{prog}%</span>
                </div>
              </div>
              <ul className="divide-y divide-ink-100">
                <AnimatePresence initial={false}>
                  {tasks.map((t) => (
                    <motion.li
                      key={t.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-wrap items-center gap-3 px-5 py-3"
                    >
                      <button
                        onClick={() => void change(t.id, t.status === "done" ? "pending" : "done", t.title)}
                        aria-label={`Toggle ${t.title}`}
                        className={cn(
                          "flex size-[18px] shrink-0 items-center justify-center rounded border-2 transition",
                          t.status === "done" ? "border-pine-500 bg-pine-500 text-paper-50" : "border-ink-300 bg-paper-50 text-transparent hover:border-pine-500",
                        )}
                      >
                        <Icon name="check" size={11} strokeWidth={3} />
                      </button>
                      <span className={cn("min-w-0 flex-1 text-sm font-medium", t.status === "done" ? "text-ink-400 line-through" : "text-ink-800")}>{t.title}</span>
                      <span className="font-mono text-[10px] tracking-wider text-ink-400 uppercase">w{t.week}</span>
                      <button onClick={() => void change(t.id, CYCLE[t.status], t.title)} className="transition hover:scale-105" title="Click to cycle status">
                        <TaskBadge status={t.status} />
                      </button>
                      <button
                        onClick={() => void change(t.id, t.status === "delayed" ? "pending" : "delayed", t.title)}
                        aria-label={t.status === "delayed" ? "Unflag delay" : "Flag as delayed"}
                        title={t.status === "delayed" ? "Unflag delay" : "Flag as delayed"}
                        className={cn("rounded-md p-1.5 transition", t.status === "delayed" ? "bg-clay-100 text-clay-600" : "text-ink-300 hover:bg-clay-100 hover:text-clay-600")}
                      >
                        <Icon name="warning" size={14} />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </Card>
          );
        })}
        {p.tasks.filter((t) => filter === "all" || t.status === filter).length === 0 && (
          <EmptyState icon="check" title="Nothing matches this filter" desc="Change the filter above, or enjoy the empty board — it won't last." />
        )}
      </div>
    </>
  );
}
