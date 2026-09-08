import { useEffect, useMemo } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";
import { cn } from "../utils";
import { PRODUCT_SUBLINE, PRODUCT_WORDMARK } from "../config/brand";
import type { ProjectStatus, RiskLevel, TaskStatus } from "../types";

/* ============================ Logo ============================ */

export function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="1" y="1" width="30" height="30" rx="8" className={light ? "fill-paper-50/10" : "fill-ink-900"} stroke={light ? "rgba(255,255,255,0.18)" : "rgba(30,141,95,0.5)"} />
        <circle cx="16" cy="16" r="3" className="fill-pine-400" />
        <circle cx="16" cy="7.5" r="2" className="fill-gold-400" />
        <circle cx="8.5" cy="22" r="2" className="fill-paper-300" />
        <circle cx="23.5" cy="22" r="2" className="fill-pine-600" />
        <path d="M16 10v3M13.6 17.7l-3.6 3M18.4 17.7l3.6 3" className={light ? "stroke-paper-50/40" : "stroke-ink-300"} strokeWidth="1.4" />
      </svg>
      {!compact && (
        <span className="leading-none">
          <span className={cn("font-display block text-[17px] font-bold tracking-tight", light ? "text-paper-50" : "text-ink-900")}>{PRODUCT_WORDMARK}</span>
          <span className={cn("mt-1 block font-mono text-[8.5px] font-medium tracking-[0.18em]", light ? "text-paper-50/50" : "text-ink-400")}>{PRODUCT_SUBLINE}</span>
        </span>
      )}
    </span>
  );
}

/* ============================ Button ============================ */

type BtnVariant = "primary" | "dark" | "outline" | "ghost" | "danger" | "gold";
type BtnSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
}

const BTN_VARIANT: Record<BtnVariant, string> = {
  primary: "bg-pine-600 text-paper-50 hover:bg-pine-500 active:bg-pine-700 shadow-card",
  dark: "bg-ink-900 text-paper-50 hover:bg-ink-700 active:bg-ink-950",
  outline: "border border-ink-200 bg-paper-50 text-ink-800 hover:border-pine-400 hover:text-pine-700",
  ghost: "text-ink-600 hover:bg-ink-900/5 hover:text-ink-900",
  danger: "bg-clay-600 text-paper-50 hover:bg-clay-500",
  gold: "bg-gold-500 text-ink-950 hover:bg-gold-400",
};

const BTN_SIZE: Record<BtnSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-xs",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-12 gap-2.5 px-6 text-[15px]",
};

export function Button({ variant = "primary", size = "md", icon, iconRight, loading, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={cn(
        "font-display inline-flex items-center justify-center rounded-lg font-semibold whitespace-nowrap transition-all duration-150 select-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine-500",
        "disabled:pointer-events-none disabled:opacity-50",
        BTN_VARIANT[variant],
        BTN_SIZE[size],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : (
        icon && <Icon name={icon} size={size === "sm" ? 14 : 16} />
      )}
      {children}
      {iconRight && !loading && <Icon name={iconRight} size={size === "sm" ? 14 : 16} />}
    </button>
  );
}

/* ============================ Badges ============================ */

type Tone = "pine" | "gold" | "clay" | "ink" | "paper";

const TONE: Record<Tone, string> = {
  pine: "bg-pine-100 text-pine-800 border-pine-200",
  gold: "bg-gold-100 text-gold-700 border-gold-200",
  clay: "bg-clay-100 text-clay-700 border-clay-200",
  ink: "bg-ink-100 text-ink-700 border-ink-200",
  paper: "bg-paper-50 text-ink-500 border-ink-200",
};

export function Badge({ tone = "ink", className, children, dot = true }: { tone?: Tone; className?: string; children: ReactNode; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] font-semibold tracking-wide uppercase", TONE[tone], className)}>
      {dot && <span className={cn("size-1.5 rounded-full", tone === "pine" ? "bg-pine-500" : tone === "gold" ? "bg-gold-500" : tone === "clay" ? "bg-clay-500" : "bg-ink-400")} />}
      {children}
    </span>
  );
}

export const STATUS_META: Record<ProjectStatus, { label: string; tone: Tone }> = {
  planning: { label: "Planning", tone: "gold" },
  active: { label: "Active", tone: "pine" },
  completed: { label: "Completed", tone: "ink" },
  delayed: { label: "Delayed", tone: "clay" },
};

