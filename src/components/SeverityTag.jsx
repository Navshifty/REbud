import { T, sans } from "../styles/tokens";

/* Outlined severity label: High (warn), Medium (soft ink), Low (ok). */
export default function SeverityTag({ level }) {
  const color = level === "High" ? T.warn : level === "Medium" ? T.inkSoft : T.ok;
  return (
    <span className="text-[11px] px-2 py-[3px] border" style={{ borderColor: color, color, ...sans }}>
      {level}
    </span>
  );
}
