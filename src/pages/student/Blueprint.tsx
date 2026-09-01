import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useProjects } from "../../context/StoreContext";
import { Badge, Button, Card, Callout, EmptyState, ProgressBar, Skeleton } from "../../components/ui";
import { Icon } from "../../components/Icon";
import type { IconName } from "../../components/Icon";
import type { ArchLayer, Blueprint, RiskItem, ScopeDefinition, TechPick, WeekPlan } from "../../types";
import { cn, fmtDateFull } from "../../utils";
import { usePageTitle } from "../../hooks";

export type BlueprintSection = "evaluation" | "scope" | "technology" | "architecture" | "timeline" | "risks";

const TABS: { id: BlueprintSection; label: string; icon: IconName }[] = [
  { id: "evaluation", label: "Idea Evaluation", icon: "gauge" },
  { id: "scope", label: "Scope", icon: "target" },
  { id: "technology", label: "Technology", icon: "cpu" },
  { id: "architecture", label: "Architecture", icon: "layers" },
  { id: "timeline", label: "Timeline", icon: "calendar" },
  { id: "risks", label: "Risks", icon: "warning" },
];

export default function BlueprintPage({ section }: { section: BlueprintSection }) {
  const { id } = useParams<{ id: string }>();
  const { loading, getProject } = useProjects();
  const navigate = useNavigate();
  const project = id ? getProject(id) : undefined;
  usePageTitle(project ? `Blueprint · ${project.title}` : "Blueprint");

  if (loading && !project) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[460px]" />
      </div>
    );
  }

  if (!project) {
    return (
      <EmptyState
        icon="compass"
        title="No blueprint to show"
        desc="Blueprints are generated when a project is created. Start one and the agents will do the rest."
        action={<Link to="/app/projects/new"><Button icon="plus">Create project</Button></Link>}
      />
    );
  }

  const p = project;
  const b = p.blueprint;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to={`/app/projects/${p.id}`} className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-400 transition hover:text-pine-700">
            <Icon name="arrowLeft" size={13} /> {p.title}
          </Link>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-[28px]">AI Project Blueprint</h1>
          <p className="mt-1 text-sm text-ink-500">
            Composed by the orchestrator on {fmtDateFull(b.generatedAt)} · every section feeds your tasks, docs and mentor.
          </p>
        </div>
        <Badge tone="pine">verdict: {b.evaluation.verdict}</Badge>
      </div>

      <div className="mb-6 flex gap-1.5 overflow-x-auto rounded-xl border border-ink-100 bg-paper-50 p-1.5 shadow-card">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => navigate(`/app/projects/${p.id}/blueprint${t.id === "evaluation" ? "" : `/${t.id}`}`)}
            aria-current={t.id === section ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition",
              t.id === section ? "bg-ink-900 text-paper-50 shadow-card" : "text-ink-500 hover:bg-ink-900/5 hover:text-ink-800",
            )}
          >
            <Icon name={t.icon} size={14} />
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={section} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
          {section === "evaluation" && <EvaluationView bp={b} projectTitle={p.title} />}
          {section === "scope" && <ScopeView scope={b.scope} />}
          {section === "technology" && <TechnologyView tech={b.technology} />}
          {section === "architecture" && <ArchitectureView layers={b.architecture.layers} flow={b.architecture.dataFlow} />}
          {section === "timeline" && <TimelineView weeks={b.timeline} projectId={p.id} />}
          {section === "risks" && <RiskView risks={b.risks} />}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

/* ================= A. Idea Evaluation ================= */

function ScoreDial({ label, value, tone }: { label: string; value: number; tone: "pine" | "gold" | "clay" }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-ink-400 uppercase">{label}</span>
        <span className="font-display text-lg font-bold text-ink-900">{value}</span>
      </div>
      <ProgressBar value={value} tone={tone} className="mt-1.5 h-2" />
    </div>
  );
}

