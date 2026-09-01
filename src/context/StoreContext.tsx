import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Project, Role, TaskStatus, User } from "../types";
import { api, TOKEN_KEY, UNAUTHORIZED_EVENT } from "../services/api";
import { cn, uid } from "../utils";
import { Icon } from "../components/Icon";

/* ============================ Toasts ============================ */

export type ToastKind = "success" | "error" | "info";
interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  desc?: string;
}

interface ToastCtx {
  push: (kind: ToastKind, title: string, desc?: string) => void;
}

const ToastContext = createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast outside provider");
  return ctx;
}

const TOAST_STYLE: Record<ToastKind, { icon: "check" | "alert" | "info"; ring: string; bar: string }> = {
  success: { icon: "check", ring: "border-pine-300", bar: "bg-pine-500" },
  error: { icon: "alert", ring: "border-clay-300", bar: "bg-clay-500" },
  info: { icon: "info", ring: "border-ink-200", bar: "bg-ink-500" },
};

function ToastHost({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[90] flex w-[min(92vw,360px)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const s = TOAST_STYLE[t.kind];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={cn("pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-lg border bg-paper-50 py-3 pr-3 pl-4 shadow-lift", s.ring)}
            >
              <span className={cn("absolute inset-y-0 left-0 w-1", s.bar)} />
              <span className="mt-0.5 shrink-0">
                <Icon name={s.icon} size={17} className={t.kind === "success" ? "text-pine-600" : t.kind === "error" ? "text-clay-600" : "text-ink-500"} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900">{t.title}</p>
                {t.desc && <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{t.desc}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="shrink-0 rounded p-1 text-ink-400 transition hover:bg-paper-200 hover:text-ink-700">
                <Icon name="close" size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ============================ Auth ============================ */

interface AuthCtx {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (p: { name: string; email: string; password: string; role: Role; level?: string }) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}

const SESSION_KEY = "aapm.session.v1";

/* ============================ Projects ============================ */

interface ProjectsCtx {
  projects: Project[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getProject: (id: string) => Project | undefined;
  setProject: (p: Project) => void;
  updateTaskStatus: (projectId: string, taskId: string, status: TaskStatus) => Promise<void>;
}

const ProjectsContext = createContext<ProjectsCtx | null>(null);

export function useProjects(): ProjectsCtx {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects outside provider");
  return ctx;
}

/* ============================ Provider ============================ */

export function StoreProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, number>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    window.clearTimeout(timers.current[id]);
  }, []);

  const push = useCallback(
    (kind: ToastKind, title: string, desc?: string) => {
      const id = uid();
      setToasts((t) => [...t.slice(-3), { id, kind, title, desc }]);
      timers.current[id] = window.setTimeout(() => dismiss(id), 4600);
    },
    [dismiss],
  );

  /* ----- auth ----- */
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });
  const userRef = useRef(user);
  userRef.current = user;

  const persistSession = useCallback((u: User | null) => {
    setUser(u);
    try {
      if (u) localStorage.setItem(SESSION_KEY, JSON.stringify(u));
      else {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const u = await api.auth.login(email, password);
      persistSession(u);
      return u;
    },
    [persistSession],
  );

  const register = useCallback(
    async (p: { name: string; email: string; password: string; role: Role; level?: string }) => {
      const u = await api.auth.register(p);
      persistSession(u);
      return u;
    },
    [persistSession],
  );

  const logout = useCallback(() => persistSession(null), [persistSession]);

  /* ----- global 401 handling: expired/invalid JWT signs the user out ----- */
  useEffect(() => {
    const onUnauthorized = () => {
      if (userRef.current) {
        push("info", "Session expired", "Your token is no longer valid — please log in again.");
        persistSession(null);
      }
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [push, persistSession]);

  /* ----- projects ----- */
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setProjects([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await api.projects.list(user);
      setProjects(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setProject = useCallback((p: Project) => {
    setProjects((prev) => {
      const exists = prev.some((x) => x.id === p.id);
      return exists ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev];
    });
  }, []);

  const updateTaskStatus = useCallback(async (projectId: string, taskId: string, status: TaskStatus) => {
    const updated = await api.projects.updateTask(projectId, taskId, status);
    setProjects((prev) => prev.map((x) => (x.id === projectId ? updated : x)));
  }, []);

  const toastValue = useMemo(() => ({ push }), [push]);
  const authValue = useMemo(() => ({ user, login, register, logout }), [user, login, register, logout]);
  const projectsValue = useMemo(
    () => ({
      projects,
      loading,
      error,
      refresh,
      getProject: (id: string) => projects.find((p) => p.id === id),
      setProject,
      updateTaskStatus,
    }),
    [projects, loading, error, refresh, setProject, updateTaskStatus],
  );

  return (
    <ToastContext.Provider value={toastValue}>
      <AuthContext.Provider value={authValue}>
        <ProjectsContext.Provider value={projectsValue}>
          {children}
          <ToastHost toasts={toasts} dismiss={dismiss} />
        </ProjectsContext.Provider>
      </AuthContext.Provider>
    </ToastContext.Provider>
  );
}
