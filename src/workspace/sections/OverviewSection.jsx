import { AlertTriangle, BarChart3 } from "lucide-react";
import PanelHeading from "../../components/PanelHeading";
import ScoreRing from "../../components/ScoreRing";
import EvidenceList from "../../components/EvidenceList";
import { itemEvidence, itemText } from "../../utils/evidence";
import { T, sans, mono, serif } from "../../styles/tokens";

const SUMMARY_FIELDS = [
  ["problem", "Research problem"],
  ["objective", "Objective"],
  ["domain", "Domain"],
  ["methodology", "Methodology"],
];

/* Overall analysis: research summary, five headline scores, key findings, critical issues, next steps. */
export default function OverviewSection({ data }) {
  const scores = [
    ["Overall Strength", data.strength],
    ["Research Gap", data.gap],
    ["Novelty", data.novelty],
    ["Relevance", data.relevance],
    ["Evidence Strength", data.evidence],
  ];
  const summary = data.summary && SUMMARY_FIELDS.filter(([k]) => data.summary[k]);

  return (
    <div>
      <PanelHeading icon={BarChart3} title="Overall Analysis" />

      {summary?.length > 0 && (
        <dl className="border bg-white p-3.5 mb-4 space-y-2.5" style={{ borderColor: T.softBlueLine }}>
          {summary.map(([key, label]) => (
            <div key={key}>
              <dt className="text-[10.5px] uppercase tracking-wide" style={{ ...sans, color: T.black, opacity: 0.45 }}>{label}</dt>
              <dd className="text-[12.5px] leading-relaxed mt-0.5" style={{ ...serif, color: T.black }}>{data.summary[key]}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {scores.map(([label, val]) => (
          <div key={label} className="border bg-white p-3 flex flex-col items-center" style={{ borderColor: T.softBlueLine }}>
            <ScoreRing value={val ?? 0} size={56} label={label} />
          </div>
        ))}
      </div>

      <div className="mb-5">
        <p className="text-[11.5px] mb-2" style={{ ...sans, color: T.black, opacity: 0.5 }}>Key Findings</p>
        {data.findings.map((f, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <span className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ background: T.ink }} />
            <div className="min-w-0">
              <p className="text-[12.5px] leading-relaxed" style={{ ...sans, color: T.black, opacity: 0.75 }}>{itemText(f)}</p>
              <EvidenceList evidence={itemEvidence(f)} compact />
            </div>
          </div>
        ))}
      </div>

      <div className="mb-5">
        <p className="text-[11.5px] mb-2" style={{ ...sans, color: T.warn }}>Critical Issues</p>
        {data.critical.map((c, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <AlertTriangle size={11} className="mt-0.5 shrink-0" style={{ color: T.warn }} aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[12.5px] leading-relaxed" style={{ ...sans, color: T.black, opacity: 0.75 }}>{itemText(c)}</p>
              <EvidenceList evidence={itemEvidence(c)} compact />
            </div>
          </div>
        ))}
      </div>

      <div>
        <p className="text-[11.5px] mb-2" style={{ ...sans, color: T.ok }}>Recommended Next Steps</p>
        {data.next.map((step, i) => (
          <div key={i} className="flex gap-2 mb-1.5">
            <span className="text-[11px] mt-0.5" style={{ ...mono, color: T.ok }}>{i + 1}.</span>
            <p className="text-[12.5px] leading-relaxed" style={{ ...sans, color: T.black, opacity: 0.75 }}>{itemText(step)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
