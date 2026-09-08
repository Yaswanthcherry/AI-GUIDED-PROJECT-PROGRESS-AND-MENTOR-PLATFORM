import { useEffect } from "react";
import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { StoreProvider, useAuth } from "./context/StoreContext";
import type { Role } from "./types";

import PublicLayout from "./layouts/PublicLayout";
import AppLayout from "./layouts/AppLayout";
import Landing from "./pages/Landing";
import About from "./pages/About";
import { LoginPage, RegisterPage } from "./pages/Auth";
import Dashboard from "./pages/student/Dashboard";
import CreateProject from "./pages/student/CreateProject";
import ProjectOverview from "./pages/student/ProjectOverview";
import BlueprintPage from "./pages/student/Blueprint";
import DocumentationPage from "./pages/student/Documentation";
import ProgressPage from "./pages/student/Progress";
import MentorPage from "./pages/student/Mentor";
import FacultyDashboard, { FacultyProjectsPage } from "./pages/faculty/FacultyDashboard";
import FacultyProject from "./pages/faculty/FacultyProject";

/** Route guard — enforces authentication and role-based navigation. */
function Protected({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={user.role === "faculty" ? "/faculty" : "/app"} replace />;
  return <>{children}</>;
}

/** Logged-in users bouncing off auth pages go straight to their workspace. */
function GuestOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user) return <Navigate to={user.role === "faculty" ? "/faculty" : "/app"} replace />;
  return <>{children}</>;
}

/** Scroll restoration + in-page hash anchors (landing sections). */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
        return;
      }
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <ScrollManager />
        <Routes>
          {/* ---------- public ---------- */}
          <Route element={<PublicLayout />}>
            <Route index element={<Landing />} />
            <Route path="/about" element={<About />} />
            <Route
              path="/login"
              element={
                <GuestOnly>
                  <LoginPage />
                </GuestOnly>
              }
            />
            <Route
              path="/register"
              element={
                <GuestOnly>
                  <RegisterPage />
                </GuestOnly>
              }
            />
          </Route>

          {/* ---------- student ---------- */}
          <Route
            path="/app"
            element={
              <Protected role="student">
                <AppLayout />
              </Protected>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="projects/new" element={<CreateProject />} />
            <Route path="projects/:id" element={<ProjectOverview />} />
            <Route path="projects/:id/blueprint" element={<BlueprintPage section="evaluation" />} />
            <Route path="projects/:id/blueprint/scope" element={<BlueprintPage section="scope" />} />
            <Route path="projects/:id/blueprint/technology" element={<BlueprintPage section="technology" />} />
            <Route path="projects/:id/blueprint/architecture" element={<BlueprintPage section="architecture" />} />
            <Route path="projects/:id/blueprint/timeline" element={<BlueprintPage section="timeline" />} />
            <Route path="projects/:id/blueprint/risks" element={<BlueprintPage section="risks" />} />
            <Route path="projects/:id/docs" element={<DocumentationPage />} />
            <Route path="projects/:id/progress" element={<ProgressPage />} />
            <Route path="projects/:id/mentor" element={<MentorPage />} />
          </Route>

          {/* ---------- faculty ---------- */}
          <Route
            path="/faculty"
            element={
              <Protected role="faculty">
                <AppLayout />
              </Protected>
            }
          >
            <Route index element={<FacultyDashboard />} />
            <Route path="projects" element={<FacultyProjectsPage />} />
            <Route path="projects/:id" element={<FacultyProject />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}
