import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Icon } from "../components/Icon";
import type { IconName } from "../components/Icon";
import { Badge, Button, ProgressBar, SectionHead } from "../components/ui";
import { composeBlueprint } from "../services/generators";
import type { ProjectInput } from "../types";
import { cn } from "../utils";
import { usePageTitle } from "../hooks";
import { PRODUCT_NAME } from "../config/brand";

/* ---------- orchestrator ring ---------- */

const STAGES = ["Project Idea", "Idea Evaluation", "Scope", "Technology", "Architecture", "Timeline", "Risk", "Development", "Documentation", "Progress Tracking"];
const STAGE_NOTE: Record<string, string> = {
  "Project Idea": "Student describes the idea, problem and constraints",
  "Idea Evaluation": "Scoring feasibility, innovation and academic fit",
  Scope: "Objectives, deliverables and requirements extracted",
  Technology: "Stack selected for team size and timeline",
  Architecture: "Layered system design drafted",
  Timeline: "Week-by-week plan with milestones",
  Risk: "Risk register with mitigations compiled",
  Development: "Tasks tracked against the plan",
  Documentation: "11 standard documents drafted from live data",
  "Progress Tracking": "Completion, delays and velocity monitored",
};

function OrchestratorRing() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setActive((a) => (a + 1) % STAGES.length), 1700);
    return () => window.clearInterval(t);
  }, []);

  const C = 230;
  const R = 168;
  const pt = (i: number, r = R) => {
    const ang = (Math.PI * 2 * i) / STAGES.length - Math.PI / 2;
    return { x: C + r * Math.cos(ang), y: C + r * Math.sin(ang) };
  };

  return (
    <div className="relative">
      <svg viewBox="0 0 460 460" className="w-full" role="img" aria-label="Agent pipeline: idea through orchestrator to evaluation, scope, technology, timeline, risk, development, documentation and tracking">
        <circle cx={C} cy={C} r={R} fill="none" className="stroke-paper-50/12" strokeWidth="1.5" strokeDasharray="4 7" style={{ animation: "dash 2.4s linear infinite" }} />
        <circle cx={C} cy={C} r={118} fill="none" className="stroke-paper-50/8" strokeWidth="1" />
        {STAGES.map((s, i) => {
          const p = pt(i);
          const on = i === active;
          return (
            <g key={s}>
              <line x1={C} y1={C} x2={p.x} y2={p.y} className={on ? "stroke-pine-400" : "stroke-paper-50/10"} strokeWidth={on ? 1.6 : 1} strokeDasharray={on ? "none" : "2 5"} />
              <circle cx={p.x} cy={p.y} r={on ? 9 : 6} className={cn("transition-all duration-500", on ? "fill-pine-400" : "fill-paper-50/20")} />
              {on && <circle cx={p.x} cy={p.y} r={16} className="fill-pine-400/20 animate-pulse-dot" />}
              {(() => {
                const lp = pt(i, R + 26);
                const anchor = Math.abs(lp.x - C) < 24 ? "middle" : lp.x > C ? "start" : "end";
                return (
                  <text x={lp.x} y={lp.y} textAnchor={anchor} dominantBaseline="middle" className={cn("font-mono text-[10.5px] tracking-[0.14em] uppercase", on ? "fill-pine-300 font-semibold" : "fill-paper-50/45")}>
                    {s}
                  </text>
                );
              })()}
            </g>
          );
        })}
        <circle cx={C} cy={C} r={62} className="fill-ink-800 stroke-pine-500/50" strokeWidth="1.5" />
        <circle cx={C} cy={C} r={70} fill="none" className="stroke-pine-500/25" strokeWidth="1" strokeDasharray="3 6" style={{ animation: "dash 3s linear infinite reverse" }} />
        <text x={C} y={C - 14} textAnchor="middle" className="fill-pine-300 font-mono text-[10px] tracking-[0.22em]">✳ AI</text>
        <text x={C} y={C + 4} textAnchor="middle" className="fill-paper-50 font-display text-[15px] font-bold tracking-wide">ORCHESTRATOR</text>
        <text x={C} y={C + 24} textAnchor="middle" className="fill-paper-50/50 font-mono text-[9px] tracking-[0.18em]">6 SPECIALIST AGENTS</text>
      </svg>
      <div className="mt-2 flex items-center justify-center gap-3 rounded-lg border border-paper-50/10 bg-paper-50/5 px-4 py-2.5">
        <span className="size-2 shrink-0 rounded-full bg-pine-400 animate-pulse-dot" />
        <p className="font-mono text-[11px] tracking-wider text-paper-50/70">
          <span className="text-pine-300">{STAGES[active].toUpperCase()}</span> — {STAGE_NOTE[STAGES[active]]}
        </p>
      </div>
    </div>
  );
}

