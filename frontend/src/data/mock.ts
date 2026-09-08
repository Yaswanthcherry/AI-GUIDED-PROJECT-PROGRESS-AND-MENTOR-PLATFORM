/**
 * Seed data for mock mode only (empty VITE_API_BASE_URL).
 * When the FastAPI backend is connected, none of this is used —
 * projects come from PostgreSQL via GET /api/projects.
 */
import type { Project, User } from "../types";
import { materializeProject } from "../services/generators";

export const AGENT_STAGES = [
  "Idea Evaluation Agent",
  "Scope Agent",
  "Technology Agent",
  "Timeline Agent",
  "Risk Agent",
  "Blueprint Assembly",
];

export const DEMO_STUDENT: User = {
  id: "student-001",
  name: "Aarav Mehta",
  email: "student@campus.edu",
  role: "student",
};

export const DEMO_FACULTY: User = {
  id: "faculty-001",
  name: "Dr. Nandini Rao",
  email: "faculty@campus.edu",
  role: "faculty",
};

const STUDENTS: { id: string; name: string }[] = [
  { id: "student-001", name: "Aarav Mehta" },
  { id: "student-002", name: "Sara Iqbal" },
  { id: "student-003", name: "Devansh Kulkarni" },
  { id: "student-004", name: "Meera Pillai" },
  { id: "student-005", name: "Rohan Das" },
];

const SEEDS: Array<{
  student: number;
  currentWeek: number;
  status?: Project["status"];
  riskLevel?: Project["riskLevel"];
  completed?: boolean;
  delayed?: string[];
  input: {
    title: string;
    idea: string;
    problemStatement: string;
    domain: string;
    technologies: string;
    teamSize: number;
    durationWeeks: number;
    level: string;
    notes?: string;
  };
}> = [
  {
    student: 0,
    currentWeek: 9,
    status: "active",
    riskLevel: "medium",
    delayed: ["Implement: Analytics on question categories and deflection rate"],
    input: {
      title: "AI Customer Support Chatbot",
      idea: "A retrieval-augmented chatbot that answers campus support questions from an institutional knowledge base, with confidence scoring and human handoff.",
      problemStatement: "Support staff answer the same questions repeatedly while students wait hours; existing keyword bots fail on paraphrased queries.",
      domain: "AI / Machine Learning",
      technologies: "Python, FastAPI, React",
      teamSize: 3,
      durationWeeks: 14,
      level: "Undergraduate — Final Year",
    },
  },
  {
    student: 0,
    currentWeek: 1,
    status: "planning",
    input: {
      title: "Campus Attendance Analytics Dashboard",
      idea: "A web dashboard that ingests attendance CSV exports, validates them, and surfaces trends, anomalies and forecasts for academic coordinators.",
      problemStatement: "Coordinators review attendance in spreadsheets; patterns and at-risk students are spotted weeks too late.",
      domain: "Data Science & Analytics",
      technologies: "Python, pandas",
      teamSize: 2,
      durationWeeks: 10,
      level: "Undergraduate — Second Year",
    },
  },
  {
    student: 1,
    currentWeek: 6,
    status: "active",
    riskLevel: "high",
    delayed: ["Elicit functional requirements"],
    input: {
      title: "Smart Classroom Energy Monitor",
      idea: "ESP32 sensor nodes measure power draw per classroom and publish MQTT telemetry to a Grafana dashboard with threshold alerts.",
      problemStatement: "The facilities team has no visibility into per-room energy use, so waste goes unnoticed until the monthly bill.",
      domain: "IoT & Embedded",
      technologies: "C++, MQTT",
      teamSize: 4,
      durationWeeks: 12,
      level: "Undergraduate — Final Year",
    },
  },
  {
    student: 2,
    currentWeek: 12,
    completed: true,
    input: {
      title: "Alumni Mentorship Portal",
      idea: "A role-based web portal matching students with alumni mentors, with scheduling, session notes and programme dashboards.",
      problemStatement: "Mentor matching is run over email; the placement cell cannot track sessions or outcomes.",
      domain: "Web Development",
      technologies: "React, Node.js",
      teamSize: 3,
      durationWeeks: 12,
      level: "Undergraduate — Final Year",
    },
  },
  {
    student: 3,
    currentWeek: 5,
    status: "delayed",
    riskLevel: "medium",
    delayed: ["Define database schema / data contracts"],
    input: {
      title: "Phishing Detection Browser Extension",
      idea: "A browser extension that scores page features with a lightweight ML model and warns users before they enter credentials.",
      problemStatement: "Students fall for phishing pages that pass URL blacklists; warnings must appear before data is entered.",
      domain: "Cybersecurity",
      technologies: "JavaScript, scikit-learn",
      teamSize: 2,
      durationWeeks: 12,
      level: "Postgraduate",
    },
  },
  {
    student: 4,
    currentWeek: 3,
    status: "active",
    riskLevel: "low",
    input: {
      title: "Lab Equipment Booking System",
      idea: "A booking system for department labs with conflict-free scheduling, approvals and usage reports for technicians.",
      problemStatement: "Equipment clashes are resolved by phone calls; utilisation data does not exist for procurement decisions.",
      domain: "Web Development",
      technologies: "React, Express, PostgreSQL",
      teamSize: 2,
      durationWeeks: 10,
      level: "Undergraduate — Second Year",
    },
  },
];

export function seedAllProjects(): Project[] {
  return SEEDS.map((s) =>
    materializeProject(s.input, STUDENTS[s.student], {
      currentWeek: s.currentWeek,
      status: s.status,
      riskLevel: s.riskLevel,
      completed: s.completed,
      delayedTaskTitles: s.delayed,
      createdDaysAgo: Math.max(2, (s.currentWeek - 1) * 7 + 3),
    }),
  );
}
