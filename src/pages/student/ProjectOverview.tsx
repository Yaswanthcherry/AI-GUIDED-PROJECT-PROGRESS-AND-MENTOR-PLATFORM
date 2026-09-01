import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useProjects, useToast } from "../../context/StoreContext";
import { api } from "../../services/api";
import { milestoneProgress } from "../../services/generators";
import { Badge, Button, Card, EmptyState, PageHead, PhaseStepper, ProgressBar, RiskBadge, Ring, Skeleton, StatusBadge } from "../../components/ui";
import type { IconName } from "../../components/Icon";
import { Icon } from "../../components/Icon";
import { fmtDateFull, timeAgo } from "../../utils";
import { usePageTitle } from "../../hooks";

const QUICK_LINKS: { to: string; label: string; desc: string; icon: IconName }[] = [
  { to: "blueprint", label: "AI Blueprint", desc: "Evaluation scores & verdict", icon: "compass" },
  { to: "blueprint/scope", label: "Scope & Requirements", desc: "Objectives, FR / NFR", icon: "target" },
  { to: "blueprint/technology", label: "Technology", desc: "Stack picks with rationale", icon: "cpu" },
  { to: "blueprint/architecture", label: "Architecture", desc: "Layers & data flow", icon: "layers" },
  { to: "blueprint/timeline", label: "Timeline", desc: "Week-wise milestones", icon: "calendar" },
  { to: "blueprint/risks", label: "Risk Assessment", desc: "Register & mitigations", icon: "warning" },
];