/* ---------- capabilities ledger ---------- */

const CAPS: { n: string; title: string; desc: string; agent: string; icon: IconName }[] = [
  { n: "01", title: "Idea evaluation", desc: "Feasibility, innovation and academic-fit scores with a go / revise verdict before you commit a semester.", agent: "Evaluator", icon: "gauge" },
  { n: "02", title: "Scope definition", desc: "Objectives, deliverables, functional and non-functional requirements — and an explicit out-of-scope list.", agent: "Scope Agent", icon: "target" },
  { n: "03", title: "Technology selection", desc: "A stack chosen for your team size, weeks and evaluators' reproducibility — with rationale and alternatives.", agent: "Tech Scout", icon: "cpu" },
  { n: "04", title: "Architecture planning", desc: "A layered architecture with components and request flow, ready to become your report diagrams.", agent: "Architect", icon: "layers" },
  { n: "05", title: "Timeline planning", desc: "Week-by-week milestones and tasks across planning, development, integration and documentation.", agent: "Planner", icon: "calendar" },
  { n: "06", title: "Risk identification", desc: "A severity × probability register with concrete mitigations — including the exam-season crunch.", agent: "Risk Analyst", icon: "warning" },
  { n: "07", title: "Development tracking", desc: "Tasks roll up into milestones and a burndown curve; delays are flagged the week they happen.", agent: "Tracker", icon: "chart" },
  { n: "08", title: "Documentation", desc: "Synopsis to user manual — 11 standard documents drafted from your live project data.", agent: "Doc Drafter", icon: "file" },
  { n: "09", title: "AI mentorship", desc: "A conversational mentor that always knows your blueprint, progress and risks.", agent: "Mentor", icon: "chat" },
];

/* ---------- page ---------- */

