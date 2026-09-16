import { T, serif } from "../styles/tokens";

/* Centered card layout shared by the login and signup screens. */
export default function AuthShell({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: T.cream }}>
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-9">
          <span className="text-[22px]" style={{ ...serif, color: T.ink }}>REbud</span>
        </div>
        <div className="bg-white p-7 sm:p-9 border" style={{ borderColor: T.line }}>
          {children}
        </div>
      </div>
    </div>
  );
}
