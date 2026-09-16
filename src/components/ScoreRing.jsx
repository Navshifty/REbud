import { T, sans, mono } from "../styles/tokens";

/* Circular 0–100 score indicator with the value printed in the centre. */
export default function ScoreRing({ value, size = 64, stroke = 5, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label ? label + ": " : ""}${value} out of 100`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.line} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.ink} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="butt"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x="50%" y="53%" textAnchor="middle" fontSize={size * 0.26} style={mono} fill={T.black}>{value}</text>
      </svg>
      {label ? (
        <span className="text-[11.5px] text-center leading-tight" style={{ ...sans, color: T.black, opacity: 0.7 }}>{label}</span>
      ) : null}
    </div>
  );
}