export default function Landing() {
  usePageTitle();

  const demoInput: ProjectInput = useMemo(
    () => ({
      title: "AI Customer Support Chatbot",
      idea: "A retrieval-augmented chatbot answering support questions from an institutional knowledge base.",
      problemStatement: "Support teams repeat the same answers while users wait hours; keyword bots fail on paraphrased questions.",
      domain: "AI / Machine Learning",
      technologies: "Python, FastAPI, React",
      teamSize: 3,
      durationWeeks: 14,
      level: "Undergraduate — Final Year",
    }),
    [],
  );
  const bp = useMemo(() => composeBlueprint(demoInput), [demoInput]);

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-16 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:pt-20">
          <div>
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full border border-pine-300 bg-pine-50 px-3.5 py-1.5 font-mono text-[10.5px] font-semibold tracking-[0.2em] text-pine-800 uppercase">
              <span className="size-1.5 rounded-full bg-pine-500 animate-pulse-dot" />
              Agentic progress tracking
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
              className="font-display mt-6 text-[40px] leading-[1.04] font-bold tracking-tight text-balance text-ink-900 sm:text-[56px] lg:text-[62px]"
            >
              From project idea to{" "}
              <span className="relative inline-block">
                final submission.
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M3 9c60-6 180-6 294-3" stroke="var(--color-gold-500)" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mt-7 max-w-xl text-lg leading-relaxed text-ink-500">
              <strong className="font-semibold text-ink-800">Your Intelligent AI Guide from Project Idea to Final Submission.</strong>{" "}
              The {PRODUCT_NAME} orchestrates six specialist agents that evaluate your idea, define the scope, pick the stack, plan the weeks, register the risks — then stay with you through development, documentation and progress tracking.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/register">
                <Button size="lg" iconRight="arrowRight">Start Your Project</Button>
              </Link>
              <a href="#workflow">
                <Button size="lg" variant="outline" icon="play">Watch the pipeline</Button>
              </a>
            </motion.div>
            <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-9 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10.5px] font-medium tracking-[0.16em] text-ink-400 uppercase">
              <li className="flex items-center gap-2"><Icon name="spark" size={13} className="text-pine-600" />6 specialist agents</li>
              <li className="flex items-center gap-2"><Icon name="file" size={13} className="text-pine-600" />11 document types</li>
              <li className="flex items-center gap-2"><Icon name="calendar" size={13} className="text-pine-600" />Week-by-week plans</li>
              <li className="flex items-center gap-2"><Icon name="cap" size={13} className="text-pine-600" />Built for academia</li>
            </motion.ul>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="relative">
            <div className="bg-grid-dark relative rounded-2xl border border-ink-800 bg-ink-950 p-5 shadow-lift sm:p-7">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-mono text-[10px] font-semibold tracking-[0.22em] text-paper-50/40 uppercase">Pipeline · live</p>
                <Badge tone="pine" className="border-pine-500/30 bg-pine-500/10 text-pine-300">orchestrating</Badge>
              </div>
              <OrchestratorRing />
            </div>
            <div className="absolute -top-3 -right-3 rotate-2 rounded-lg border border-gold-300 bg-gold-100 px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest text-gold-700 uppercase shadow-card">
              blueprint in ~90s
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= ticker ================= */}
      <div className="overflow-hidden border-y border-ink-100 bg-paper-50 py-3" aria-hidden="true">
        <div className="flex w-max animate-[marquee_30s_linear_infinite] gap-8" style={{ animationName: "marquee" }}>
          {[0, 1].map((rep) => (
            <div key={rep} className="flex shrink-0 items-center gap-8">
              {["IDEA → ORCHESTRATOR", "EVALUATION", "SCOPE", "TECHNOLOGY", "TIMELINE", "RISK", "DEVELOPMENT", "DOCUMENTATION", "PROGRESS TRACKING"].map((s) => (
                <span key={s} className="flex items-center gap-8 font-mono text-[11px] font-semibold tracking-[0.24em] text-ink-400">
                  {s}
                  <Icon name="spark" size={12} className="text-pine-500" />
                </span>
              ))}
            </div>
          ))}
        </div>
        <style>{`@keyframes marquee { to { transform: translateX(-50%); } }`}</style>
      </div>

      {/* ================= platform ledger ================= */}
      <section id="platform" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHead
              kicker="What the agents do"
              title="Nine jobs. Zero blank pages."
              desc="Every stage of an academic project — the parts students improvise and guides re-explain every semester — is handled by a named specialist agent, and everything it produces stays editable and trackable."
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register"><Button iconRight="arrowRight">Start Your Project</Button></Link>
              <Link to="/about"><Button variant="outline">About the platform</Button></Link>
            </div>
          </div>
          <ol className="divide-y divide-ink-100 border-y border-ink-100">
            {CAPS.map((c, i) => (
              <motion.li
                key={c.n}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: (i % 4) * 0.05 }}
                className="group grid grid-cols-[44px_1fr_auto] items-start gap-4 py-5 transition-colors hover:bg-pine-50/60 sm:grid-cols-[56px_1fr_auto]"
              >
                <span className="font-display text-xl font-bold text-ink-200 transition group-hover:text-pine-600">{c.n}</span>
                <span>
                  <span className="flex flex-wrap items-center gap-2.5">
                    <span className="font-display text-[17px] font-bold text-ink-900">{c.title}</span>
                    <span className="rounded-full border border-ink-200 bg-paper-50 px-2 py-0.5 font-mono text-[9px] font-semibold tracking-[0.14em] text-ink-500 uppercase">{c.agent}</span>
                  </span>
                  <span className="mt-1.5 block max-w-lg text-sm leading-relaxed text-ink-500">{c.desc}</span>
                </span>
                <span className="mt-1 text-ink-300 transition group-hover:translate-x-1 group-hover:text-pine-600">
                  <Icon name={c.icon} size={20} />
                </span>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* ================= workflow ================= */}
      <section id="workflow" className="scroll-mt-20 border-y border-ink-100 bg-paper-50/60">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <SectionHead
            kicker="The workflow"
            title="One pipeline from spark to submission"
            desc="Your idea enters a single orchestrator. It fans out to specialist agents, and the outputs return as one living blueprint that the rest of the semester runs on."
          />
          <div className="mt-12 flex flex-wrap items-center gap-y-4">
            {["Project Idea", "AI Orchestrator", "Idea Evaluation", "Scope", "Technology", "Timeline", "Risk", "Development", "Documentation", "Progress Tracking"].map((s, i) => {
              const hub = s === "AI Orchestrator";
              const first = s === "Project Idea";
              return (
                <span key={s} className="flex items-center">
                  {i > 0 && (
                    <svg width="34" height="12" viewBox="0 0 34 12" className="mx-1 shrink-0 text-ink-300" aria-hidden="true">
                      <path d="M0 6h28m0 0l-5-4.5M28 6l-5 4.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "relative rounded-lg border px-3.5 py-2.5 font-mono text-[11px] font-semibold tracking-[0.12em] uppercase",
                      hub
                        ? "border-pine-600 bg-ink-950 text-pine-300 shadow-lift"
                        : first
                          ? "border-gold-300 bg-gold-100 text-gold-700"
                          : "border-ink-200 bg-paper-50 text-ink-600",
                    )}
                  >
                    {hub && <span className="absolute -top-1.5 -right-1.5 size-3 rounded-full bg-pine-500 animate-pulse-dot" />}
                    {s}
                  </motion.span>
                </span>
              );
            })}
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {[
              { icon: "edit" as IconName, title: "Describe once", desc: "Title, idea, problem statement, domain, team, duration. That single form fuels every agent." },
              { icon: "spark" as IconName, title: "Agents plan", desc: "Six agents argue your project into shape and return a scored, structured blueprint in about 90 seconds." },
              { icon: "flag" as IconName, title: "You build, we track", desc: "Tasks, milestones, documents and mentorship all reference the same blueprint — nothing drifts." },
            ].map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="relative rounded-xl border border-ink-100 bg-paper-50 p-6 shadow-card"
              >
                <span className="font-display absolute top-5 right-5 text-3xl font-bold text-paper-300">{i + 1}</span>
                <span className="flex size-10 items-center justify-center rounded-lg bg-ink-900 text-pine-300">
                  <Icon name={s.icon} size={18} />
                </span>
                <h3 className="font-display mt-4 text-base font-bold text-ink-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= blueprint preview ================= */}
      <section id="blueprint" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
        <div className="grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="lg:sticky lg:top-28">
            <SectionHead
              kicker="Live blueprint"
              title="This is what 90 seconds of agent work looks like"
              desc={`Below is a real blueprint composed by the same engine the app runs on — for a final-year "${demoInput.title}" proposal. In the product, every number here links to a tracked task, document or risk.`}
            />
            <div className="mt-8 grid grid-cols-3 gap-3">
              {Object.entries(bp.evaluation.scores).map(([k, v]) => (
                <div key={k} className="rounded-xl border border-ink-100 bg-paper-50 p-4">
                  <p className="font-mono text-[9.5px] font-semibold tracking-[0.14em] text-ink-400 uppercase">{k === "academicSuitability" ? "Academic fit" : k}</p>
                  <p className="font-display mt-1.5 text-2xl font-bold text-ink-900">{v}<span className="text-sm text-ink-400">/100</span></p>
                  <ProgressBar value={v} className="mt-2.5 h-1.5" />
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="pine">Verdict: {bp.evaluation.verdict}</Badge>
              <Badge tone="gold">Difficulty: {bp.evaluation.difficulty}</Badge>
              <Badge tone="ink">{bp.evaluation.estimatedDuration}</Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-ink-800 bg-ink-950 shadow-lift">
              <div className="flex items-center justify-between border-b border-ink-800 px-5 py-3.5">
                <p className="font-mono text-[10px] font-semibold tracking-[0.2em] text-paper-50/40 uppercase">Scope agent · output</p>
                <span className="font-mono text-[10px] text-pine-400">6 features committed</span>
              </div>
              <div className="flex flex-wrap gap-2 p-5">
                {bp.scope.features.map((f) => (
                  <span key={f} className="rounded-lg border border-pine-500/25 bg-pine-500/10 px-3 py-1.5 text-xs text-pine-200">{f}</span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-ink-100 bg-paper-50 shadow-card">
              <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
                <p className="font-mono text-[10px] font-semibold tracking-[0.2em] text-ink-400 uppercase">Tech scout · picks</p>
                <span className="font-mono text-[10px] text-ink-400">rationale included</span>
              </div>
              <ul className="divide-y divide-ink-100">
                {bp.technology.slice(0, 4).map((t) => (
                  <li key={t.layer} className="flex items-baseline justify-between gap-4 px-5 py-3">
                    <span className="font-mono text-[10px] font-semibold tracking-widest text-ink-400 uppercase">{t.layer}</span>
                    <span className="text-right text-sm font-semibold text-ink-800">{t.pick}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-ink-100 bg-paper-50 p-5 shadow-card">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] font-semibold tracking-[0.2em] text-ink-400 uppercase">Timeline planner · {demoInput.durationWeeks} weeks</p>
                <span className="font-mono text-[10px] text-ink-400">{bp.timeline.length} planned</span>
              </div>
              <div className="mt-4 flex gap-1">
                {bp.timeline.map((w) => (
                  <div key={w.week} className="group relative flex-1">
                    <div className={cn("h-9 rounded-sm", w.phase === "Planning & Design" ? "bg-gold-400" : w.phase === "Core Development" ? "bg-pine-500" : w.phase === "Integration & Testing" ? "bg-ink-500" : w.phase === "Documentation" ? "bg-pine-300" : "bg-clay-400", "transition-transform group-hover:scale-y-110")} />
                    <span className="mt-1 block text-center font-mono text-[8.5px] text-ink-400">{w.week}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {[["Planning", "bg-gold-400"], ["Development", "bg-pine-500"], ["Integration", "bg-ink-500"], ["Docs", "bg-pine-300"], ["Submission", "bg-clay-400"]].map(([l, c]) => (
                  <span key={l} className="flex items-center gap-1.5 font-mono text-[9.5px] tracking-wider text-ink-500 uppercase">
                    <span className={cn("size-2 rounded-sm", c)} />{l}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-clay-200 bg-clay-100/40 p-5">
              <p className="font-mono text-[10px] font-semibold tracking-[0.2em] text-clay-700 uppercase">Risk analyst · top finding</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-800">
                <strong>{bp.risks[0].risk}.</strong> {bp.risks[0].mitigation}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= roles ================= */}
      <section id="roles" className="scroll-mt-20 border-y border-ink-100 bg-ink-950">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-24 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-grid-dark rounded-2xl border border-pine-800/60 bg-ink-900 p-8 sm:p-10">
            <p className="font-mono text-[10.5px] font-semibold tracking-[0.22em] text-pine-300 uppercase">For students</p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-paper-50 sm:text-4xl">Stop guessing what a “good project” looks like.</h2>
            <ul className="mt-7 space-y-3.5">
              {["A scored verdict on your idea before week 1", "A week-by-week plan that survives exam season", "Mentor answers that know your exact blueprint", "Report-ready documentation drafted from live data", "Progress your guide can actually see"].map((t) => (
                <li key={t} className="flex items-start gap-3 text-[15px] text-paper-50/75">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-pine-500/20 text-pine-300"><Icon name="check" size={11} strokeWidth={2.5} /></span>
                  {t}
                </li>
              ))}
            </ul>
            <Link to="/register" className="mt-8 inline-block"><Button variant="gold" iconRight="arrowRight">Start Your Project</Button></Link>
          </div>
          <div className="rounded-2xl border border-ink-800 bg-paper-50 p-8 sm:p-10">
            <p className="font-mono text-[10.5px] font-semibold tracking-[0.22em] text-gold-600 uppercase">For faculty</p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink-900">See risk before it becomes a failed submission.</h2>
            <ul className="mt-7 space-y-3.5">
              {["Portfolio view: active, delayed and high-risk at a glance", "Per-project progress against the AI-issued plan", "AI-generated monitoring insights each review", "Risk registers with mitigations, not excuses"].map((t) => (
                <li key={t} className="flex items-start gap-3 text-[15px] text-ink-600">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-600"><Icon name="check" size={11} strokeWidth={2.5} /></span>
                  {t}
                </li>
              ))}
            </ul>
            <Link to="/login" className="mt-8 inline-block"><Button variant="dark" iconRight="arrowRight">Faculty login</Button></Link>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-pine-800 bg-pine-950 px-8 py-16 text-center sm:px-16">
          <div className="bg-grid-dark pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[520px] -translate-x-1/2 rounded-full bg-pine-500/20 blur-[90px]" />
          <p className="relative font-mono text-[11px] font-semibold tracking-[0.24em] text-pine-300 uppercase">Ready when you are</p>
          <h2 className="font-display relative mx-auto mt-4 max-w-2xl text-4xl font-bold tracking-tight text-balance text-paper-50 sm:text-5xl">
            Bring an idea. Leave with a plan.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-paper-50/65">
            Six agents will evaluate it, scope it, stack it, schedule it and de-risk it — before your first supervision meeting.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register"><Button size="lg" variant="gold" iconRight="arrowRight">Start Your Project</Button></Link>
            <Link to="/about"><Button size="lg" variant="outline" className="border-paper-50/20 bg-transparent text-paper-50 hover:border-pine-300 hover:text-pine-200">About the platform</Button></Link>
          </div>
        </div>
      </section>
    </>
  );
}