export const RISK_META: Record<RiskLevel, { label: string; tone: Tone }> = {
  low: { label: "Low risk", tone: "pine" },
  medium: { label: "Medium risk", tone: "gold" },
  high: { label: "High risk", tone: "clay" },
};

export const TASK_META: Record<TaskStatus, { label: string; tone: Tone }> = {
  done: { label: "Done", tone: "pine" },
  "in-progress": { label: "In progress", tone: "gold" },
  pending: { label: "Pending", tone: "ink" },
  delayed: { label: "Delayed", tone: "clay" },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const m = STATUS_META[status];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}
export function RiskBadge({ level }: { level: RiskLevel }) {
  const m = RISK_META[level];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}
export function TaskBadge({ status }: { status: TaskStatus }) {
  const m = TASK_META[status];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

/* ============================ Progress ============================ */

export function ProgressBar({ value, tone = "pine", className, track = "bg-paper-200" }: { value: number; tone?: Tone; className?: string; track?: string }) {
  const fill = tone === "pine" ? "bg-pine-500" : tone === "gold" ? "bg-gold-500" : tone === "clay" ? "bg-clay-500" : "bg-ink-400";
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full", track, className)}>
      <motion.div
        className={cn("h-full rounded-full", fill)}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

export function Ring({ value, size = 88, stroke = 8, className, children }: { value: number; size?: number; stroke?: number; className?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-paper-200" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className={v >= 100 ? "stroke-ink-500" : "stroke-pine-500"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * v) / 100 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children ?? <span className="font-display text-lg font-bold text-ink-900">{v}%</span>}</div>
    </div>
  );
}

/* ============================ Surfaces ============================ */

export function Card({ className, children, hover = false }: { className?: string; children: ReactNode; hover?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-ink-100 bg-paper-50 shadow-card",
        hover && "transition-all duration-200 hover:-translate-y-0.5 hover:border-pine-300 hover:shadow-lift",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHead({ kicker, title, desc, className }: { kicker: string; title: string; desc?: string; className?: string }) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <p className="font-mono text-[11px] font-semibold tracking-[0.22em] text-pine-700 uppercase">{kicker}</p>
      <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-balance text-ink-900 sm:text-4xl">{title}</h2>
      {desc && <p className="mt-4 text-[15px] leading-relaxed text-ink-500">{desc}</p>}
    </div>
  );
}

export function Callout({ tone = "pine", title, icon = "spark", children, className }: { tone?: Tone; title?: string; icon?: IconName; children: ReactNode; className?: string }) {
  const border = tone === "pine" ? "border-pine-400" : tone === "gold" ? "border-gold-400" : tone === "clay" ? "border-clay-400" : "border-ink-300";
  const bg = tone === "pine" ? "bg-pine-50" : tone === "gold" ? "bg-gold-100/60" : tone === "clay" ? "bg-clay-100/60" : "bg-paper-100";
  const ic = tone === "pine" ? "text-pine-600" : tone === "gold" ? "text-gold-600" : tone === "clay" ? "text-clay-600" : "text-ink-500";
  return (
    <div className={cn("rounded-r-lg border-l-4 p-4", border, bg, className)}>
      <div className="flex items-start gap-3">
        <span className={cn("mt-0.5 shrink-0", ic)}>
          <Icon name={icon} size={17} />
        </span>
        <div className="min-w-0 text-sm leading-relaxed text-ink-700">
          {title && <p className="font-display mb-1 text-sm font-bold text-ink-900">{title}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

export function Stat({ label, value, sub, icon, tone = "ink" }: { label: string; value: ReactNode; sub?: ReactNode; icon: IconName; tone?: Tone }) {
  const iconCls =
    tone === "pine" ? "bg-pine-100 text-pine-700" : tone === "gold" ? "bg-gold-100 text-gold-700" : tone === "clay" ? "bg-clay-100 text-clay-700" : "bg-ink-100 text-ink-600";
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10.5px] font-semibold tracking-[0.16em] text-ink-400 uppercase">{label}</p>
          <p className="font-display mt-2 text-[26px] leading-none font-bold text-ink-900">{value}</p>
          {sub && <div className="mt-2 truncate text-xs text-ink-500">{sub}</div>}
        </div>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", iconCls)}>
          <Icon name={icon} size={17} />
        </span>
      </div>
    </Card>
  );
}

export function PageHead({ title, desc, actions, back }: { title: ReactNode; desc?: ReactNode; actions?: ReactNode; back?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back}
        <h1 className="font-display text-2xl font-bold tracking-tight text-balance text-ink-900 sm:text-[28px]">{title}</h1>
        {desc && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-500">{desc}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ============================ States ============================ */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function EmptyState({ icon = "folder", title, desc, action }: { icon?: IconName; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 bg-paper-50/50 px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-paper-200 text-ink-400">
        <Icon name={icon} size={22} />
      </span>
      <h3 className="font-display mt-4 text-base font-bold text-ink-800">{title}</h3>
      {desc && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-500">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-clay-200 bg-clay-100/40 px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-clay-100 text-clay-600">
        <Icon name="alert" size={22} />
      </span>
      <h3 className="font-display mt-4 text-base font-bold text-ink-900">Something went wrong</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-600">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" icon="refresh" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/* ============================ Modal ============================ */

export function Modal({ open, onClose, title, children, footer, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-ink-950/50 p-4 backdrop-blur-[2px] sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn("w-full rounded-xl border border-ink-100 bg-paper-50 shadow-lift", wide ? "max-w-2xl" : "max-w-md")}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          >
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <h3 className="font-display text-base font-bold text-ink-900">{title}</h3>
              <button onClick={onClose} aria-label="Close dialog" className="rounded-md p-1.5 text-ink-400 transition hover:bg-paper-200 hover:text-ink-800">
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
            {footer && <div className="flex justify-end gap-2 border-t border-ink-100 px-5 py-3.5">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================ Form primitives ============================ */

export function Field({ label, hint, error, children, required }: { label: string; hint?: string; error?: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="font-mono text-[10.5px] font-semibold tracking-[0.16em] text-ink-500 uppercase">
          {label} {required && <span className="text-clay-500">*</span>}
        </span>
        {hint && <span className="text-[11px] text-ink-400">{hint}</span>}
      </span>
      {children}
      {error && (
        <span className="mt-1.5 flex items-center gap-1 text-xs font-medium text-clay-600">
          <Icon name="alert" size={12} /> {error}
        </span>
      )}
    </label>
  );
}

const CONTROL =
  "w-full rounded-lg border border-ink-200 bg-paper-50 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 transition focus:border-pine-500 focus:ring-2 focus:ring-pine-200 focus:outline-none";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(CONTROL, props.className)} />;
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(CONTROL, "min-h-[96px] leading-relaxed", props.className)} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(CONTROL, "appearance-none bg-no-repeat pr-9", props.className)}
      style={{
        backgroundImage:
          "url(\"image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2363796c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9.5l6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundPosition: "right 12px center",
      }}
    />
  );
}

/* ============================ Phases ============================ */

export const PHASES = ["Planning & Design", "Core Development", "Integration & Testing", "Documentation", "Submission & Demo"];

export const PHASE_BAR: Record<string, string> = {
  "Planning & Design": "bg-gold-400",
  "Core Development": "bg-pine-500",
  "Integration & Testing": "bg-ink-500",
  Documentation: "bg-pine-300",
  "Submission & Demo": "bg-clay-400",
};

export function PhaseStepper({ phase }: { phase: string }) {
  const idx = PHASES.findIndex((p) => phase.toLowerCase().includes(p.toLowerCase().split(" ")[0]));
  const active = idx < 0 ? 0 : idx;
  return (
    <ol className="flex flex-wrap items-center gap-y-2">
      {PHASES.map((p, i) => (
        <li key={p} className="flex items-center">
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full border font-mono text-[10px] font-bold",
                i < active && "border-pine-500 bg-pine-500 text-paper-50",
                i === active && "border-pine-600 bg-pine-600 text-paper-50 ring-4 ring-pine-200",
                i > active && "border-ink-200 bg-paper-50 text-ink-400",
              )}
            >
              {i < active ? <Icon name="check" size={11} strokeWidth={2.5} /> : i + 1}
            </span>
            <span className={cn("text-xs font-medium", i === active ? "text-ink-900" : i < active ? "text-pine-700" : "text-ink-400")}>{p}</span>
          </span>
          {i < PHASES.length - 1 && <span className={cn("mx-3 hidden h-px w-6 sm:block", i < active ? "bg-pine-400" : "bg-ink-200")} />}
        </li>
      ))}
    </ol>
  );
}

/* ============================ Rich text (agent markdown-lite) ============================ */

function inline(text: string, keyBase: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_|~~[^~]+~~)/g).filter(Boolean);
  return parts.map((part, i) => {
    const key = `${keyBase}-${i}`;
    if (part.startsWith("**") && part.endsWith("**"))
      return (
        <strong key={key} className="font-semibold text-ink-900">
          {part.slice(2, -2)}
        </strong>
      );
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code key={key} className="rounded bg-ink-900/8 px-1.5 py-0.5 font-mono text-[0.85em] text-pine-700">
          {part.slice(1, -1)}
        </code>
      );
    if (part.startsWith("~~") && part.endsWith("~~"))
      return (
        <span key={key} className="text-ink-400 line-through">
          {part.slice(2, -2)}
        </span>
      );
    if (part.startsWith("_") && part.endsWith("_"))
      return (
        <em key={key} className="text-ink-500">
          {part.slice(1, -1)}
        </em>
      );
    return <span key={key}>{part}</span>;
  });
}