function EvaluationView({ bp, projectTitle }: { bp: Blueprint; projectTitle: string }) {
  const e = bp.evaluation;
  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-ink-900">Agent scores</h3>
          <Badge tone={e.verdict === "Revise" ? "clay" : e.verdict === "Go with caution" ? "gold" : "pine"}>{e.verdict}</Badge>
        </div>
        <div className="mt-5 space-y-5">
          <ScoreDial label="Feasibility" value={e.scores.feasibility} tone="pine" />
          <ScoreDial label="Innovation" value={e.scores.innovation} tone="gold" />
          <ScoreDial label="Academic suitability" value={e.scores.academicSuitability} tone="pine" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-ink-100 pt-5">
          <div>
            <p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-ink-400 uppercase">Difficulty</p>
            <p className={cn("font-display mt-1 text-lg font-bold", e.difficulty === "High" ? "text-clay-600" : e.difficulty === "Moderate" ? "text-gold-600" : "text-pine-700")}>{e.difficulty}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-ink-400 uppercase">Estimated duration</p>
            <p className="font-display mt-1 text-lg font-bold text-ink-900">{e.estimatedDuration}</p>
          </div>
        </div>
      </Card>

      <div className="space-y-5">
        <Callout tone={e.verdict === "Revise" ? "clay" : e.verdict === "Go with caution" ? "gold" : "pine"} title={`Recommendation for “${projectTitle}”`} icon="spark">
          {e.recommendation}
        </Callout>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <h4 className="font-display flex items-center gap-2 text-sm font-bold text-pine-700">
              <Icon name="check" size={14} /> Strengths
            </h4>
            <ul className="mt-3 space-y-2.5">
              {e.strengths.map((s) => (
                <li key={s} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-600">
                  <span className="mt-[8px] size-1.5 shrink-0 rounded-full bg-pine-500" />
                  {s}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <h4 className="font-display flex items-center gap-2 text-sm font-bold text-clay-600">
              <Icon name="warning" size={14} /> Concerns
            </h4>
            <ul className="mt-3 space-y-2.5">
              {e.concerns.map((s) => (
                <li key={s} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-600">
                  <span className="mt-[8px] size-1.5 shrink-0 rounded-full bg-clay-500" />
                  {s}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ================= B. Scope ================= */

function ListBlock({ title, items, icon, tone = "ink", numbered = false }: { title: string; items: string[]; icon: IconName; tone?: "pine" | "gold" | "clay" | "ink"; numbered?: boolean }) {
  return (
    <Card className="p-5">
      <h4 className="font-display flex items-center gap-2 text-sm font-bold text-ink-900">
        <span className={cn("flex size-7 items-center justify-center rounded-lg", tone === "pine" ? "bg-pine-100 text-pine-700" : tone === "gold" ? "bg-gold-100 text-gold-700" : tone === "clay" ? "bg-clay-100 text-clay-600" : "bg-ink-100 text-ink-600")}>
          <Icon name={icon} size={14} />
        </span>
        {title}
        <span className="ml-auto font-mono text-[10px] text-ink-400">{items.length}</span>
      </h4>
      <ul className="mt-3.5 space-y-2.5">
        {items.map((it, i) => (
          <li key={it + i} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-600">
            {numbered ? (
              <span className="font-mono text-[11px] font-bold text-pine-700">{String(i + 1).padStart(2, "0")}</span>
            ) : (
              <span className={cn("mt-[8px] size-1.5 shrink-0 rounded-full", tone === "pine" ? "bg-pine-500" : tone === "gold" ? "bg-gold-500" : tone === "clay" ? "bg-clay-500" : "bg-ink-400")} />
            )}
            {it}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ScopeView({ scope }: { scope: ScopeDefinition }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ListBlock title="Objectives" items={scope.objectives} icon="target" tone="pine" numbered />
      <ListBlock title="Deliverables" items={scope.deliverables} icon="flag" tone="gold" />
      <ListBlock title="Features (in scope)" items={scope.features} icon="spark" tone="pine" />
      <ListBlock title="Functional requirements" items={scope.functional} icon="file" />
      <ListBlock title="Non-functional requirements" items={scope.nonFunctional} icon="shield" />
      <ListBlock title="Out of scope" items={scope.outOfScope} icon="close" tone="clay" />
    </div>
  );
}

/* ================= C. Technology ================= */

function TechnologyView({ tech }: { tech: TechPick[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {tech.map((t, i) => (
        <motion.div key={t.layer} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
          <Card hover className="h-full p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-pine-700 uppercase">{t.layer}</span>
              <Badge tone="paper" dot={false}>alt: {t.alternative.split("(")[0].trim()}</Badge>
            </div>
            <p className="font-display mt-2.5 text-lg font-bold text-ink-900">{t.pick}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-600">{t.rationale}</p>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

/* ================= D. Architecture ================= */

const LAYER_COLOR = ["bg-gold-400", "bg-pine-500", "bg-ink-700", "bg-pine-700", "bg-clay-400"];

function ArchitectureView({ layers, flow }: { layers: ArchLayer[]; flow: string[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="p-6">
        <h3 className="font-display text-base font-bold text-ink-900">System layers</h3>
        <div className="mt-5 space-y-3">
          {layers.map((l, i) => (
            <motion.div key={l.name} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
              <div className={cn("h-1.5 w-24 rounded-full", LAYER_COLOR[i % LAYER_COLOR.length])} />
              <div className="rounded-b-lg rounded-tr-lg border border-t-0 border-ink-200 bg-paper-100/70 p-4">
                <p className="font-mono text-[10px] font-bold tracking-[0.18em] text-ink-500 uppercase">Layer {i + 1} — {l.name}</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {l.components.map((c) => (
                    <span key={c} className="rounded-md border border-ink-200 bg-paper-50 px-2.5 py-1 text-xs font-medium text-ink-700 shadow-card">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              {i < layers.length - 1 && (
                <div className="ml-6 flex items-center gap-2 py-1.5 text-ink-300">
                  <Icon name="arrowRight" size={13} className="rotate-90" />
                  <span className="font-mono text-[9px] tracking-widest uppercase">interface</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </Card>

      <div className="space-y-5">
        <Card className="p-6">
          <h3 className="font-display text-base font-bold text-ink-900">Request / data flow</h3>
          <ol className="mt-4 space-y-3.5">
            {flow.map((f, i) => (
              <li key={f} className="flex gap-3 text-[13.5px] leading-relaxed text-ink-600">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink-900 font-mono text-[10px] font-bold text-pine-300">{i + 1}</span>
                {f}
              </li>
            ))}
          </ol>
        </Card>
        <Callout tone="gold" icon="file" title="For the report">
          Generate the <strong>UML</strong> and <strong>Flowchart</strong> documents — both are rendered from this exact model, so the diagrams and the narrative never disagree.
        </Callout>
      </div>
    </div>
  );
}

/* ================= E. Timeline ================= */

function TimelineView({ weeks, projectId }: { weeks: WeekPlan[]; projectId: string }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<number | null>(weeks[0]?.week ?? null);
  const phases = useMemo(() => [...new Map(weeks.map((w) => [w.phase, w.phase])).keys()], [weeks]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {phases.map((ph) => (
          <span key={ph} className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-wider text-ink-500 uppercase">
            <span className={cn("size-2.5 rounded-sm", ph === "Planning & Design" ? "bg-gold-400" : ph === "Core Development" ? "bg-pine-500" : ph === "Integration & Testing" ? "bg-ink-600" : ph === "Documentation" ? "bg-pine-300" : "bg-clay-400")} />
            {ph}
          </span>
        ))}
        <button onClick={() => navigate(`/app/projects/${projectId}/progress`)} className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-pine-700 hover:underline">
          Track against this plan <Icon name="arrowRight" size={12} />
        </button>
      </div>

      <Card className="overflow-hidden">
        <ul className="divide-y divide-ink-100">
          {weeks.map((w) => {
            const open = expanded === w.week;
            const color = w.phase === "Planning & Design" ? "bg-gold-400" : w.phase === "Core Development" ? "bg-pine-500" : w.phase === "Integration & Testing" ? "bg-ink-600" : w.phase === "Documentation" ? "bg-pine-300" : "bg-clay-400";
            return (
              <li key={w.week}>
                <button onClick={() => setExpanded(open ? null : w.week)} className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition hover:bg-pine-50/50" aria-expanded={open}>
                  <span className="flex size-9 shrink-0 flex-col items-center justify-center rounded-lg bg-paper-200 font-mono text-[9px] font-bold text-ink-500 uppercase">
                    wk
                    <span className="text-[13px] text-ink-800">{w.week}</span>
                  </span>
                  <span className={cn("h-8 w-1.5 shrink-0 rounded-full", color)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink-800">{w.milestone}</span>
                    <span className="font-mono text-[9.5px] tracking-wider text-ink-400 uppercase">{w.phase}</span>
                  </span>
                  <Icon name="chevronRight" size={15} className={cn("shrink-0 text-ink-300 transition-transform", open && "rotate-90")} />
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                      <ul className="space-y-2 px-5 pb-4 pl-[76px]">
                        {w.tasks.map((t) => (
                          <li key={t} className="flex items-center gap-2.5 text-[13px] text-ink-600">
                            <span className="size-1.5 rounded-full bg-pine-500" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

/* ================= F. Risks ================= */

const sevTone = (s: RiskItem["severity"]) => (s === "High" ? "clay" : s === "Medium" ? "gold" : "pine") as "clay" | "gold" | "pine";

function RiskMatrix({ risks }: { risks: RiskItem[] }) {
  const cells: { sev: RiskItem["severity"]; prob: RiskItem["probability"]; items: RiskItem[] }[] = [];
  (["High", "Medium", "Low"] as const).forEach((sev) =>
    (["High", "Medium", "Low"] as const).forEach((prob) => cells.push({ sev, prob, items: risks.filter((r) => r.severity === sev && r.probability === prob) })),
  );
  return (
    <Card className="p-6">
      <h3 className="font-display text-base font-bold text-ink-900">Severity × probability matrix</h3>
      <div className="mt-5 grid grid-cols-[auto_repeat(3,1fr)] gap-1.5">
        <span />
        {(["High", "Medium", "Low"] as const).map((p) => (
          <span key={p} className="pb-1 text-center font-mono text-[9px] font-semibold tracking-widest text-ink-400 uppercase">
            {p} prob
          </span>
        ))}
        {(["High", "Medium", "Low"] as const).map((sev) => (
          <div key={sev} className="contents">
            <span className="flex items-center justify-end pr-2 font-mono text-[9px] font-semibold tracking-widest text-ink-400 uppercase">{sev}</span>
            {(["High", "Medium", "Low"] as const).map((prob) => {
              const cell = cells.find((c) => c.sev === sev && c.prob === prob)!;
              const heat = sev === "High" && prob !== "Low" ? "bg-clay-100 border-clay-300" : sev === "High" || prob === "High" ? "bg-gold-100 border-gold-300" : "bg-pine-50 border-pine-200";
              return (
                <div key={prob} className={cn("flex min-h-[64px] flex-wrap content-start items-start gap-1.5 rounded-lg border p-2", heat)}>
                  {cell.items.map((r) => (
                    <span key={r.id} title={r.risk} className="max-w-full truncate rounded-md bg-paper-50 px-2 py-1 text-[10.5px] font-medium text-ink-700 shadow-card">
                      {r.category}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Card>
  );
}

function RiskView({ risks }: { risks: RiskItem[] }) {
  return (
    <div className="space-y-5">
      <RiskMatrix risks={risks} />
      <div className="grid gap-4 md:grid-cols-2">
        {risks.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="h-full p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={sevTone(r.severity)} dot={false}>severity: {r.severity}</Badge>
                <Badge tone="paper" dot={false}>probability: {r.probability}</Badge>
                <span className="ml-auto font-mono text-[9.5px] tracking-widest text-ink-400 uppercase">{r.category}</span>
              </div>
              <p className="font-display mt-3 text-[15px] leading-snug font-bold text-ink-900">{r.risk}</p>
              <div className="mt-3 rounded-lg border-l-4 border-pine-400 bg-pine-50 p-3">
                <p className="font-mono text-[9px] font-bold tracking-[0.18em] text-pine-800 uppercase">Mitigation</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-700">{r.mitigation}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
