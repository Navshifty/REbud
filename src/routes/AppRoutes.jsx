import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import Workspace from "../workspace/Workspace";
import NotFoundPage from "../pages/NotFoundPage";

/*
  Route table.

  Paths are real URLs, so the workspace is linkable and the browser's
  back button works. /workspace/:projectId deep-links a single project.

  Two guards:
  - RequireAuth sends a signed-out visitor to /login and remembers where
    they were headed, so they land there after signing in.
  - RedirectIfAuthed keeps a signed-in user off the login and signup
    pages, since they have nothing to do there.
*/

function RequireAuth({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RedirectIfAuthed({ user, children }) {
  if (user) return <Navigate to="/workspace" replace />;
  return children;
}

/* Bridges the router to Workspace, which takes a projectId and a `go` callback. */
function WorkspaceRoute({ user, onSignOut }) {
  const navigate = useNavigate();
  const { projectId } = useParams();
  return (
    <Workspace
      user={user}
      onSignOut={onSignOut}
      routeProjectId={projectId ?? null}
      onProjectChange={(id) => navigate(`/workspace/${id}`, { replace: true })}
      go={(view) => navigate(view === "landing" ? "/" : `/${view}`)}
    />
  );
}

export default function AppRoutes({ user, onAuthenticated, onSignOut }) {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route
        path="/login"
        element={
          <RedirectIfAuthed user={user}>
            <LoginPage onAuthenticated={onAuthenticated} />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/signup"
        element={
          <RedirectIfAuthed user={user}>
            <SignupPage onAuthenticated={onAuthenticated} />
          </RedirectIfAuthed>
        }
      />

      <Route
        path="/workspace"
        element={
          <RequireAuth user={user}>
            <WorkspaceRoute user={user} onSignOut={onSignOut} />
          </RequireAuth>
        }
      />
      <Route
        path="/workspace/:projectId"
        element={
          <RequireAuth user={user}>
            <WorkspaceRoute user={user} onSignOut={onSignOut} />
          </RequireAuth>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
