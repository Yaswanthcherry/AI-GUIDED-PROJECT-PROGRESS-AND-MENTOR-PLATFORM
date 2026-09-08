import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useProjects, useToast } from "../../context/StoreContext";
import { api } from "../../services/api";
import { DOC_META } from "../../services/generators";
import type { DocArtifact, DocType, Project } from "../../types";
import { Badge, Button, Card, EmptyState, Modal, Rich, Skeleton } from "../../components/ui";
import { Icon } from "../../components/Icon";
import type { IconName } from "../../components/Icon";
import { cn, copyText, download, fmtDateFull } from "../../utils";
import { usePageTitle } from "../../hooks";

export default function DocumentationPage() {
  const { id } = useParams<{ id: string }>();
  const { loading, getProject } = useProjects();
  const { push } = useToast();
  const project = id ? getProject(id) : undefined;
  usePageTitle(project ? `Documentation · ${project.title}` : "Documentation");

  const [docs, setDocs] = useState<DocArtifact[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [selected, setSelected] = useState<DocType | null>(null);
  const [generating, setGenerating] = useState<DocType | null>(null);
  const [mobilePreview, setMobilePreview] = useState(false);
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!project || loadedFor.current === project.id) return;
    loadedFor.current = project.id;
    setDocsLoading(true);
    api.docs
      .list(project.id)
      .then((d) => {
        setDocs(d);
        if (d.length) setSelected(d[d.length - 1].type);
      })
      .catch(() => setDocs([]))
      .finally(() => setDocsLoading(false));
  }, [project]);

  if (loading && !project) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-1/2" />
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Skeleton className="h-[520px]" />
          <Skeleton className="h-[520px]" />
        </div>
      </div>
    );
  }
  if (!project) {
    return (
      <EmptyState
        icon="file"
        title="No project, no documents"
        desc="Documents are drafted from live project data — create a project first."
        action={<Link to="/app/projects/new"><Button icon="plus">Create project</Button></Link>}
      />
    );
  }

  const p = project;
  const active = docs.find((d) => d.type === selected) ?? null;

  const generate = async (type: DocType) => {
    setGenerating(type);
    try {
      const doc = await api.docs.generate(p.id, type);
      setDocs((prev) => [...prev.filter((d) => d.type !== type), doc]);
      setSelected(type);
      setMobilePreview(true);
      push("success", `${doc.title.split(" — ")[0]} drafted`, "Preview is ready — copy or export when satisfied.");
    } catch (e) {
      push("error", "Doc Drafter failed", e instanceof Error ? e.message : undefined);
    } finally {
      setGenerating(null);
    }
  };

  const copy = async (doc: DocArtifact) => {
    const ok = await copyText(doc.content);
    push(ok ? "success" : "error", ok ? "Copied to clipboard" : "Copy failed", ok ? `${doc.title} (markdown)` : undefined);
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to={`/app/projects/${p.id}`} className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-400 transition hover:text-pine-700">
            <Icon name="arrowLeft" size={13} /> {p.title}
          </Link>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-[28px]">Documentation Generator</h1>
          <p className="mt-1 text-sm text-ink-500">
            11 standard documents, drafted by the Doc Drafter from your live blueprint — {docs.length} generated so far.
          </p>
        </div>
        <Badge tone="pine">{docs.length}/11 drafted</Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-2.5">
          {docsLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[74px]" />)}
          {!docsLoading &&
            DOC_META.map((meta, idx) => {
              const existing = docs.find((d) => d.type === meta.type);
              const isGenerating = generating === meta.type;
              const isSelected = selected === meta.type && existing;
              return (
                <motion.div key={meta.type} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}>
                  <div className={cn("flex items-center gap-3.5 rounded-xl border bg-paper-50 p-4 shadow-card transition", isSelected ? "border-pine-400 ring-2 ring-pine-100" : "border-ink-100 hover:border-ink-200")}>
                    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", existing ? "bg-pine-100 text-pine-700" : "bg-ink-100 text-ink-500")}>
                      <Icon name={meta.icon as IconName} size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-sm font-bold text-ink-900">{meta.title}</p>
                        {existing ? (
                          <span className="flex items-center gap-1 font-mono text-[9px] font-bold tracking-wider text-pine-700 uppercase">
                            <Icon name="check" size={10} strokeWidth={3} /> generated
                          </span>
                        ) : (
                          <span className="font-mono text-[9px] tracking-wider text-ink-400 uppercase">not generated</span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-ink-500">{meta.desc}</p>
                    </div>
                    {existing && (
                      <Button variant="ghost" size="sm" icon="eye" onClick={() => { setSelected(meta.type); setMobilePreview(true); }}>
                        <span className="hidden sm:inline">View</span>
                      </Button>
                    )}
                    <Button size="sm" variant={existing ? "outline" : "primary"} loading={isGenerating} icon={existing ? "refresh" : "spark"} onClick={() => void generate(meta.type)}>
                      {existing ? "Regenerate" : "Generate"}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card className="hidden overflow-hidden lg:block">
            <PreviewPane doc={active} generating={generating} project={p} onCopy={copy} />
          </Card>
        </div>
      </div>

      <Modal open={mobilePreview && !!active} onClose={() => setMobilePreview(false)} title={active?.title ?? "Document"} wide>
        {active && (
          <div>
            <div className="mb-3 flex gap-2">
              <Button size="sm" variant="outline" icon="copy" onClick={() => void copy(active)}>Copy</Button>
              <Button size="sm" variant="outline" icon="download" onClick={() => { download(`${active.type}.md`, active.content); push("success", "Download started", `${active.type}.md`); }}>
                .md
              </Button>
            </div>
            {active.diagram === "flowchart" && <FlowDiagram project={p} />}
            {active.diagram === "uml" && <UmlDiagram project={p} />}
            <Rich text={active.content} />
          </div>
        )}
      </Modal>
    </>
  );
}

function PreviewPane({ doc, generating, project, onCopy }: { doc: DocArtifact | null; generating: DocType | null; project: Project; onCopy: (d: DocArtifact) => void }) {
  if (generating) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-ink-900 text-pine-300">
            <Icon name="file" size={16} />
          </span>
          <div>
            <p className="font-display text-sm font-bold text-ink-900">Doc Drafter is writing…</p>
            <p className="font-mono text-[10px] tracking-wider text-ink-400 uppercase">pulling live scope, stack & risks</p>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-11/12" />
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-3.5 w-3/5" />
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-paper-200 text-ink-400">
          <Icon name="file" size={24} />
        </span>
        <h3 className="font-display mt-4 text-base font-bold text-ink-800">Nothing to preview yet</h3>
        <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-ink-500">
          Pick a document on the left and hit <strong>Generate</strong>. Drafts are composed from <em>{project.title}</em>'s real blueprint.
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[calc(100vh-190px)] overflow-y-auto">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 bg-paper-50/95 px-6 py-4 backdrop-blur">
        <div className="min-w-0">
          <p className="font-display truncate text-sm font-bold text-ink-900">{doc.title}</p>
          <p className="font-mono text-[9.5px] tracking-wider text-ink-400 uppercase">generated {fmtDateFull(doc.generatedAt)} · markdown</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" icon="copy" onClick={() => onCopy(doc)}>Copy</Button>
          <Button size="sm" icon="download" onClick={() => download(`${doc.type}.md`, doc.content)}>Export .md</Button>
        </div>
      </div>
      <div className="px-6 py-5">
        {doc.diagram === "flowchart" && <FlowDiagram project={project} />}
        {doc.diagram === "uml" && <UmlDiagram project={project} />}
        <Rich text={doc.content} />
      </div>
    </div>
  );
}

function FlowDiagram({ project }: { project: Project }) {
  const a = project.blueprint.architecture;
  return (
    <div className="mb-6 rounded-xl border border-ink-100 bg-paper-100/70 p-5">
      <p className="mb-4 font-mono text-[9.5px] font-semibold tracking-[0.2em] text-ink-400 uppercase">Fig. 1 — primary process flow</p>
      <div className="flex flex-col items-center">
        <span className="rounded-full bg-ink-900 px-5 py-2 font-mono text-[11px] font-bold tracking-widest text-paper-50 uppercase">Start · user request</span>
        {a.layers.map((l, i) => (
          <div key={l.name} className="flex w-full flex-col items-center">
            <Arrow />
            <div className={cn("w-full max-w-md rounded-lg border-2 px-4 py-3 text-center", i === 0 ? "border-gold-400 bg-gold-100" : "border-pine-500/50 bg-paper-50")}>
              <p className="font-mono text-[9px] font-bold tracking-widest text-ink-400 uppercase">{l.name}</p>
              <p className="mt-1 text-sm font-semibold text-ink-800">{l.components.slice(0, 3).join(" · ")}</p>
            </div>
            {i === 1 && (
              <div className="my-1 flex w-full max-w-md items-center justify-center gap-3">
                <span className="h-px flex-1 bg-clay-300" />
                <span className="rounded border border-clay-300 bg-clay-100 px-3 py-1 font-mono text-[9px] font-bold text-clay-700 uppercase">◇ valid? no → error response</span>
                <span className="h-px flex-1 bg-clay-300" />
              </div>
            )}
          </div>
        ))}
        <Arrow />
        <span className="rounded-full bg-pine-600 px-5 py-2 font-mono text-[11px] font-bold tracking-widest text-paper-50 uppercase">End · persisted & acknowledged</span>
      </div>
    </div>
  );
}

function UmlDiagram({ project }: { project: Project }) {
  const a = project.blueprint.architecture;
  return (
    <div className="mb-6 rounded-xl border border-ink-100 bg-paper-100/70 p-5">
      <p className="mb-4 font-mono text-[9.5px] font-semibold tracking-[0.2em] text-ink-400 uppercase">Fig. 1 — component view (UML)</p>
      <div className="space-y-3">
        {a.layers.map((l, i) => (
          <div key={l.name}>
            <div className="grid gap-2 sm:grid-cols-2">
              {l.components.slice(0, 4).map((c) => (
                <div key={c} className="rounded-lg border border-ink-300 bg-paper-50 shadow-card">
                  <div className="flex items-center justify-between rounded-t-lg border-b border-ink-200 bg-ink-900 px-3 py-1.5">
                    <span className="font-mono text-[9px] tracking-wider text-pine-300 uppercase">«component»</span>
                    <span className="flex gap-0.5">
                      <span className="size-1.5 rounded-full bg-paper-50/30" />
                      <span className="size-1.5 rounded-full bg-paper-50/30" />
                    </span>
                  </div>
                  <p className="px-3 py-2.5 text-sm font-semibold text-ink-800">{c}</p>
                </div>
              ))}
            </div>
            {i < a.layers.length - 1 && <p className="py-1 text-center font-mono text-[9px] tracking-widest text-ink-400 uppercase">┆ depends-on</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <svg width="14" height="30" viewBox="0 0 14 30" className="my-0.5" aria-hidden="true">
      <path d="M7 0v22m0 0l-4.5-5.5M7 22l4.5-5.5" stroke="var(--color-pine-500)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
