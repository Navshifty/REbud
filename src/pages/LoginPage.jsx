import { useState } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import AuthShell from "../components/AuthShell";
import Button from "../components/Button";
import Field from "../components/Field";
import TextInput from "../components/TextInput";
import GoogleButton from "../components/GoogleButton";
import Divider from "../components/Divider";
import { T, serif, sans } from "../styles/tokens";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Mock credential accepted by the prototype until real auth exists. */
const DEMO_PASSWORD = "correcthorse";

export default function LoginPage({ go }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | error | success
  const [errors, setErrors] = useState({});

  function submit(e) {
    e.preventDefault();
    const next = {};
    if (!email) next.email = "Email is required.";
    else if (!EMAIL_RE.test(email)) next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    setErrors(next);
    if (Object.keys(next).length) return;

    // Simulated request — replaced by the auth API in Phase 3.
    setStatus("loading");
    setTimeout(() => {
      if (password !== DEMO_PASSWORD) {
        setStatus("error");
        setErrors({ password: "Incorrect email or password." });
      } else {
        setStatus("success");
        setTimeout(() => go("workspace"), 700);
      }
    }, 1000);
  }

  return (
    <AuthShell>
      <h1 className="text-[20px] mb-1" style={{ ...serif, color: T.black }}>Log in</h1>
      <p className="text-[13px] mb-7" style={{ ...sans, color: T.black, opacity: 0.6 }}>
        Continue your research investigations.
      </p>

      {status === "success" ? (
        <div className="flex items-center gap-2 py-6 justify-center" role="status">
          <CheckCircle2 size={18} style={{ color: T.ok }} aria-hidden="true" />
          <span className="text-[13.5px]" style={{ ...sans, color: T.black }}>Signed in — opening your workspace…</span>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <Field label="Email" error={errors.email}>
            <TextInput
              type="email" autoComplete="email" value={email} error={errors.email} placeholder="you@university.edu"
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Password" error={errors.password}>
            <div className="relative">
              <TextInput
                type={showPw ? "text" : "password"} autoComplete="current-password" value={password} error={errors.password}
                placeholder="Try: correcthorse" onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPw
                  ? <EyeOff size={16} style={{ color: T.black, opacity: 0.5 }} />
                  : <Eye size={16} style={{ color: T.black, opacity: 0.5 }} />}
              </button>
            </div>
          </Field>
          <div className="flex justify-end mb-5">
            <button type="button" className="text-[12.5px]" style={{ ...sans, color: T.inkSoft }}>Forgot password?</button>
          </div>
          <Button type="submit" className="w-full" disabled={status === "loading"}>
            {status === "loading" ? <><Loader2 size={15} className="animate-spin" /> Logging in…</> : "Log in"}
          </Button>
          <Divider />
          <GoogleButton onClick={() => go("workspace")} />
        </form>
      )}

      <p className="text-center text-[13px] mt-7" style={{ ...sans, color: T.black, opacity: 0.7 }}>
        Don't have an account?{" "}
        <button type="button" className="cursor-pointer" style={{ color: T.ink }} onClick={() => go("signup")}>Create one</button>
      </p>
    </AuthShell>
  );
}
