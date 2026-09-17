import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Workspace from "./workspace/Workspace";
import * as authService from "./services/authService";
import { UNAUTHORIZED_EVENT } from "./services/apiClient";
import { T, sans } from "./styles/tokens";

/*
  Top-level view switcher plus session handling.
  - On load, restore the session from the stored token.
  - Public views: landing → login/signup. Authenticated: workspace.
  - If the API rejects the token, drop the session and return to login.
*/
export default function App() {
  const [view, setView] = useState("landing");
  const [user, setUser] = useState(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    let cancelled = false;
    authService.me()
      .then((u) => {
        if (cancelled) return;
        if (u) { setUser(u); setView("workspace"); }
      })
      .catch(() => { /* treat as signed out */ })
      .finally(() => { if (!cancelled) setRestoring(false); });
    return () => { cancelled = true; };
  }, []);

  const signOut = useCallback(() => {
    authService.logout();
    setUser(null);
    setView("landing");
  }, []);

  useEffect(() => {
    function onUnauthorized() {
      setUser(null);
      setView("login");
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  function onAuthenticated(session) {
    setUser(session.user);
    setView("workspace");
  }

  function go(next) {
    // The workspace requires a session; everything else is public.
    if (next === "workspace" && !user) return setView("login");
    setView(next);
  }

  if (restoring) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2" style={{ background: T.cream, ...sans, color: T.black }}>
        <Loader2 size={16} className="animate-spin" style={{ color: T.inkSoft }} aria-hidden="true" />
        <span className="text-[13px]" style={{ opacity: 0.6 }}>Opening REbud…</span>
      </div>
    );
  }

  if (view === "workspace" && user) return <Workspace go={go} user={user} onSignOut={signOut} />;
  if (view === "login") return <LoginPage go={go} onAuthenticated={onAuthenticated} />;
  if (view === "signup") return <SignupPage go={go} onAuthenticated={onAuthenticated} />;
  return <LandingPage go={go} />;
}
