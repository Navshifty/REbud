import { AlertTriangle, BarChart3 } from "lucide-react";
import PanelHeading from "../../components/PanelHeading";
import ScoreRing from "../../components/ScoreRing";
import { T, sans, mono } from "../../styles/tokens";

/* Overall analysis: five headline scores, key findings, critical issues, next steps. */
export default function OverviewSection({ data }) {
  const scores = [
    ["Overall Strength", data.strength],
    ["Research Gap", data.gap],
    ["Novelty", data.novelty],
    ["Relevance", data.relevance],
    ["Evidence Strength", data.evidence],
  ];
  return (
    <div>
      <PanelHeading icon={BarChart3} title="Overall Analysis" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {scores.map(([label, val]) => (
          <div key={label} className="border bg-white p-3 flex flex-col items-center" style={{ borderColor: T.softBlueLine }}>
            <ScoreRing value={val} size={56} label={label} />
          </div>
        ))}
      </div>
      <div className="mb-5">
        <p className="text-[11.5px] mb-2" style={{ ...sans, color: T.black, opacity: 0.5 }}>Key Findings</p>
        {data.findings.map((f, i) => (
          <div key={i} className="flex gap-2 mb-1.5">
            <span className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ background: T.ink }} />
            <p className="text-[12.5px] leading-relaxed" style={{ ...sans, color: T.black, opacity: 0.75 }}>{f}</p>
          </div>
        ))}
      </div>
      <div className="mb-5">
        <p className="text-[11.5px] mb-2" style={{ ...sans, color: T.warn }}>Critical Issues</p>
        {data.critical.map((f, i) => (
          <div key={i} className="flex gap-2 mb-1.5">
            <AlertTriangle size={11} className="mt-0.5 shrink-0" style={{ color: T.warn }} aria-hidden="true" />
            <p className="text-[12.5px] leading-relaxed" style={{ ...sans, color: T.black, opacity: 0.75 }}>{f}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="text-[11.5px] mb-2" style={{ ...sans, color: T.ok }}>Recommended Next Steps</p>
        {data.next.map((f, i) => (
          <div key={i} className="flex gap-2 mb-1.5">
            <span className="text-[11px] mt-0.5" style={{ ...mono, color: T.ok }}>{i + 1}.</span>
            <p className="text-[12.5px] leading-relaxed" style={{ ...sans, color: T.black, opacity: 0.75 }}>{f}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
