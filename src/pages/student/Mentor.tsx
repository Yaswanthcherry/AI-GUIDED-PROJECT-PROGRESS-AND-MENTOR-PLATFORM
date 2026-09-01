import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useProjects, useToast } from "../../context/StoreContext";
import { api } from "../../services/api";
import type { ChatMessage } from "../../types";
import { Badge, Button, Card, EmptyState, Ring, Rich, Skeleton } from "../../components/ui";
import { Icon } from "../../components/Icon";
import { timeAgo, uid } from "../../utils";
import { usePageTitle } from "../../hooks";

const SUGGESTIONS = [
  "What should I work on this week?",
  "Why did the AI recommend this technology?",
  "What are the risks in my project?",
  "How can I improve my project scope?",
  "Generate documentation for my project.",
];

export default function MentorPage() {
  const { id } = useParams<{ id: string }>();
  const { loading, getProject } = useProjects();
  const { push } = useToast();
  const project = id ? getProject(id) : undefined;
  usePageTitle(project ? `AI Mentor · ${project.title}` : "AI Mentor");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!project || loadedFor.current === project.id) return;
    loadedFor.current = project.id;
    setHistoryLoading(true);
    api.mentor
      .history(project.id)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setHistoryLoading(false));
  }, [project]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const contextStats = useMemo(
    () =>
      project
        ? [
            { k: "Phase", v: project.phase },
            { k: "Week", v: `${project.currentWeek}/${project.durationWeeks}` },
            { k: "Open risks", v: String(project.blueprint.risks.filter((r) => r.severity !== "Low").length) },
          ]
        : [],
    [project],
  );

  if (loading && !project) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-[480px]" />
      </div>
    );
  }
  if (!project) {
    return (
      <EmptyState
        icon="chat"
        title="No project to mentor"
        desc="Create a project first — the mentor only answers with your blueprint, plan and risks attached."
        action={<Link to="/app/projects/new"><Button icon="plus">Create project</Button></Link>}
      />
    );
  }

  const p = project;

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const userMsg: ChatMessage = { id: uid(), role: "user", content: trimmed, ts: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setDraft("");
    setBusy(true);
    try {
      const reply = await api.mentor.send(p.id, trimmed);
      setMessages((m) => [...m, reply]);
    } catch (e) {
      push("error", "Mentor unreachable", e instanceof Error ? e.message : "Try again in a moment.");
      setMessages((m) => [
        ...m,
        { id: uid(), role: "mentor", agent: "Mentor", ts: new Date().toISOString(), content: "I could not reach the agent layer just now — the conversation is safe, ask me again." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(draft);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[290px_1fr]">
      {/* context rail */}
      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Card className="bg-grid-dark border-ink-800 bg-ink-950 p-5">
          <p className="font-mono text-[9.5px] font-semibold tracking-[0.22em] text-paper-50/40 uppercase">Project context · attached</p>
          <Link to={`/app/projects/${p.id}`} className="font-display mt-2 block text-[17px] leading-snug font-bold text-paper-50 transition hover:text-pine-300">
            {p.title}
          </Link>
          <div className="mt-4 flex items-center gap-4">
            <Ring value={p.progress} size={62} stroke={6}>
              <span className="font-display text-[13px] font-bold text-paper-50">{p.progress}%</span>
            </Ring>
            <ul className="flex-1 space-y-1.5">
              {contextStats.map((s) => (
                <li key={s.k} className="flex justify-between gap-2 text-xs">
                  <span className="text-paper-50/45">{s.k}</span>
                  <span className="font-semibold text-paper-50/85">{s.v}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="p-4">
          <p className="mb-2.5 font-mono text-[9.5px] font-semibold tracking-[0.2em] text-ink-400 uppercase">The mentor can see</p>
          <ul className="space-y-2 text-[13px] text-ink-600">
            {[
              ["compass", "Full blueprint & evaluation"],
              ["target", "Scope, FR/NFR commitments"],
              ["calendar", `${p.tasks.length} tasks across ${p.milestones.length} milestones`],
              ["warning", `Risk register (${p.blueprint.risks.length} items)`],
              ["file", "Every generated document"],
            ].map(([icon, label]) => (
              <li key={label} className="flex items-center gap-2.5">
                <span className="flex size-6 items-center justify-center rounded-md bg-pine-100 text-pine-700">
                  <Icon name={icon as "compass"} size={12} />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* chat */}
      <Card className="flex h-[calc(100vh-170px)] min-h-[520px] flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="relative flex size-9 items-center justify-center rounded-lg bg-ink-900 text-pine-300">
              <Icon name="spark" size={16} />
              <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-pine-500 ring-2 ring-paper-50 animate-pulse-dot" />
            </span>
            <div>
              <p className="font-display text-sm font-bold text-ink-900">AI Conversational Mentor</p>
              <p className="font-mono text-[9.5px] tracking-[0.18em] text-pine-700 uppercase">grounded in your blueprint</p>
            </div>
          </div>
          <Badge tone="pine">context: live</Badge>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {historyLoading && (
            <div className="space-y-4">
              <Skeleton className="h-24 w-4/5" />
              <Skeleton className="ml-auto h-12 w-2/5" />
              <Skeleton className="h-24 w-3/5" />
            </div>
          )}

          {!historyLoading &&
            messages.map((m) =>
              m.role === "user" ? (
                <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                  <div className="max-w-[85%] rounded-xl rounded-br-sm bg-pine-600 px-4 py-3 text-sm leading-relaxed text-paper-50 shadow-card">
                    {m.content}
                    <p className="mt-1.5 text-right font-mono text-[9px] tracking-wider text-paper-50/50 uppercase">{timeAgo(m.ts)}</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-ink-900 text-pine-300">
                    <Icon name="spark" size={14} />
                  </span>
                  <div className="max-w-[88%] min-w-0">
                    <p className="mb-1 font-mono text-[9.5px] font-semibold tracking-[0.18em] text-ink-400 uppercase">
                      {m.agent ?? "Mentor"} · {timeAgo(m.ts)}
                    </p>
                    <div className="rounded-xl rounded-tl-sm border border-ink-100 bg-paper-100/80 px-4 py-3">
                      <Rich text={m.content} />
                    </div>
                  </div>
                </motion.div>
              ),
            )}

          <AnimatePresence>
            {busy && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-ink-900 text-pine-300">
                  <Icon name="spark" size={14} />
                </span>
                <div>
                  <p className="mb-1 font-mono text-[9.5px] font-semibold tracking-[0.18em] text-ink-400 uppercase">mentor is reasoning…</p>
                  <div className="flex items-center gap-1.5 rounded-xl rounded-tl-sm border border-ink-100 bg-paper-100/80 px-4 py-3.5">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="size-2 rounded-full bg-pine-500" style={{ animation: `pulse-dot 1.2s ease-in-out ${i * 0.18}s infinite` }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={endRef} />
        </div>

        <div className="border-t border-ink-100 px-5 pt-3 pb-4">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => void send(s)}
                disabled={busy}
                className="shrink-0 rounded-full border border-pine-200 bg-pine-50 px-3.5 py-1.5 text-xs font-medium text-pine-800 transition hover:border-pine-400 hover:bg-pine-100 disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              rows={1}
              placeholder={`Ask about ${p.title}… (Enter to send, Shift+Enter for a new line)`}
              className="max-h-32 min-h-[46px] flex-1 resize-none rounded-xl border border-ink-200 bg-paper-50 px-4 py-3 text-sm text-ink-900 transition placeholder:text-ink-300 focus:border-pine-500 focus:ring-2 focus:ring-pine-200 focus:outline-none"
              aria-label="Message the mentor"
            />
            <Button onClick={() => void send(draft)} disabled={!draft.trim() || busy} loading={busy} icon="send" className="h-[46px] px-5" aria-label="Send message">
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
