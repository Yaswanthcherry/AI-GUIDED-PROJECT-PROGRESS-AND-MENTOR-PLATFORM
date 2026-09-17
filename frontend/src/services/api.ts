/**
 * AI-Guided Project Progress Tracking Platform — service layer.
 * The single place the UI talks to the backend.
 * ------------------------------------------------------------------
 * REAL ENDPOINT CONTRACT:
 *
 * The frontend API base URL is normally:
 *
 *   /api
 *
 * Therefore, paths passed to http() must NOT include /api.
 *
 * Example:
 *
 *   http("/auth/register")
 *   → /api/auth/register
 *
 *   http("/projects?scope=mine")
 *   → /api/projects?scope=mine
 *
 * REAL ENDPOINT CONTRACT:
 *
 *   POST  /api/auth/register
 *   POST  /api/auth/login
 *   GET   /api/auth/me
 *
 *   POST  /api/projects
 *   GET   /api/projects?scope=mine|all
 *   GET   /api/projects/:id
 *   POST  /api/projects/:id/blueprint/generate
 *   GET   /api/projects/:id/blueprint
 *   PATCH /api/projects/:id/tasks/:taskId
 *
 *   GET   /api/projects/:id/mentor/messages
 *   POST  /api/projects/:id/mentor/messages
 *
 *   GET   /api/projects/:id/docs
 *   POST  /api/projects/:id/docs
 *
 *   GET   /api/projects/:id/progress
 *   POST  /api/projects/:id/progress
 *
 *   GET   /api/faculty/dashboard
 *   GET   /api/faculty/insights/:projectId
 *
 * MOCK MODE:
 * When VITE_API_BASE_URL is empty, the local mock implementation is used.
 */

import type {
  ChatMessage,
  DocArtifact,
  DocType,
  ProgressSummary,
  Project,
  ProjectInput,
  Role,
  TaskStatus,
  User,
} from "../types";

import {
  AGENT_STAGES,
  DEMO_FACULTY,
  DEMO_STUDENT,
  seedAllProjects,
} from "../data/mock";

import {
  aiRecommendations,
  composeBlueprint,
  composeDoc,
  composeInsights,
  materializeProject,
  mentorReply,
  recomputeProject,
  welcomeMessage,
} from "./generators";

import { uid } from "../utils";

/* ---------------- configuration ---------------- */

export const API_BASE: string = (
  import.meta.env.VITE_API_BASE_URL ?? "/api"
).trim().replace(/\/+$/, "");

export const MOCK_MODE: boolean = API_BASE.length === 0;

export const TOKEN_KEY = "aapm.session.v1.token";
export const UNAUTHORIZED_EVENT = "aapm:unauthorized";

/* ---------------- local persistence ---------------- */

const K = {
  projects: "aapm.projects.v1",
  session: "aapm.session.v1",
  users: "aapm.users.v1",
  chat: (pid: string) => `aapm.chat.v1.${pid}`,
  docs: (pid: string) => `aapm.docs.v1.${pid}`,
  feedback: (pid: string) => `aapm.feedback.v1.${pid}`,
};

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Storage full or blocked — mock mode degrades to in-memory. */
  }
}

function loadProjects(): Project[] {
  const existing = read<Project[]>(K.projects);

  if (existing && existing.length) {
    return existing;
  }

  const seeded = seedAllProjects();
  write(K.projects, seeded);
  return seeded;
}

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const jitter = (base: number) =>
  base + Math.random() * base * 0.5;

interface StoredUser extends User {
  password: string;
}

function loadUsers(): StoredUser[] {
  const extra = read<StoredUser[]>(K.users) ?? [];

  return [
    { ...DEMO_STUDENT, password: "demo1234" },
    { ...DEMO_FACULTY, password: "demo1234" },
    ...extra,
  ];
}

/* ---------------- real HTTP helper ---------------- */

/**
 * API_BASE is normally "/api".
 *
 * Correct:
 *   http("/auth/register")
 *   → /api/auth/register
 *
 * Incorrect:
 *   http("/api/auth/register")
 *   → /api/api/auth/register
 */
