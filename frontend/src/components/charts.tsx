import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Project, RiskLevel } from "../types";
import { burndownFor, weekLoadFor } from "../services/generators";

const INK = "#8ea195";
const PINE = "#1e8d5f";
const GOLD = "#e0af4a";
const CLAY = "#c05d3c";

function TooltipShell({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-ink-100 bg-paper-50 px-3 py-2 shadow-lift">
      <p className="font-mono text-[10px] font-semibold tracking-widest text-ink-400 uppercase">Week {label}</p>
      {payload
        .filter((p) => p.value != null)
        .map((p) => (
          <p key={p.name} className="mt-0.5 flex items-center gap-2 text-xs text-ink-700">
            <span className="size-2 rounded-sm" style={{ background: p.color }} />
            {p.name}: <strong>{p.value}</strong>
          </p>
        ))}
    </div>
  );
}

/** Planned vs actual completion curve for one project. */
export function BurndownChart({ project }: { project: Project }) {
  const data = burndownFor(project);
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="gActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PINE} stopOpacity={0.22} />
              <stop offset="100%" stopColor={PINE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#d8ded3" vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 10.5, fill: INK, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10.5, fill: INK, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} unit="%" />
          <Tooltip content={<TooltipShell />} />
          <Area type="monotone" dataKey="planned" name="Planned" stroke={INK} strokeDasharray="5 4" strokeWidth={1.6} fill="none" dot={false} />
          <Area type="monotone" dataKey="actual" name="Actual" stroke={PINE} strokeWidth={2.4} fill="url(#gActual)" dot={false} connectNulls={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Per-week task load split by status. */
export function WeeklyLoadChart({ project }: { project: Project }) {
  const data = weekLoadFor(project);
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid strokeDasharray="3 3" stroke="#d8ded3" vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 10.5, fill: INK, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 10.5, fill: INK, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
          <Tooltip content={<TooltipShell />} cursor={{ fill: "rgba(14,27,20,0.04)" }} />
          <Bar dataKey="done" name="Done" stackId="w" fill={PINE} />
          <Bar dataKey="open" name="Open" stackId="w" fill={GOLD} />
          <Bar dataKey="delayed" name="Delayed" stackId="w" fill={CLAY} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Portfolio risk distribution for faculty. */
export function RiskDonut({ counts }: { counts: Record<RiskLevel, number> }) {
  const data = [
    { name: "Low", value: counts.low, color: PINE },
    { name: "Medium", value: counts.medium, color: GOLD },
    { name: "High", value: counts.high, color: CLAY },
  ];
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-[150px] w-[150px] shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={70} paddingAngle={3} strokeWidth={0}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl leading-none font-bold text-ink-900">{total}</span>
          <span className="mt-1 font-mono text-[9px] tracking-[0.18em] text-ink-400 uppercase">projects</span>
        </div>
      </div>
      <ul className="space-y-2.5">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2.5 text-sm text-ink-600">
            <span className="size-2.5 rounded-sm" style={{ background: d.color }} />
            <span className="w-16">{d.name}</span>
            <strong className="font-display text-ink-900">{d.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
