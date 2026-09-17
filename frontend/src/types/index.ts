/** Shared domain types for the frontend. Mirrors the FastAPI backend contract (camelCase). */

export type Role = "student" | "faculty";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export type ProjectStatus = "planning" | "active" | "completed" | "delayed";
export type RiskLevel = "low" | "medium" | "high";
export type TaskStatus = "done" | "in-progress" | "pending" | "delayed";
export type Severity = "Low" | "Medium" | "High";

/** Payload sent to `POST /api/projects` — everything the agents need to plan. */
export interface ProjectInput {
  title: string;
  idea: string;
  problemStatement: string;
  domain: string;
  technologies: string;
  teamSize: number;
  durationWeeks: number;
  level: string;
  notes?: string;
}

/* ---------------- Blueprint (agent output) ---------------- */

export interface IdeaEvaluation {
  scores: { feasibility: number; innovation: number; academicSuitability: number };
  difficulty: "Low" | "Moderate" | "High";
  estimatedDuration: string;
  verdict: "Strong Go" | "Go" | "Go with caution" | "Revise";
  recommendation: string;
  strengths: string[];
  concerns: string[];
}

export interface ScopeDefinition {
  objectives: string[];
  deliverables: string[];
  features: string[];
  functional: string[];
  nonFunctional: string[];
  outOfScope: string[];
}

export interface TechPick {
  layer: "Frontend" | "Backend" | "AI / ML" | "Database" | "Deployment" | "Libraries & Frameworks";
  pick: string;
  rationale: string;
  alternative: string;
}

export interface ArchLayer {
  name: string;
  components: string[];
}

export interface Architecture {
  layers: ArchLayer[];
  dataFlow: string[];
}

export interface WeekPlan {
  week: number;
  phase: string;
  milestone: string;
  tasks: string[];
}

export interface RiskItem {
  id: string;
  risk: string;
  category: string;
  severity: Severity;
  probability: Severity;
  mitigation: string;
}

export interface Blueprint {
  evaluation: IdeaEvaluation;
  scope: ScopeDefinition;
  technology: TechPick[];
  architecture: Architecture;
  timeline: WeekPlan[];
  risks: RiskItem[];
  generatedAt: string;
}

/* ---------------- Execution (tracked in-project) ---------------- */

export interface Task {
  id: string;
  title: string;
  week: number;
  milestoneId: string;
  status: TaskStatus;
}

export interface Milestone {
  id: string;
  title: string;
  weeks: [number, number];
}

export interface ActivityItem {
  id: string;
  text: string;
  ts: string;
  kind: "ai" | "user" | "system";
}

export interface Project {
  id: string;
  title: string;
  domain: string;
  level: string;
  studentName: string;
  studentId: string;
  teamSize: number;
  durationWeeks: number;
  currentWeek: number;
  progress: number;
  phase: string;
  status: ProjectStatus;
  riskLevel: RiskLevel;
  nextTask: string;
  createdAt: string;
  lastUpdate: string;
  input: ProjectInput;
  blueprint: Blueprint;
  milestones: Milestone[];
  tasks: Task[];
  activity: ActivityItem[];
}

/* ---------------- Mentor chat & documents ---------------- */

export interface ChatMessage {
  id: string;
  role: "user" | "mentor";
  content: string;
  ts: string;
  agent?: string;
}

export type DocType =
  | "synopsis"
  | "abstract"
  | "literature-review"
  | "objectives"
  | "problem-statement"
  | "architecture"
  | "uml"
  | "flowchart"
  | "report"
  | "ppt"
  | "user-manual";

export interface DocArtifact {
  id: string;
  type: DocType;
  title: string;
  content: string;
  diagram?: "flowchart" | "uml";
  generatedAt: string;
}

/* ---------------- Progress summary (GET /projects/:id/progress) ---------------- */

export interface ProgressSummary {
  progress: number;
  planned: number;
  week: number;
  durationWeeks: number;
  phase: string;
  nextTask: string;
  counts: { done: number; inProgress: number; pending: number; delayed: number };
  milestones: { id: string; title: string; weeks: [number, number]; progress: number }[];
  weeks: { week: number; done: number; open: number; delayed: number }[];
  tasks: { id: string; status: TaskStatus }[];
  recommendations: string[];
}

/* ---------------- Faculty feedback / guidance ---------------- */

export type FeedbackType = "message" | "feedback" | "recommendation" | "task_suggestion";

export interface FacultyFeedback {
  id: string;
  projectId: string;
  facultyId: string;
  facultyName: string;
  type: FeedbackType;
  content: string;
  relatedTaskId?: string;
  createdAt: string;
}
