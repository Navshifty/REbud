import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AppRoutes from "./routes/AppRoutes";
import * as authService from "./services/authService";
import { UNAUTHORIZED_EVENT } from "./services/apiClient";
import { T, sans } from "./styles/tokens";

/*
  Session handling. Routing itself lives in routes/AppRoutes.

  - On load, restore the session from the stored token.
  - If the API rejects that token mid-session, drop it and return to login.
  - Signing in or out navigates, so the URL always reflects the state.
*/
function AppShell() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    let cancelled = false;
    authService.me()
      .then((u) => { if (!cancelled && u) setUser(u); })
      .catch(() => { /* treat as signed out */ })
      .finally(() => { if (!cancelled) setRestoring(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function onUnauthorized() {
      setUser(null);
      navigate("/login", { replace: true });
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [navigate]);

  const onAuthenticated = useCallback((session) => {
    setUser(session.user);
    navigate("/workspace", { replace: true });
  }, [navigate]);

  const onSignOut = useCallback(() => {
    authService.logout();
    setUser(null);
    navigate("/", { replace: true });
  }, [navigate]);

  if (restoring) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2" style={{ background: T.cream, ...sans, color: T.black }}>
        <Loader2 size={16} className="animate-spin" style={{ color: T.inkSoft }} aria-hidden="true" />
        <span className="text-[13px]" style={{ opacity: 0.6 }}>Opening REbud…</span>
      </div>
    );
  }

  return <AppRoutes user={user} onAuthenticated={onAuthenticated} onSignOut={onSignOut} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
