import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth, useProjects, useToast } from "../../context/StoreContext";
import { api } from "../../services/api";
import { AGENT_STAGES } from "../../data/mock";
import { DOMAINS, LEVELS } from "../../services/generators";
import type { ProjectInput } from "../../types";
import { Button, Card, Field, Input, Logo, PageHead, ProgressBar, Select, Textarea } from "../../components/ui";
import { Icon } from "../../components/Icon";
import { usePageTitle } from "../../hooks";
import { cn } from "../../utils";

const EMPTY: ProjectInput = {
  title: "",
  idea: "",
  problemStatement: "",
  domain: DOMAINS[0],
  technologies: "",
  teamSize: 2,
  durationWeeks: 12,
  level: LEVELS[1],
  notes: "",
};

export default function CreateProject() {
  usePageTitle("Create project");
  const { user } = useAuth();
  const { setProject } = useProjects();
  const { push } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState<ProjectInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [stage, setStage] = useState(-1);

  const set = <K extends keyof ProjectInput>(k: K, v: ProjectInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const validity = useMemo(() => {
    const checks: [string, boolean][] = [
      ["title", form.title.trim().length >= 6],
      ["idea", form.idea.trim().length >= 30],
      ["problemStatement", form.problemStatement.trim().length >= 20],
      ["domain", form.domain.length > 0],
      ["teamSize", form.teamSize >= 1 && form.teamSize <= 8],
      ["durationWeeks", form.durationWeeks >= 4 && form.durationWeeks <= 24],
      ["level", form.level.length > 0],
    ];
    return checks;
  }, [form]);

  const readiness = Math.round((validity.filter(([, ok]) => ok).length / validity.length) * 100);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.title.trim().length < 6) errs.title = "Give the project a descriptive title (min 6 characters).";
    if (form.idea.trim().length < 30) errs.idea = "Describe the idea in at least 30 characters — the Evaluator needs substance.";
    if (form.problemStatement.trim().length < 20) errs.problemStatement = "State the problem you are solving (min 20 characters).";
    if (form.teamSize < 1 || form.teamSize > 8) errs.teamSize = "Team size must be between 1 and 8.";
    if (form.durationWeeks < 4 || form.durationWeeks > 24) errs.durationWeeks = "Duration must be between 4 and 24 weeks.";
    setErrors(errs);
    if (Object.keys(errs).length) {
      push("error", "A few fields need attention", "The agents need real input to produce a real plan.");
      return;
    }
    if (!user) return;

    setGenerating(true);
    setStage(-1);
    try {
      const project = await api.projects.create(form, user, (i) => setStage(i));
      setProject(project);
      push("success", "Blueprint generated", `The agents planned "${project.title}" — opening your blueprint.`);
      navigate(`/app/projects/${project.id}/blueprint`);
    } catch (err) {
      setGenerating(false);
      push("error", "Blueprint generation failed", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <>
      <PageHead
        back={
          <Link to="/app" className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-400 transition hover:text-pine-700">
            <Icon name="arrowLeft" size={13} /> Back to dashboard
          </Link>
        }
        title="Feed the orchestrator"
        desc="One form fuels every agent. The more specific the idea and problem statement, the sharper the blueprint."
      />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-6 sm:p-7">
          <form onSubmit={submit} className="space-y-5" noValidate>
            <Field label="Project title" required error={errors.title} hint={`${form.title.length}/6+ chars`}>
              <Input placeholder="e.g. AI Customer Support Chatbot" value={form.title} onChange={(e) => set("title", e.target.value)} />
            </Field>

            <Field label="Project idea" required error={errors.idea} hint={`${form.idea.length}/30+ chars`}>
              <Textarea placeholder="What are you building, and what makes it interesting? Two or three honest sentences beat a page of buzzwords." value={form.idea} onChange={(e) => set("idea", e.target.value)} />
            </Field>

            <Field label="Problem statement" required error={errors.problemStatement} hint={`${form.problemStatement.length}/20+ chars`}>
              <Textarea placeholder="Whose pain does this remove, and how is it handled today?" value={form.problemStatement} onChange={(e) => set("problemStatement", e.target.value)} />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Project domain" required>
                <Select value={form.domain} onChange={(e) => set("domain", e.target.value)}>
                  {DOMAINS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Academic level" required>
                <Select value={form.level} onChange={(e) => set("level", e.target.value)}>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Current technologies" hint="optional — anything you already know or must use">
              <Input placeholder="e.g. Python, React, FastAPI" value={form.technologies} onChange={(e) => set("technologies", e.target.value)} />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Team size" required error={errors.teamSize}>
                <Input type="number" min={1} max={8} value={form.teamSize} onChange={(e) => set("teamSize", Number(e.target.value))} />
              </Field>
              <Field label="Project duration (weeks)" required error={errors.durationWeeks}>
                <Input type="number" min={4} max={24} value={form.durationWeeks} onChange={(e) => set("durationWeeks", Number(e.target.value))} />
              </Field>
            </div>

            <Field label="Additional requirements" hint="optional — constraints, guide preferences, must-have features">
              <Textarea placeholder="e.g. Must run offline for the demo; guide prefers open-source models only…" value={form.notes} onChange={(e) => set("notes", e.target.value)} className="min-h-[72px]" />
            </Field>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink-100 pt-5">
              <div className="min-w-[180px]">
                <p className="mb-1.5 flex justify-between font-mono text-[10px] font-semibold tracking-[0.16em] text-ink-400 uppercase">
                  <span>Input readiness</span>
                  <span className={readiness === 100 ? "text-pine-600" : "text-gold-600"}>{readiness}%</span>
                </p>
                <ProgressBar value={readiness} tone={readiness === 100 ? "pine" : "gold"} className="h-1.5" />
              </div>
              <Button type="submit" size="lg" icon="spark" disabled={generating}>
                Generate Project Blueprint
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-5">
          <Card className="bg-grid-dark border-ink-800 bg-ink-950 p-6">
            <p className="font-mono text-[10px] font-semibold tracking-[0.22em] text-paper-50/40 uppercase">What happens on submit</p>
            <ol className="mt-4 space-y-3.5">
              {AGENT_STAGES.map((a, i) => (
                <li key={a} className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-lg border border-pine-500/30 bg-pine-500/10 font-mono text-[10px] font-bold text-pine-300">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-medium text-paper-50/85">{a}</span>
                  <span className="ml-auto font-mono text-[9px] tracking-widest text-paper-50/30 uppercase">agent</span>
                </li>
              ))}
            </ol>
            <div className="mt-5 rounded-lg border border-gold-500/25 bg-gold-500/10 px-4 py-3 text-xs leading-relaxed text-gold-200">
              Runs on the FastAPI orchestrator. Output: evaluation, scope, stack, architecture, {form.durationWeeks}-week plan and a risk register — persisted to PostgreSQL.
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-display text-base font-bold text-ink-900">Write it like you'd pitch it</h3>
            <ul className="mt-3 space-y-3 text-sm leading-relaxed text-ink-600">
              {[
                ["Name the user", "\"Support staff\" beats \"people\". The Scope Agent extracts features from who does what."],
                ["Name the failure", "Say how it breaks today — that becomes your problem statement and evaluation baseline."],
                ["Admit constraints", "Team of 2 with exams in week 10? Say so. The Planner prices it in instead of you discovering it."],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <Icon name="check" size={15} className="mt-0.5 shrink-0 text-pine-600" />
                  <span>
                    <strong className="text-ink-800">{t}.</strong> {d}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* ============ generating overlay ============ */}
      <AnimatePresence>
        {generating && (
          <motion.div className="bg-grid-dark fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/97 p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full max-w-md">
              <div className="mb-6 flex justify-center">
                <Logo light />
              </div>
              <h2 className="font-display text-center text-2xl font-bold text-paper-50">AI agents are analyzing your project…</h2>
              <p className="mt-2 text-center text-sm text-paper-50/55">
                Orchestrating six specialists around <span className="font-semibold text-pine-300">“{form.title}”</span>
              </p>

              <div className="mt-8 space-y-2.5">
                {AGENT_STAGES.map((a, i) => {
                  const done = stage >= i;
                  const active = stage === i - 1;
                  return (
                    <div
                      key={a}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-300",
                        done ? "border-pine-500/40 bg-pine-500/10" : active ? "border-gold-500/40 bg-gold-500/10" : "border-paper-50/10 bg-paper-50/5",
                      )}
                    >
                      <span className="w-5">
                        {done ? (
                          <Icon name="check" size={15} className="text-pine-400" strokeWidth={2.5} />
                        ) : active ? (
                          <svg className="size-4 animate-spin text-gold-400" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
                            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                        ) : (
                          <span className="mx-auto block size-1.5 rounded-full bg-paper-50/25" />
                        )}
                      </span>
                      <span className={cn("text-sm font-medium", done ? "text-pine-200" : active ? "text-gold-200" : "text-paper-50/40")}>{a}</span>
                      <span className={cn("ml-auto font-mono text-[9px] tracking-widest uppercase", done ? "text-pine-400" : active ? "text-gold-400" : "text-paper-50/25")}>
                        {done ? "done" : active ? "working" : "queued"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6">
                <ProgressBar value={Math.max(4, ((stage + 1) / AGENT_STAGES.length) * 100)} className="h-1.5 bg-paper-50/10" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
