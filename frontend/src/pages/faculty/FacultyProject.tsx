import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useProjects } from "../../context/StoreContext";
import { api, type FacultyFeedback } from "../../services/api";
import { milestoneProgress } from "../../services/generators";
import { Badge, Button, Card, EmptyState, PageHead, PhaseStepper, ProgressBar, RiskBadge, Ring, Skeleton, StatusBadge, TaskBadge, Textarea } from "../../components/ui";
import { Icon } from "../../components/Icon";
import { WeeklyLoadChart } from "../../components/charts";
import { fmtDateFull, timeAgo } from "../../utils";
import { usePageTitle } from "../../hooks";
import type { FeedbackType } from "../../types";

export default function FacultyProject() {
  const { id } = useParams<{ id: string }>();
  const { loading, getProject } = useProjects();
  const navigate = useNavigate();
  const project = id ? getProject(id) : undefined;
  usePageTitle(project ? `Monitoring · ${project.title}` : "Monitoring");

  const [insights, setInsights] = useState<string[] | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [feedback, setFeedback] = useState<FacultyFeedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("message");
  const [feedbackContent, setFeedbackContent] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);

  const loadInsights = (pid: string) => {
    setInsightsLoading(true);
    api.insights
      .for(pid)
      .then(setInsights)
      .catch(() => setInsights(["Insight service unavailable — retry in a moment."]))
      .finally(() => setInsightsLoading(false));
  };

  const loadFeedback = (pid: string) => {
    setFeedbackLoading(true);
    api.faculty
      .listFeedback(pid)
      .then(setFeedback)
      .catch(() => setFeedback([]))
      .finally(() => setFeedbackLoading(false));
  };

  const sendFeedback = async () => {
    if (!project || !feedbackContent.trim()) return;
    setSendingFeedback(true);
    try {
      const newFeedback = await api.faculty.sendFeedback(project.id, {
        type: feedbackType,
        content: feedbackContent.trim(),
      });
      setFeedback([newFeedback, ...feedback]);
      setFeedbackContent("");
    } catch (e) {
      console.error("Failed to send feedback:", e);
    } finally {
      setSendingFeedback(false);
    }
  };

  useEffect(() => {
    if (project && insights === null) loadInsights(project.id);
    if (project && feedback.length === 0) loadFeedback(project.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  if (loading && !project) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-9 w-2/3" />
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }
  if (!project) {
    return (
      <EmptyState
        icon="users"
        title="Project not found"
        desc="This monitoring link is stale. Return to the portfolio list."
        action={<Link to="/faculty/projects"><Button variant="outline" icon="arrowLeft">Student projects</Button></Link>}
      />
    );
  }

  const p = project;
  const delayedTasks = p.tasks.filter((t) => t.status === "delayed");
  const behindPlan = p.progress < Math.round((p.currentWeek / p.durationWeeks) * 100) - 5;

  return (
    <>
      <PageHead
        back={
          <Link to="/faculty/projects" className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-400 transition hover:text-pine-700">
            <Icon name="arrowLeft" size={13} /> Student projects
          </Link>
        }
        title={p.title}
        desc={`Submitted by ${p.studentName} · ${p.level} · team of ${p.teamSize}`}
        actions={
          <>
            <Badge tone="paper" dot={false}>created {fmtDateFull(p.createdAt)}</Badge>
            <Button variant="outline" icon="refresh" onClick={() => { loadInsights(p.id); loadFeedback(p.id); }} loading={insightsLoading}>Refresh</Button>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <StatusBadge status={p.status} />
        <RiskBadge level={p.riskLevel} />
        <Badge tone="ink" dot={false}>{p.domain}</Badge>
        <Badge tone="paper" dot={false}>week {p.currentWeek}/{p.durationWeeks}</Badge>
        <span className="ml-auto font-mono text-[10.5px] tracking-wider text-ink-400 uppercase">last update {timeAgo(p.lastUpdate)}</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-6">
              <Ring value={p.progress} size={104} stroke={9}>
                <span className="font-display text-[24px] font-bold text-ink-900">{p.progress}%</span>
                <span className="font-mono text-[8.5px] tracking-[0.14em] text-ink-400 uppercase">done</span>
              </Ring>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-lg font-bold text-ink-900">{p.phase}</p>
                  {behindPlan ? <Badge tone="clay">behind plan</Badge> : p.status !== "completed" ? <Badge tone="pine">on plan</Badge> : null}
                </div>
                <p className="mt-1 text-sm text-ink-500">
                  Plan expects ~{Math.round((p.currentWeek / p.durationWeeks) * 100)}% at week {p.currentWeek}; actual is {p.progress}%.
                </p>
                <div className="mt-4 overflow-x-auto pb-1"><PhaseStepper phase={p.phase} /></div>
              </div>
            </div>
            <div className="mt-6 border-t border-ink-100 pt-5">
              <p className="mb-3 font-mono text-[10px] font-semibold tracking-[0.18em] text-ink-400 uppercase">Task throughput by week</p>
              <WeeklyLoadChart project={p} />
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-display mb-4 text-base font-bold text-ink-900">Milestone completion</h3>
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

          <Card className="overflow-hidden">
            <div className="border-b border-ink-100 px-5 py-4">
              <h3 className="font-display text-base font-bold text-ink-900">Task ledger</h3>
              <p className="text-xs text-ink-500">{p.tasks.filter((t) => t.status === "done").length} done · {p.tasks.filter((t) => t.status !== "done").length} open · {delayedTasks.length} delayed</p>
            </div>
            <ul className="max-h-[380px] divide-y divide-ink-100 overflow-y-auto">
              {p.tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="font-mono text-[10px] tracking-wider text-ink-400 uppercase">w{t.week}</span>
                  <span className={`min-w-0 flex-1 truncate text-sm ${t.status === "done" ? "text-ink-400 line-through" : "text-ink-700"}`}>{t.title}</span>
                  <TaskBadge status={t.status} />
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="border-pine-200 bg-pine-50/60 p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.18em] text-pine-800 uppercase">
                <Icon name="spark" size={13} /> AI-generated insights
              </p>
              <button onClick={() => loadInsights(p.id)} className="text-ink-400 transition hover:text-pine-700" aria-label="Regenerate insights">
                <Icon name="refresh" size={14} />
              </button>
            </div>
            {insightsLoading || insights === null ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}
                <p className="pt-1 text-center font-mono text-[9.5px] tracking-widest text-ink-400 uppercase">analysts composing…</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {insights.map((ins, i) => (
                  <motion.li key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-700">
                    <span className="mt-[8px] size-1.5 shrink-0 rounded-full bg-pine-500" />
                    {ins}
                  </motion.li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="font-display mb-3 text-base font-bold text-ink-900">Risk & issue monitoring</h3>
            <ul className="space-y-3">
              {p.blueprint.risks.slice(0, 4).map((r) => (
                <li key={r.id} className="rounded-lg border border-ink-100 bg-paper-100/70 p-3">
                  <div className="flex items-center gap-2">
                    <Badge tone={r.severity === "High" ? "clay" : r.severity === "Medium" ? "gold" : "pine"} dot={false}>{r.severity}</Badge>
                    <span className="font-mono text-[9px] tracking-wider text-ink-400 uppercase">{r.category}</span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-snug text-ink-700">{r.risk}</p>
                </li>
              ))}
            </ul>
            {delayedTasks.length > 0 && (
              <div className="mt-4 rounded-lg border border-clay-200 bg-clay-100/60 p-3.5">
                <p className="flex items-center gap-2 font-mono text-[9.5px] font-bold tracking-[0.16em] text-clay-700 uppercase">
                  <Icon name="warning" size={12} /> {delayedTasks.length} delayed task{delayedTasks.length > 1 ? "s" : ""}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {delayedTasks.map((t) => (
                    <li key={t.id} className="text-[13px] text-ink-700">— {t.title} <span className="font-mono text-[9.5px] text-ink-400">(w{t.week})</span></li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="font-display mb-3 text-base font-bold text-ink-900">Student activity</h3>
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

          {/* Faculty Guidance Panel */}
          <Card className="p-5">
            <h3 className="font-display mb-3 text-base font-bold text-ink-900 flex items-center gap-2">
              <Icon name="messageCircle" size={16} /> Faculty Guidance
            </h3>
            
            {/* Feedback Type Selector */}
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                { value: "message", label: "Message", icon: "messageCircle" },
                { value: "feedback", label: "Feedback", icon: "star" },
                { value: "recommendation", label: "Recommendation", icon: "lightbulb" },
                { value: "task_suggestion", label: "Task", icon: "checkSquare" },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFeedbackType(type.value as FeedbackType)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    feedbackType === type.value
                      ? "bg-pine-600 text-white"
                      : "bg-paper-100 text-ink-600 hover:bg-paper-200"
                  }`}
                >
                  <Icon name={type.icon as any} size={12} />
                  {type.label}
                </button>
              ))}
            </div>

            {/* Feedback Input */}
            <Textarea
              value={feedbackContent}
              onChange={(e) => setFeedbackContent(e.target.value)}
              placeholder={
                feedbackType === "task_suggestion"
                  ? "Suggest a new task for the student..."
                  : feedbackType === "recommendation"
                  ? "Provide a recommendation for the project..."
                  : "Send a message or feedback to the student..."
              }
              className="min-h-[80px] mb-3 text-sm"
            />
            <Button
              onClick={sendFeedback}
              loading={sendingFeedback}
              disabled={!feedbackContent.trim()}
              className="w-full"
              icon="send"
            >
              Send {feedbackType.replace("_", " ")}
            </Button>

            {/* Feedback History */}
            {feedback.length > 0 && (
              <div className="mt-4 pt-4 border-t border-ink-100">
                <p className="font-mono text-[9.5px] tracking-wider text-ink-400 uppercase mb-2">Recent guidance</p>
                <ul className="space-y-3 max-h-[200px] overflow-y-auto">
                  {feedback.slice(0, 5).map((f) => (
                    <li key={f.id} className="text-xs">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge 
                          tone={
                            f.type === "task_suggestion" ? "gold" :
                            f.type === "recommendation" ? "pine" :
                            f.type === "feedback" ? "clay" : "ink"
                          }
                          dot={false}
                          className="text-[9px] px-1.5 py-0.5"
                        >
                          {f.type.replace("_", " ")}
                        </Badge>
                        <span className="text-ink-400">{f.facultyName}</span>
                        <span className="ml-auto font-mono text-[9px] text-ink-300">{timeAgo(f.createdAt)}</span>
                      </div>
                      <p className="text-ink-700 leading-relaxed">{f.content}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <button
            onClick={() => navigate("/faculty")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink-200 bg-paper-50 py-3 text-sm font-semibold text-ink-600 transition hover:border-pine-400 hover:text-pine-700"
          >
            <Icon name="arrowLeft" size={15} /> Back to dashboard
          </button>
        </div>
      </div>
    </>
  );
}
