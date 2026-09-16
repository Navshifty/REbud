import { useMemo, useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import AuthShell from "../components/AuthShell";
import Button from "../components/Button";
import Divider from "../components/Divider";
import Field from "../components/Field";
import TextInput from "../components/TextInput";
import GoogleButton from "../components/GoogleButton";
import { T, serif, sans } from "../styles/tokens";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ReqRow({ met, label }) {
  return (
    <div className="flex items-center gap-2">
      {met
        ? <Check size={13} style={{ color: T.ok }} aria-hidden="true" />
        : <X size={13} style={{ color: T.black, opacity: 0.35 }} aria-hidden="true" />}
      <span className="text-[12.5px]" style={{ ...sans, color: met ? T.ok : T.black, opacity: met ? 1 : 0.55 }}>{label}</span>
    </div>
  );
}

export default function SignupPage({ go }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState(false);

  const reqs = useMemo(() => ({
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }), [password]);

  const validEmail = EMAIL_RE.test(email);
  const matches = confirm.length > 0 && confirm === password;
  const allReqsMet = Object.values(reqs).every(Boolean);
  const canSubmit = name.trim().length > 1 && validEmail && allReqsMet && matches;

  function submit(e) {
    e.preventDefault();
    setTouched(true);
    // Account creation is simulated until the auth API exists (Phase 3).
    if (canSubmit) go("workspace");
  }

  return (
    <AuthShell>
      <h1 className="text-[20px] mb-1" style={{ ...serif, color: T.black }}>Create your account</h1>
      <p className="text-[13px] mb-7" style={{ ...sans, color: T.black, opacity: 0.6 }}>
        Set up a workspace for your research.
      </p>
      <form onSubmit={submit} noValidate>
        <Field label="Full name" error={touched && name.trim().length < 2 ? "Enter your full name." : null}>
          <TextInput autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" />
        </Field>
        <Field label="Email" error={touched && !validEmail ? "Enter a valid email address." : null}>
          <TextInput type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" />
        </Field>
        <Field label="Password">
          <div className="relative">
            <TextInput
              type={showPw ? "text" : "password"} autoComplete="new-password" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="Create a password"
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
        <div className="grid grid-cols-2 gap-y-1.5 mb-4 -mt-2" aria-label="Password requirements">
          <ReqRow met={reqs.length} label="8 characters" />
          <ReqRow met={reqs.upper} label="Uppercase letter" />
          <ReqRow met={reqs.lower} label="Lowercase letter" />
          <ReqRow met={reqs.special} label="Special character" />
        </div>
        <Field label="Confirm password" error={touched && !matches ? "Passwords do not match." : null}>
          <TextInput
            type={showPw ? "text" : "password"} autoComplete="new-password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter your password"
          />
        </Field>
        <Button type="submit" className="w-full" disabled={!canSubmit}>Create account</Button>
        <Divider />
        <GoogleButton onClick={() => go("workspace")} />
      </form>
      <p className="text-center text-[13px] mt-7" style={{ ...sans, color: T.black, opacity: 0.7 }}>
        Already have an account?{" "}
        <button type="button" className="cursor-pointer" style={{ color: T.ink }} onClick={() => go("login")}>Log in</button>
      </p>
    </AuthShell>
  );
}