async function http<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);

  let normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  // Prevent duplicate URLs such as /api/api/projects.
  if (API_BASE === "/api" && normalizedPath.startsWith("/api/")) {
    normalizedPath = normalizedPath.slice(4);
  }

  const res = await fetch(`${API_BASE}${normalizedPath}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      window.dispatchEvent(
        new CustomEvent(UNAUTHORIZED_EVENT),
      );
    }

    let message = `Request failed (${res.status})`;

    try {
      const body = (await res.json()) as {
        detail?: unknown;
      };

      if (
        typeof body.detail === "string" &&
        body.detail
      ) {
        message = body.detail;
      } else if (body.detail) {
        message = JSON.stringify(body.detail);
      }
    } catch {
      /* Non-JSON error body. */
    }

    throw new Error(message);
  }

  return (await res.json()) as T;
}

/* ---------------- public service surface ---------------- */

export const api = {
  auth: {
    /** POST /api/auth/login */
    async login(
      email: string,
      password: string,
    ): Promise<User> {
      if (!MOCK_MODE) {
        const r = await http<{
          user: User;
          token: string;
        }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
          }),
        });

        localStorage.setItem(TOKEN_KEY, r.token);
        return r.user;
      }

      await delay(jitter(600));

      const user = loadUsers().find(
        (u) =>
          u.email.toLowerCase() ===
          email.trim().toLowerCase(),
      );

      if (!user || user.password !== password) {
        throw new Error(
          "Invalid email or password. Try the demo credentials below.",
        );
      }

      const { password: _pw, ...pub } = user;
      return pub;
    },

    /** POST /api/auth/register */
    async register(payload: {
      name: string;
      email: string;
      password: string;
      role: Role;
      level?: string;
    }): Promise<User> {
      if (!MOCK_MODE) {
        const r = await http<{
          user: User;
          token: string;
        }>("/auth/register", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        localStorage.setItem(TOKEN_KEY, r.token);
        return r.user;
      }

      await delay(jitter(700));

      const users = loadUsers();

      if (
        users.some(
          (u) =>
            u.email.toLowerCase() ===
            payload.email.trim().toLowerCase(),
        )
      ) {
        throw new Error(
          "An account with this email already exists. Try logging in.",
        );
      }

      const user: StoredUser = {
        id: uid(),
        name: payload.name.trim(),
        email: payload.email.trim().toLowerCase(),
        role: payload.role,
        password: payload.password,
      };

      const extra = (
        read<StoredUser[]>(K.users) ?? []
      ).concat(user);

      write(K.users, extra);

      const { password: _pw, ...pub } = user;
      return pub;
    },
  },

  projects: {
    /** GET /api/projects?scope=mine|all */
    async list(user: User): Promise<Project[]> {
      if (!MOCK_MODE) {
        return http<Project[]>(
          `/projects?scope=${
            user.role === "faculty" ? "all" : "mine"
          }`,
        );
      }

      await delay(jitter(650));

      const all = loadProjects();

      return user.role === "faculty"
        ? all
        : all.filter((p) => p.studentId === user.id);
    },

    /** GET /api/projects/:id */
    async get(
      id: string,
    ): Promise<Project | undefined> {
      if (!MOCK_MODE) {
        return http<Project>(`/projects/${id}`);
      }

      await delay(jitter(250));

      return loadProjects().find(
        (p) => p.id === id,
      );
    },

    /**
     * POST /api/projects
     * Orchestrates the agent pipeline.
     */
    async create(
      input: ProjectInput,
      student: User,
      onStage?: (stageIndex: number) => void,
    ): Promise<Project> {
      if (!MOCK_MODE) {
        const ticker = window.setInterval(() => {
          onStage?.(
            Math.floor(
              Math.random() * AGENT_STAGES.length,
            ),
          );
        }, 900);

        try {
          return await http<Project>("/projects", {
            method: "POST",
            body: JSON.stringify(input),
          });
        } finally {
          window.clearInterval(ticker);
        }
      }

      for (
        let i = 0;
        i < AGENT_STAGES.length;
        i++
      ) {
        await delay(jitter(620));
        onStage?.(i);
      }

      await delay(400);

      const project = materializeProject(
        input,
        {
          id: student.id,
          name: student.name,
        },
        {
          currentWeek: 1,
          createdDaysAgo: 0,
        },
      );

      project.activity.unshift(
        {
          id: uid(),
          text: "Project blueprint generated by 6 agents",
          ts: new Date().toISOString(),
          kind: "ai",
        },
        {
          id: uid(),
          text: "Project created",
          ts: new Date().toISOString(),
          kind: "system",
        },
      );

      const all = loadProjects();
      all.unshift(project);
      write(K.projects, all);

      return project;
    },

    /** POST /api/projects/:id/blueprint/generate */
    async regenerateBlueprint(
      id: string,
    ): Promise<Project> {
      if (!MOCK_MODE) {
        return http<Project>(
          `/projects/${id}/blueprint/generate`,
          {
            method: "POST",
          },
        );
      }

      await delay(jitter(1400));

      const all = loadProjects();
      const idx = all.findIndex(
        (p) => p.id === id,
      );

      if (idx < 0) {
        throw new Error("Project not found");
      }

      all[idx] = {
        ...all[idx],
        blueprint: composeBlueprint(
          all[idx].input,
        ),
        lastUpdate: new Date().toISOString(),
      };

      all[idx].activity.unshift({
        id: uid(),
        text: "Blueprint regenerated — agent scores refreshed",
        ts: new Date().toISOString(),
        kind: "ai",
      });

      write(K.projects, all);
      return all[idx];
    },

    /** PATCH /api/projects/:id/tasks/:taskId */
    async updateTask(
      projectId: string,
      taskId: string,
      status: TaskStatus,
    ): Promise<Project> {
      if (!MOCK_MODE) {
        return http<Project>(
          `/projects/${projectId}/tasks/${taskId}`,
          {
            method: "PATCH",
            body: JSON.stringify({ status }),
          },
        );
      }

      await delay(jitter(220));

      const all = loadProjects();
      const idx = all.findIndex(
        (p) => p.id === projectId,
      );

      if (idx < 0) {
        throw new Error("Project not found");
      }

      const task = all[idx].tasks.find(
        (t) => t.id === taskId,
      );

      if (!task) {
        throw new Error("Task not found");
      }

      const from = task.status;
      task.status = status;
      all[idx] = recomputeProject(all[idx]);

      all[idx].activity.unshift({
        id: uid(),
        text:
          status === "done"
            ? `Task completed: ${task.title}`
            : `Task moved ${from} → ${status}: ${task.title}`,
        ts: new Date().toISOString(),
        kind: "user",
      });

      write(K.projects, all);
      return all[idx];
    },
  },

  mentor: {
    /** GET /api/projects/:id/mentor/messages */
    async history(
      projectId: string,
    ): Promise<ChatMessage[]> {
      if (!MOCK_MODE) {
        return http<ChatMessage[]>(
          `/projects/${projectId}/mentor/messages`,
        );
      }

      await delay(jitter(350));

      const stored = read<ChatMessage[]>(
        K.chat(projectId),
      );

      if (stored && stored.length) {
        return stored;
      }

      const p = loadProjects().find(
        (x) => x.id === projectId,
      );

      return p ? [welcomeMessage(p)] : [];
    },

    /** POST /api/projects/:id/mentor/messages */
    async send(
      projectId: string,
      content: string,
    ): Promise<ChatMessage> {
      if (!MOCK_MODE) {
        return http<ChatMessage>(
          `/projects/${projectId}/mentor/messages`,
          {
            method: "POST",
            body: JSON.stringify({ content }),
          },
        );
      }

      await delay(jitter(1100));

      const p = loadProjects().find(
        (x) => x.id === projectId,
      );

      if (!p) {
        throw new Error("Project not found");
      }

      const reply = mentorReply(p, content);

      const msg: ChatMessage = {
        id: uid(),
        role: "mentor",
        content: reply.content,
        agent: reply.agent,
        ts: new Date().toISOString(),
      };

      const hist =
        read<ChatMessage[]>(
          K.chat(projectId),
        ) ?? [welcomeMessage(p)];

      hist.push(msg);
      write(K.chat(projectId), hist);

      return msg;
    },
  },

  docs: {
    /** GET /api/projects/:id/docs */
    async list(
      projectId: string,
    ): Promise<DocArtifact[]> {
      if (!MOCK_MODE) {
        return http<DocArtifact[]>(
          `/projects/${projectId}/docs`,
        );
      }

      await delay(jitter(300));

      return (
        read<DocArtifact[]>(
          K.docs(projectId),
        ) ?? []
      );
    },

    /** POST /api/projects/:id/docs */
    async generate(
      projectId: string,
      type: DocType,
    ): Promise<DocArtifact> {
      if (!MOCK_MODE) {
        return http<DocArtifact>(
          `/projects/${projectId}/docs`,
          {
            method: "POST",
            body: JSON.stringify({ type }),
          },
        );
      }

      await delay(jitter(1300));

      const p = loadProjects().find(
        (x) => x.id === projectId,
      );

      if (!p) {
        throw new Error("Project not found");
      }

      const doc = composeDoc(p, type);

      const docs =
        read<DocArtifact[]>(
          K.docs(projectId),
        ) ?? [];

      const next = docs
        .filter((d) => d.type !== type)
        .concat(doc);

      write(K.docs(projectId), next);

      const all = loadProjects();
      const idx = all.findIndex(
        (x) => x.id === projectId,
      );

      if (idx >= 0) {
        all[idx].activity.unshift({
          id: uid(),
          text: `Doc Drafter generated: ${doc.title}`,
          ts: new Date().toISOString(),
          kind: "ai",
        });

        write(K.projects, all);
      }

      return doc;
    },
  },

  progress: {
    /** GET /api/projects/:id/progress */
    async summary(
      projectId: string,
    ): Promise<ProgressSummary> {
      if (!MOCK_MODE) {
        return http<ProgressSummary>(
          `/projects/${projectId}/progress`,
        );
      }

      await delay(jitter(400));

      const p = loadProjects().find(
        (x) => x.id === projectId,
      );

      if (!p) {
        throw new Error("Project not found");
      }

      return {
        progress: p.progress,
        planned: Math.round(
          (p.currentWeek /
            Math.max(p.durationWeeks, 1)) *
            100,
        ),
        week: p.currentWeek,
        durationWeeks: p.durationWeeks,
        phase: p.phase,
        nextTask: p.nextTask,
        counts: {
          done: p.tasks.filter(
            (t) => t.status === "done",
          ).length,
          inProgress: p.tasks.filter(
            (t) => t.status === "in-progress",
          ).length,
          pending: p.tasks.filter(
            (t) => t.status === "pending",
          ).length,
          delayed: p.tasks.filter(
            (t) => t.status === "delayed",
          ).length,
        },
        milestones: [],
        weeks: [],
        tasks: p.tasks.map((t) => ({
          id: t.id,
          status: t.status,
        })),
        recommendations: aiRecommendations(p),
      };
    },
  },

  insights: {
    /** GET /api/faculty/insights/:projectId */
    async for(
      projectId: string,
    ): Promise<string[]> {
      if (!MOCK_MODE) {
        return http<{ insights: string[] }>(
          `/faculty/insights/${projectId}`,
        ).then((r) => r.insights);
      }

      await delay(jitter(900));

      const p = loadProjects().find(
        (x) => x.id === projectId,
      );

      return p ? composeInsights(p) : [];
    },
  },

  faculty: {
    /** GET /api/faculty/:projectId/feedback */
    async listFeedback(
      projectId: string,
    ): Promise<FacultyFeedback[]> {
      if (!MOCK_MODE) {
        return http<{ feedback: FacultyFeedback[] }>(
          `/faculty/${projectId}/feedback`,
        ).then((r) => r.feedback);
      }

      await delay(jitter(300));

      const stored = read<FacultyFeedback[]>(
        K.feedback(projectId),
      );

      return stored ?? [];
    },

    /** POST /api/faculty/:projectId/feedback */
    async sendFeedback(
      projectId: string,
      feedback: FacultyFeedbackInput,
    ): Promise<FacultyFeedback> {
      if (!MOCK_MODE) {
        return http<FacultyFeedback>(
          `/faculty/${projectId}/feedback`,
          {
            method: "POST",
            body: JSON.stringify(feedback),
          },
        );
      }

      await delay(jitter(400));

      const f: FacultyFeedback = {
        id: uid(),
        projectId,
        facultyId: "faculty-1",
        facultyName: "Demo Faculty",
        type: feedback.type,
        content: feedback.content,
        relatedTaskId: feedback.relatedTaskId,
        createdAt: new Date().toISOString(),
      };

      const stored = (
        read<FacultyFeedback[]>(
          K.feedback(projectId),
        ) ?? []
      ).concat(f);

      write(K.feedback(projectId), stored);

      return f;
    },
  },
};

export interface FacultyFeedbackInput {
  type: "message" | "feedback" | "recommendation" | "task_suggestion";
  content: string;
  relatedTaskId?: string;
}

export interface FacultyFeedback {
  id: string;
  projectId: string;
  facultyId: string;
  facultyName: string;
  type: string;
  content: string;
  relatedTaskId?: string;
  createdAt: string;
}