export default function ProjectOverview() {
  const { id } = useParams<{ id: string }>();
  const { loading, getProject, setProject, updateTaskStatus } = useProjects();
  const { push } = useToast();
  const navigate = useNavigate();
  const project = id ? getProject(id) : undefined;
  usePageTitle(project?.title ?? "Project");

  const [regenerating, setRegenerating] = useState(false);

  if (loading && !project) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-2/3" />
        <div className="grid gap-5 lg:grid-cols-3">
          <Skeleton className="h-[280px] lg:col-span-2" />
          <Skeleton className="h-[280px]" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <EmptyState
        icon="folder"
        title="Project not found"
        desc="It may have been removed, or the link is stale. Head back to the dashboard to pick a live project."
        action={<Link to="/app"><Button variant="outline" icon="arrowLeft">Back to dashboard</Button></Link>}
      />
    );
  }

  const p = project;
  const nextTask = p.tasks.find((t) => t.status === "in-progress") ?? p.tasks.filter((t) => t.status === "pending").sort((a, b) => a.week - b.week)[0];

  const regenerate = async () => {
    setRegenerating(true);
    try {
      const updated = await api.projects.regenerateBlueprint(p.id);
      setProject(updated);
      push("success", "Blueprint regenerated", "Agent scores, scope and plans were refreshed from your original input.");
    } catch (e) {
      push("error", "Regeneration failed", e instanceof Error ? e.message : undefined);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <>
      <PageHead
        back={
          <Link to="/app" className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-400 transition hover:text-pine-700">
            <Icon name="arrowLeft" size={13} /> Dashboard
          </Link>
        }
        title={p.title}
        desc={`${p.input.idea.slice(0, 130)}${p.input.idea.length > 130 ? "…" : ""}`}
        actions={
          <>
            <Button variant="outline" icon="refresh" loading={regenerating} onClick={() => void regenerate()}>
              Regenerate blueprint
            </Button>
            <Button icon="chat" onClick={() => navigate(`/app/projects/${p.id}/mentor`)}>Ask the mentor</Button>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <StatusBadge status={p.status} />
        <RiskBadge level={p.riskLevel} />
        <Badge tone="ink" dot={false}>{p.domain}</Badge>
        <Badge tone="paper" dot={false}>{p.level}</Badge>
        <Badge tone="paper" dot={false}>{p.teamSize} member{p.teamSize > 1 ? "s" : ""}</Badge>
        <span className="ml-auto font-mono text-[10.5px] tracking-wider text-ink-400 uppercase">Created {fmtDateFull(p.createdAt)} · updated {timeAgo(p.lastUpdate)}</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-6">
              <Ring value={p.progress} size={110} stroke={10}>
                <span className="font-display text-[26px] font-bold text-ink-900">{p.progress}%</span>
                <span className="font-mono text-[9px] tracking-[0.16em] text-ink-400 uppercase">complete</span>
              </Ring>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10.5px] font-semibold tracking-[0.2em] text-ink-400 uppercase">Current phase</p>
                <p className="font-display mt-1 text-xl font-bold text-ink-900">{p.phase}</p>
                <p className="mt-1 text-sm text-ink-500">Week {p.currentWeek} of {p.durationWeeks} · {p.tasks.filter((t) => t.status === "done").length}/{p.tasks.length} tasks done</p>
                <div className="mt-4 overflow-x-auto pb-1"><PhaseStepper phase={p.phase} /></div>
              </div>
            </div>
          </Card>

          {nextTask && (
            <Card className="flex flex-wrap items-center justify-between gap-4 border-gold-200 bg-gold-100/40 p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 items-center justify-center rounded-lg bg-gold-500 text-ink-950"><Icon name="flag" size={17} /></span>
                <div>
                  <p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-gold-700 uppercase">Next task · week {nextTask.week}</p>
                  <p className="font-display mt-1 text-base font-bold text-ink-900">{nextTask.title}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {nextTask.status !== "in-progress" && (
                  <Button variant="outline" size="sm" icon="play" onClick={() => void updateTaskStatus(p.id, nextTask.id, "in-progress").then(() => push("info", "Task started", nextTask.title))}>
                    Start
                  </Button>
                )}
                <Button size="sm" icon="check" onClick={() => void updateTaskStatus(p.id, nextTask.id, "done").then(() => push("success", "Task completed", nextTask.title))}>
                  Mark done
                </Button>
              </div>
            </Card>
          )}

          <div>
            <h2 className="mb-3 font-mono text-[10.5px] font-semibold tracking-[0.2em] text-ink-400 uppercase">Blueprint sections</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {QUICK_LINKS.map((q) => (
                <Link key={q.to} to={`/app/projects/${p.id}/${q.to}`}>
                  <Card hover className="h-full p-4">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-ink-900 text-pine-300"><Icon name={q.icon} size={16} /></span>
                    <p className="font-display mt-3 text-[14.5px] font-bold text-ink-900">{q.label}</p>
                    <p className="mt-0.5 text-xs text-ink-500">{q.desc}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-ink-900">Milestones</h3>
              <Link to={`/app/projects/${p.id}/progress`} className="text-xs font-semibold text-pine-700 hover:underline">Progress board</Link>
            </div>
            <ul className="space-y-3.5">
              {p.milestones.map((m) => {
                const prog = milestoneProgress(p, m);
                return (
                  <li key={m.id}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <p className="text-sm font-semibold text-ink-800">{m.title}</p>
                      <span className="font-mono text-[10.5px] text-ink-400">w{m.weeks[0]}–{m.weeks[1]} · <strong className={prog === 100 ? "text-pine-600" : "text-ink-600"}>{prog}%</strong></span>
                    </div>
                    <ProgressBar value={prog} tone={prog === 100 ? "pine" : "gold"} className="h-1.5" />
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="font-display mb-4 text-base font-bold text-ink-900">Project facts</h3>
            <dl className="space-y-3 text-sm">
              {[
                ["Domain", p.domain],
                ["Level", p.level],
                ["Team", `${p.teamSize} member${p.teamSize > 1 ? "s" : ""}`],
                ["Duration", `${p.durationWeeks} weeks`],
                ["Planned effort", `${p.tasks.length} tasks · ${p.milestones.length} milestones`],
                ["Open risks", `${p.blueprint.risks.filter((r) => r.severity !== "Low").length} worth watching`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-ink-100 pb-2.5 last:border-0 last:pb-0">
                  <dt className="font-mono text-[10.5px] font-semibold tracking-wider text-ink-400 uppercase">{k}</dt>
                  <dd className="text-right font-medium text-ink-700">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="p-5">
            <h3 className="font-display mb-3 text-base font-bold text-ink-900">Recommended stack</h3>
            <ul className="space-y-2.5">
              {p.blueprint.technology.slice(0, 4).map((t) => (
                <li key={t.layer} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-mono text-[10px] font-semibold tracking-wider text-ink-400 uppercase">{t.layer}</span>
                  <span className="text-right font-semibold text-ink-800">{t.pick.split("(")[0].trim()}</span>
                </li>
              ))}
            </ul>
            <Link to={`/app/projects/${p.id}/blueprint/technology`} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-pine-700 hover:underline">
              Full rationale <Icon name="arrowRight" size={12} />
            </Link>
          </Card>

          <Card className="p-5">
            <h3 className="font-display mb-3 text-base font-bold text-ink-900">Activity</h3>
            <ol className="relative space-y-4 border-l border-ink-100 pl-4">
              {p.activity.slice(0, 6).map((a) => (
                <li key={a.id} className="relative">
                  <span className={`absolute top-1 -left-[21.5px] size-2.5 rounded-full ring-4 ring-paper-50 ${a.kind === "ai" ? "bg-pine-500" : a.kind === "user" ? "bg-gold-500" : "bg-ink-300"}`} />
                  <p className="text-[13px] leading-snug text-ink-700">{a.text}</p>
                  <p className="mt-0.5 font-mono text-[10px] tracking-wider text-ink-400 uppercase">{a.kind} · {timeAgo(a.ts)}</p>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="border-pine-200 bg-pine-50/70 p-5">
            <p className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.18em] text-pine-800 uppercase">
              <Icon name="spark" size={13} /> Agent verdict
            </p>
            <p className="font-display mt-2 text-lg font-bold text-ink-900">{p.blueprint.evaluation.verdict}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-600">
              Feasibility {p.blueprint.evaluation.scores.feasibility}/100 · Innovation {p.blueprint.evaluation.scores.innovation}/100 · Academic fit {p.blueprint.evaluation.scores.academicSuitability}/100
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
