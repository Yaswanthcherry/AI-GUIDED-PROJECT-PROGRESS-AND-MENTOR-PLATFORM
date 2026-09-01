import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth, useToast } from "../context/StoreContext";
import { Button, Field, Input, Logo, Select } from "../components/ui";
import { Icon } from "../components/Icon";
import type { Role } from "../types";
import { cn } from "../utils";
import { usePageTitle } from "../hooks";
import { LEVELS } from "../services/generators";

function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="mx-auto grid min-h-screen max-w-6xl items-stretch gap-0 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-14">
      <div className="bg-grid-dark relative hidden overflow-hidden rounded-2xl border border-ink-800 bg-ink-950 p-10 lg:block">
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-pine-500/15 blur-[80px]" />
        <Logo light />
        <h2 className="font-display mt-10 text-3xl leading-tight font-bold text-paper-50">The plan exists before the panic does.</h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper-50/60">
          Log in to reach your workspace — blueprints, week plans, risk registers, documents and a mentor that knows your project.
        </p>
        <ul className="mt-9 space-y-4">
          {[
            { icon: "compass" as const, text: "Idea → scored blueprint in ~90 seconds" },
            { icon: "calendar" as const, text: "Week-by-week plan that survives exam season" },
            { icon: "chat" as const, text: "Mentor answers grounded in your live data" },
          ].map((f) => (
            <li key={f.text} className="flex items-center gap-3 text-sm text-paper-50/75">
              <span className="flex size-8 items-center justify-center rounded-lg border border-pine-500/30 bg-pine-500/10 text-pine-300">
                <Icon name={f.icon} size={15} />
              </span>
              {f.text}
            </li>
          ))}
        </ul>
        <div className="absolute right-10 bottom-10 left-10 rounded-xl border border-paper-50/10 bg-paper-50/5 p-4">
          <p className="font-mono text-[9.5px] font-semibold tracking-[0.2em] text-paper-50/40 uppercase">Demo credentials</p>
          <p className="mt-1.5 font-mono text-xs text-paper-50/70">student@campus.edu · faculty@campus.edu</p>
          <p className="font-mono text-xs text-pine-300">password: demo1234</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900">{title}</h1>
        <p className="mt-2 text-sm text-ink-500">{subtitle}</p>
        <div className="mt-8">{children}</div>
        <p className="mt-6 text-sm text-ink-500">{footer}</p>
      </motion.div>
    </div>
  );
}

/* ================= Login ================= */

export function LoginPage() {
  usePageTitle("Log in");
  const { login } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fillDemo = (r: Role) => {
    setRole(r);
    setEmail(r === "student" ? "student@campus.edu" : "faculty@campus.edu");
    setPassword("demo1234");
    setError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter both email and password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const u = await login(email, password);
      push("success", `Welcome back, ${u.name.split(" ")[0]}`, "Session started — opening your workspace.");
      navigate(u.role === "faculty" ? "/faculty" : "/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Log in" subtitle="Pick your role — the workspace adapts." footer={<>New to the platform? <Link to="/register" className="font-semibold text-pine-700 hover:underline">Create an account</Link></>}>
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg border border-ink-200 bg-paper-200/60 p-1" role="tablist" aria-label="Login role">
        {(["student", "faculty"] as Role[]).map((r) => (
          <button
            key={r}
            role="tab"
            aria-selected={role === r}
            onClick={() => {
              setRole(r);
              setError(null);
            }}
            className={cn("rounded-md py-2 font-mono text-[11px] font-bold tracking-[0.16em] uppercase transition", role === r ? "bg-ink-900 text-paper-50 shadow-card" : "text-ink-500 hover:text-ink-800")}
          >
            {r}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email" required>
          <Input type="email" autoComplete="email" placeholder={role === "student" ? "student@campus.edu" : "faculty@campus.edu"} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" required>
          <Input type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>

        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-clay-200 bg-clay-100/60 px-3.5 py-3 text-sm text-clay-700" role="alert">
            <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" loading={busy} iconRight={busy ? undefined : "arrowRight"}>
          {busy ? "Authenticating…" : `Log in as ${role}`}
        </Button>
      </form>

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => fillDemo("student")} className="rounded-full border border-pine-300 bg-pine-50 px-3.5 py-1.5 font-mono text-[10.5px] font-semibold tracking-wide text-pine-800 uppercase transition hover:bg-pine-100">
          Use demo student
        </button>
        <button onClick={() => fillDemo("faculty")} className="rounded-full border border-gold-300 bg-gold-100 px-3.5 py-1.5 font-mono text-[10.5px] font-semibold tracking-wide text-gold-700 uppercase transition hover:bg-gold-200">
          Use demo faculty
        </button>
      </div>
    </AuthShell>
  );
}

/* ================= Register ================= */

export function RegisterPage() {
  usePageTitle("Register");
  const { register } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", role: "student" as Role, level: LEVELS[1] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 3) errs.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Enter a valid email address.";
    if (form.password.length < 8) errs.password = "At least 8 characters.";
    if (form.confirm !== form.password) errs.confirm = "Passwords do not match.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    setServerError(null);
    try {
      const u = await register({ name: form.name, email: form.email, password: form.password, role: form.role, level: form.level });
      push("success", `Account created — welcome, ${u.name.split(" ")[0]}!`, "Your workspace is ready. Time to feed the orchestrator an idea.");
      navigate(u.role === "faculty" ? "/faculty" : "/app");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="One form, then the agents take your idea seriously." footer={<>Already registered? <Link to="/login" className="font-semibold text-pine-700 hover:underline">Log in</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full name" required error={errors.name}>
          <Input placeholder="e.g. Priya Sharma" value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" required error={errors.email}>
            <Input type="email" placeholder="you@campus.edu" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
          </Field>
          <Field label="Role" required>
            <Select value={form.role} onChange={(e) => set("role", e.target.value)}>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </Select>
          </Field>
        </div>
        {form.role === "student" && (
          <Field label="Academic level" hint="used by the Idea Evaluator">
            <Select value={form.level} onChange={(e) => set("level", e.target.value)}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" required error={errors.password} hint="min 8 chars">
            <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Confirm password" required error={errors.confirm}>
            <Input type="password" value={form.confirm} onChange={(e) => set("confirm", e.target.value)} autoComplete="new-password" />
          </Field>
        </div>

        {serverError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-clay-200 bg-clay-100/60 px-3.5 py-3 text-sm text-clay-700" role="alert">
            <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
            {serverError}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" loading={busy} iconRight={busy ? undefined : "spark"}>
          {busy ? "Creating account…" : "Register & enter workspace"}
        </Button>
      </form>
    </AuthShell>
  );
}
