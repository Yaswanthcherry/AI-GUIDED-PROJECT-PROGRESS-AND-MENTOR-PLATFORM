import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "../components/Icon";
import { Button, SectionHead } from "../components/ui";
import { usePageTitle } from "../hooks";
import { cn } from "../utils";
import { PRODUCT_NAME } from "../config/brand";

const AGENTS = [
  { name: "Idea Evaluator", in: "Idea + problem statement + level", out: "Feasibility / innovation / fit scores, verdict", icon: "gauge" as const },
  { name: "Scope Agent", in: "Evaluated idea", out: "Objectives, deliverables, FR/NFR, out-of-scope", icon: "target" as const },
  { name: "Tech Scout", in: "Scope + team + duration", out: "Layer-by-layer stack with rationale & alternatives", icon: "cpu" as const },
  { name: "Architecture Planner", in: "Stack + scope", out: "Layered architecture, data flow, diagram seeds", icon: "layers" as const },
  { name: "Risk Analyst", in: "Domain + plan + team", out: "Severity × probability register with mitigations", icon: "warning" as const },
  { name: "Timeline Planner", in: "Everything above", out: "Week-by-week milestones and task backlog", icon: "calendar" as const },
  { name: "Doc Drafter", in: "Live project data", out: "11 document types, always consistent with the plan", icon: "file" as const },
  { name: "Mentor", in: "Your questions + full context", out: "Conversational guidance tied to your blueprint", icon: "chat" as const },
];

const FAQS = [
  { q: "Does the platform do the project for the student?", a: "No. The platform plans, structures and tracks the project — the building, experiments and writing decisions stay with the student. Every agent output is a starting point the student is expected to refine, and the activity log records what the student actually delivers." },
  { q: "How does the AI know my domain?", a: "The orchestrator routes your idea through domain-specific knowledge (AI/ML, web, mobile, IoT, data, cloud, security, blockchain) so technology picks, risk registers and evaluation criteria match the field — not a generic template." },
  { q: "What does the faculty see?", a: "A portfolio dashboard: every student project with progress against its AI-issued plan, current milestone, risk level, delayed tasks, and AI-generated monitoring insights per project. Nothing is hidden from the student — transparency is the point." },
  { q: "Can the blueprint change after week 1?", a: "Yes. The blueprint can be regenerated as the project evolves, tasks can be re-planned, and the mentor re-scores risks when you report new information. The history of changes is part of the record." },
  { q: "Is this connected to a real backend?", a: "Yes — a FastAPI + PostgreSQL backend implements the same agent pipeline. With VITE_API_BASE_URL set, every action in the UI hits the real API and is persisted to the database; with it empty, the browser serves a simulated agent layer so the flow can be explored." },
];

export default function About() {
  usePageTitle("About");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <div className="grid items-end gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="font-mono text-[11px] font-semibold tracking-[0.22em] text-pine-700 uppercase">About AI-Guided</p>
            <h1 className="font-display mt-4 text-4xl leading-[1.06] font-bold tracking-tight text-balance text-ink-900 sm:text-[52px]">
              The semester has a shape. AI-Guided makes it visible.
            </h1>
          </div>
          <p className="text-[15px] leading-relaxed text-ink-500">
            Most academic projects don't fail for lack of effort — they fail for lack of structure: scope that drifts, stacks chosen on hype, risks discovered in week 12, documentation written the night before. The {PRODUCT_NAME} is an <strong className="text-ink-800">agentic AI system</strong> that converts a project idea into a feasible, structured, trackable academic project — and keeps it that way until submission.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { v: "6", l: "orchestrated planning agents", icon: "spark" as const },
            { v: "11", l: "document types auto-drafted", icon: "file" as const },
            { v: "8", l: "project domains understood", icon: "layers" as const },
            { v: "1", l: "living blueprint per project", icon: "compass" as const },
          ].map((s, i) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-ink-100 bg-paper-50 p-6 shadow-card"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-4xl font-bold text-ink-900">{s.v}</span>
                <span className="text-pine-600"><Icon name={s.icon} size={20} /></span>
              </div>
              <p className="mt-2 text-sm text-ink-500">{s.l}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHead kicker="The roster" title="Meet the agents" desc="The orchestrator delegates to specialists. Each agent has one job, one input contract and one output — which is why the blueprint stays consistent." />
        <div className="mt-10 overflow-hidden rounded-xl border border-ink-100 bg-paper-50 shadow-card">
          <div className="hidden grid-cols-[44px_1.1fr_1fr_1.2fr] gap-4 border-b border-ink-100 bg-paper-200/60 px-5 py-3 font-mono text-[9.5px] font-semibold tracking-[0.18em] text-ink-500 uppercase sm:grid">
            <span />
            <span>Agent</span>
            <span>Reads</span>
            <span>Produces</span>
          </div>
          <ul className="divide-y divide-ink-100">
            {AGENTS.map((a, i) => (
              <motion.li
                key={a.name}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: (i % 4) * 0.04 }}
                className="grid grid-cols-[44px_1fr] items-start gap-4 px-5 py-4 transition hover:bg-pine-50/50 sm:grid-cols-[44px_1.1fr_1fr_1.2fr]"
              >
                <span className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-ink-900 text-pine-300">
                  <Icon name={a.icon} size={15} />
                </span>
                <span className="font-display text-[15px] font-bold text-ink-900">{a.name}</span>
                <span className="col-start-2 text-sm text-ink-500 sm:col-start-auto">{a.in}</span>
                <span className="col-start-2 text-sm text-ink-600 sm:col-start-auto">{a.out}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-ink-100 bg-paper-50/60">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHead kicker="Questions" title="Asked in every demo" />
            <Link to="/register" className="mt-8 inline-block">
              <Button iconRight="arrowRight">Start Your Project</Button>
            </Link>
          </div>
          <div className="divide-y divide-ink-100 border-y border-ink-100">
            {FAQS.map((f, i) => (
              <div key={f.q}>
                <button
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span className="font-display text-[16px] font-bold text-ink-900">{f.q}</span>
                  <span className={cn("shrink-0 rounded-full border border-ink-200 p-1.5 text-ink-500 transition-transform duration-200", openFaq === i && "rotate-45 border-pine-400 text-pine-600")}>
                    <Icon name="plus" size={13} />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      <p className="max-w-2xl pb-5 text-sm leading-relaxed text-ink-500">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-display mx-auto max-w-2xl text-3xl font-bold tracking-tight text-balance text-ink-900 sm:text-4xl">Your idea deserves more than a guess.</h2>
        <p className="mx-auto mt-3 max-w-lg text-[15px] text-ink-500">Run it through the pipeline and see the verdict, the plan and the risks in about 90 seconds.</p>
        <div className="mt-7 flex justify-center gap-3">
          <Link to="/register"><Button size="lg" iconRight="arrowRight">Start Your Project</Button></Link>
          <Link to="/login"><Button size="lg" variant="outline">Log in</Button></Link>
        </div>
      </section>
    </>
  );
}
