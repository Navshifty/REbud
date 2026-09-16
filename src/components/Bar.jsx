import { T } from "../styles/tokens";

/* Thin horizontal progress bar (0–max). */
export default function Bar({ value, max = 100, label }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className="w-full h-[5px]"
      style={{ background: T.line }}
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className="h-full" style={{ width: `${pct}%`, background: T.ink }} />
    </div>
  );
}