export function Rich({ text }: { text: string }) {
  const blocks = useMemo(() => {
    const lines = text.split("\n");
    const out: ReactNode[] = [];
    let i = 0;
    let k = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) {
        i++;
        continue;
      }
      if (line.startsWith("### ")) {
        out.push(
          <p key={k++} className="font-display mt-4 mb-2 text-[13px] font-bold tracking-wide text-pine-800 uppercase first:mt-0">
            {inline(line.slice(4), `h${k}`)}
          </p>,
        );
        i++;
        continue;
      }
      if (line.startsWith("|")) {
        const rows: string[][] = [];
        while (i < lines.length && lines[i].startsWith("|")) {
          const cells = lines[i].split("|").slice(1, -1).map((c) => c.trim());
          if (!cells.every((c) => /^[-: ]+$/.test(c))) rows.push(cells);
          i++;
        }
        out.push(
          <div key={k++} className="my-3 overflow-x-auto rounded-lg border border-ink-100">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-paper-200/70">
                  {rows[0]?.map((c, ci) => (
                    <th key={ci} className="px-3 py-2 font-mono text-[10px] font-semibold tracking-wider text-ink-600 uppercase">
                      {inline(c, `th${k}${ci}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(1).map((r, ri) => (
                  <tr key={ri} className="border-t border-ink-100 align-top">
                    {r.map((c, ci) => (
                      <td key={ci} className="px-3 py-2 text-ink-600">
                        {inline(c, `td${k}${ri}${ci}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
        continue;
      }
      if (line.startsWith("- ")) {
        const items: string[] = [];
        while (i < lines.length && lines[i].startsWith("- ")) {
          items.push(lines[i].slice(2));
          i++;
        }
        out.push(
          <ul key={k++} className="my-2 space-y-1.5">
            {items.map((it, ii) => (
              <li key={ii} className="flex gap-2.5 leading-relaxed">
                <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-pine-500" />
                <span>{inline(it, `li${k}${ii}`)}</span>
              </li>
            ))}
          </ul>,
        );
        continue;
      }
      if (/^\d+\.\s/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
          items.push(lines[i].replace(/^\d+\.\s/, ""));
          i++;
        }
        out.push(
          <ol key={k++} className="my-2 space-y-1.5">
            {items.map((it, ii) => (
              <li key={ii} className="flex gap-2.5 leading-relaxed">
                <span className="font-mono text-[11px] font-bold text-pine-700">{String(ii + 1).padStart(2, "0")}</span>
                <span>{inline(it, `ol${k}${ii}`)}</span>
              </li>
            ))}
          </ol>,
        );
        continue;
      }
      out.push(
        <p key={k++} className="my-2 leading-relaxed first:mt-0 last:mb-0">
          {inline(line, `p${k}`)}
        </p>,
      );
      i++;
    }
    return out;
  }, [text]);

  return <div className="text-sm text-ink-700">{blocks}</div>;
}
