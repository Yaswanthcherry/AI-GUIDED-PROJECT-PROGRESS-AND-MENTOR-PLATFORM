import { useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth, useProjects, useToast } from "../context/StoreContext";
import { Badge, Button, Logo, Modal } from "../components/ui";
import { Icon } from "../components/Icon";
import type { IconName } from "../components/Icon";
import { cn, todayLong } from "../utils";
import { useClickOutside } from "../hooks";
import { MOCK_MODE } from "../services/api";

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
  match?: (path: string) => boolean;
}

const STUDENT_NAV: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: "grid", end: true },
  { to: "/app/projects/new", label: "Create Project", icon: "plus" },
  {
    to: "",
    label: "Active Project",
    icon: "folder",
    match: (p) => /^\/app\/projects\/[^/]+/.test(p) && !/\/new$/.test(p),
  },
];

const FACULTY_NAV: NavItem[] = [
  { to: "/faculty", label: "Dashboard", icon: "grid", end: true },
  { to: "/faculty/projects", label: "Student Projects", icon: "users" },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { projects } = useProjects();
  const { push } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);

  const isFaculty = user?.role === "faculty";
  const nav = isFaculty ? FACULTY_NAV : STUDENT_NAV;

  const activeProject = useMemo(() => {
    if (isFaculty || !user) return undefined;
    const m = location.pathname.match(/^\/app\/projects\/([^/]+)/);
    if (m) return projects.find((p) => p.id === m[1]);
    return [...projects].filter((p) => p.status !== "completed").sort((a, b) => b.lastUpdate.localeCompare(a.lastUpdate))[0];
  }, [isFaculty, user, location.pathname, projects]);

  const studentNav: NavItem[] = useMemo(
    () => STUDENT_NAV.map((n) => (n.label === "Active Project" ? { ...n, to: activeProject ? `/app/projects/${activeProject.id}` : "/app" } : n)),
    [activeProject],
  );
  const finalNav = isFaculty ? nav : studentNav;

  const notifications = useMemo(() => {
    if (isFaculty) {
      const flagged = [...projects].filter((p) => p.status === "delayed" || p.riskLevel === "high").sort((a, b) => b.lastUpdate.localeCompare(a.lastUpdate));
      return flagged.slice(0, 6).map((p) => ({
        id: p.id,
        text: `${p.studentName} — ${p.title}`,
        meta: p.status === "delayed" ? "Project delayed" : "High risk exposure",
        to: `/faculty/projects/${p.id}`,
        tone: "clay" as const,
      }));
    }
    const list = activeProject
      ? [activeProject]
      : [...projects].filter((p) => p.status !== "completed").sort((a, b) => b.lastUpdate.localeCompare(a.lastUpdate)).slice(0, 2);
    return list
      .flatMap((p) =>
        [
          ...p.tasks.filter((t) => t.status === "delayed").map((t) => ({ id: `${p.id}-${t.id}`, text: t.title, meta: `Delayed · ${p.title}`, to: `/app/projects/${p.id}/progress`, tone: "clay" as const })),
          ...p.blueprint.risks.filter((r) => r.severity === "High").slice(0, 1).map((r) => ({ id: `${p.id}-${r.id}`, text: r.risk, meta: `High risk · ${p.title}`, to: `/app/projects/${p.id}/blueprint/risks`, tone: "gold" as const })),
        ].slice(0, 3),
      )
      .slice(0, 6);
  }, [isFaculty, projects, activeProject]);

  const notifRef = useClickOutside<HTMLDivElement>(() => setNotifOpen(false));
  const initials = (user?.name ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const confirmLogout = () => {
    setLogoutModal(false);
    logout();
    push("info", "Logged out", "See you at the next supervision.");
    navigate("/");
  };

  const navButton = (n: NavItem, mobile = false) => {
    const active = n.end ? location.pathname === n.to : n.match ? n.match(location.pathname) : location.pathname.startsWith(n.to);
    const disabled = !isFaculty && n.label === "Active Project" && !activeProject;
    const inner = (
      <>
        <span className={cn("flex size-7 items-center justify-center rounded-md transition", active ? "bg-pine-500/20 text-pine-300" : "bg-paper-50/5 text-paper-50/50")}>
          <Icon name={n.icon} size={15} />
        </span>
        <span className="flex-1">{n.label}</span>
        {!isFaculty && n.label === "Active Project" && activeProject && <span className="size-1.5 rounded-full bg-pine-400 animate-pulse-dot" />}
        {!isFaculty && n.label === "Active Project" && !activeProject && (
          <span className="font-mono text-[9px] tracking-wider text-paper-50/30 uppercase">none</span>
        )}
      </>
    );
    if (active) {
      return (
        <div key={n.label} className="relative">
          <span className="absolute top-1/2 -left-3 h-6 w-1 -translate-y-1/2 rounded-r bg-pine-400" />
          <div className="flex cursor-default items-center gap-3 rounded-lg border border-pine-500/20 bg-pine-500/10 px-3 py-2.5 text-sm font-semibold text-paper-50">{inner}</div>
        </div>
      );
    }
    if (disabled) {
      return (
        <div key={n.label} title="Create a project first" className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-paper-50/30">
          {inner}
        </div>
      );
    }
    return (
      <NavLink
        key={n.label}
        to={n.to}
        onClick={mobile ? () => setMenuOpen(false) : undefined}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-paper-50/60 transition hover:bg-paper-50/5 hover:text-paper-50"
      >
        {inner}
      </NavLink>
    );
  };

  const subNav = (mobile = false) =>
    !isFaculty && activeProject && /^\/app\/projects\/[^/]+/.test(location.pathname) ? (
      <div className="pt-4">
        <p className="px-3 pb-2 font-mono text-[9.5px] font-semibold tracking-[0.22em] text-paper-50/35 uppercase">{activeProject.title.slice(0, 26)}</p>
        {[
          { to: "", label: "Overview", icon: "eye" as IconName },
          { to: "/blueprint", label: "AI Blueprint", icon: "compass" as IconName },
          { to: "/progress", label: "Progress", icon: "chart" as IconName },
          { to: "/docs", label: "Documentation", icon: "file" as IconName },
          { to: "/mentor", label: "AI Mentor", icon: "chat" as IconName },
        ].map((s) => {
          const to = `/app/projects/${activeProject.id}${s.to}`;
          const active = s.to === "" ? location.pathname === to : location.pathname.startsWith(to);
          return (
            <NavLink
              key={s.to}
              to={to}
              onClick={mobile ? () => setMenuOpen(false) : undefined}
              className={cn(
                "ml-2 flex items-center gap-2.5 rounded-lg border-l-2 px-3 py-2 text-[13px] font-medium transition",
                active ? "border-pine-400 bg-pine-500/10 text-paper-50" : "border-ink-800 text-paper-50/50 hover:border-ink-600 hover:text-paper-50/85",
              )}
            >
              <Icon name={s.icon} size={14} />
              {s.label}
            </NavLink>
          );
        })}
      </div>
    ) : null;

  return (
    <div className="min-h-screen lg:pl-[248px]">
      {/* ============ sidebar ============ */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-ink-800 bg-ink-950 lg:flex">
        <div className="border-b border-ink-800 px-5 py-5">
          <Link to={isFaculty ? "/faculty" : "/app"} aria-label="Workspace home">
            <Logo light />
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Workspace">
          <p className="px-3 pb-2 font-mono text-[9.5px] font-semibold tracking-[0.22em] text-paper-50/35 uppercase">
            {isFaculty ? "Faculty" : "Student"} workspace
          </p>
          {finalNav.map((n) => navButton(n))}
          {subNav()}
        </nav>

        <div className="border-t border-ink-800 p-4">
          <div className="flex items-center gap-3">
            <span className="font-display flex size-9 shrink-0 items-center justify-center rounded-lg bg-pine-500/20 text-xs font-bold text-pine-300">{initials}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-paper-50">{user?.name}</p>
              <p className="font-mono text-[9px] tracking-widest text-paper-50/40 uppercase">{user?.role}</p>
            </div>
            <button onClick={() => setLogoutModal(true)} aria-label="Log out" className="rounded-lg p-2 text-paper-50/50 transition hover:bg-paper-50/10 hover:text-clay-300">
              <Icon name="logout" size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ============ topbar ============ */}
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-paper-100/85 backdrop-blur-md">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <button className="rounded-lg p-2 text-ink-600 transition hover:bg-ink-900/5 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Icon name="menu" size={19} />
          </button>
          <span className="lg:hidden">
            <Logo compact />
          </span>

          <p className="hidden font-mono text-[10.5px] tracking-[0.18em] text-ink-400 uppercase md:block">{todayLong()}</p>

          <div className="ml-auto flex items-center gap-2.5">
            {MOCK_MODE ? (
              <span
                title="VITE_API_BASE_URL is empty — serving the simulated agent layer. Set it to the FastAPI origin to go live."
                className="hidden items-center gap-1.5 rounded-full border border-gold-300 bg-gold-100 px-2.5 py-1 font-mono text-[9px] font-bold tracking-widest text-gold-700 uppercase sm:flex"
              >
                <span className="size-1.5 rounded-full bg-gold-500 animate-pulse-dot" />
                Demo data
              </span>
            ) : (
              <span className="hidden items-center gap-1.5 rounded-full border border-pine-300 bg-pine-50 px-2.5 py-1 font-mono text-[9px] font-bold tracking-widest text-pine-700 uppercase sm:flex">
                <span className="size-1.5 rounded-full bg-pine-500 animate-pulse-dot" />
                Live API
              </span>
            )}
            <Badge tone={isFaculty ? "gold" : "pine"} className="hidden sm:inline-flex">
              {isFaculty ? "Faculty" : "Student"}
            </Badge>

            {/* notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                aria-label={`Notifications (${notifications.length})`}
                aria-expanded={notifOpen}
                className="relative rounded-lg border border-ink-200 bg-paper-50 p-2 text-ink-500 transition hover:border-pine-400 hover:text-pine-700"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 15 18 9zM10 20a2.2 2.2 0 0 0 4 0" />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-clay-500 font-mono text-[8.5px] font-bold text-paper-50">
                    {notifications.length}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 z-50 mt-2 w-[min(92vw,340px)] origin-top-right overflow-hidden rounded-xl border border-ink-100 bg-paper-50 shadow-lift"
                  >
                    <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
                      <p className="font-display text-sm font-bold text-ink-900">Needs attention</p>
                      <span className="font-mono text-[9.5px] tracking-widest text-ink-400 uppercase">{notifications.length} items</span>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-ink-500">All clear — nothing flagged by the agents.</p>
                    ) : (
                      <ul className="max-h-72 divide-y divide-ink-100 overflow-y-auto">
                        {notifications.map((n) => (
                          <li key={n.id}>
                            <Link to={n.to} onClick={() => setNotifOpen(false)} className="flex items-start gap-3 px-4 py-3 transition hover:bg-pine-50/60">
                              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.tone === "clay" ? "bg-clay-500" : "bg-gold-500")} />
                              <span className="min-w-0">
                                <span className="block truncate text-[13px] font-semibold text-ink-800">{n.text}</span>
                                <span className="font-mono text-[9.5px] tracking-wider text-ink-400 uppercase">{n.meta}</span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <span className="font-display flex size-8 items-center justify-center rounded-lg bg-ink-900 text-[11px] font-bold text-pine-300">{initials}</span>
          </div>
        </div>
      </header>

      {/* ============ mobile drawer ============ */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div className="fixed inset-0 z-[60] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink-950/60" onClick={() => setMenuOpen(false)} />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="absolute inset-y-0 left-0 flex w-[268px] flex-col border-r border-ink-800 bg-ink-950"
            >
              <div className="flex items-center justify-between border-b border-ink-800 px-5 py-5">
                <Logo light />
                <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="rounded-lg p-2 text-paper-50/60 hover:bg-paper-50/10">
                  <Icon name="close" size={17} />
                </button>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Mobile workspace">
                <p className="px-3 pb-2 font-mono text-[9.5px] font-semibold tracking-[0.22em] text-paper-50/35 uppercase">
                  {isFaculty ? "Faculty" : "Student"} workspace
                </p>
                {finalNav.map((n) => navButton(n, true))}
                {subNav(true)}
              </nav>
              <div className="border-t border-ink-800 p-4">
                <Button variant="outline" size="sm" icon="logout" className="w-full border-ink-700 bg-transparent text-paper-50/70 hover:border-clay-400 hover:text-clay-300" onClick={() => { setMenuOpen(false); setLogoutModal(true); }}>
                  Log out
                </Button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ content ============ */}
      <main className="mx-auto max-w-[1200px] px-4 py-7 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <Modal
        open={logoutModal}
        onClose={() => setLogoutModal(false)}
        title="Log out?"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setLogoutModal(false)}>
              Stay
            </Button>
            <Button variant="danger" size="sm" icon="logout" onClick={confirmLogout}>
              Log out
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-600">
          Your session will end on this device. Projects, blueprints and chat history stay saved{MOCK_MODE ? " in this browser" : " on the server"}.
        </p>
      </Modal>
    </div>
  );
}
