import { T, sans } from "../styles/tokens";

/* Horizontal rule with a centred word, e.g. "or" between login options. */
export default function Divider({ label = "or" }) {
  return (
    <div className="flex items-center gap-3 my-5" role="separator">
      <div className="h-px flex-1" style={{ background: T.line }} />
      <span className="text-[11.5px]" style={{ ...sans, color: T.black, opacity: 0.45 }}>{label}</span>
      <div className="h-px flex-1" style={{ background: T.line }} />
    </div>
  );
}
