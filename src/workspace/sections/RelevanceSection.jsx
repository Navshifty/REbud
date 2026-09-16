import { BookOpen } from "lucide-react";
import Bar from "../../components/Bar";
import PanelHeading from "../../components/PanelHeading";
import { T, sans, mono } from "../../styles/tokens";

/* Proposal relevance: alignment scores as bars, plus missing conceptual components. */
export default function RelevanceSection({ data }) {
  const rows = [
    ["Problem relevance", data.problemRelevance],
    ["Research question alignment", data.questionAlignment],
    ["Method alignment", data.methodAlignment],
    ["Expected contribution", data.expectedContribution],
  ];
  return (
    <div>
      <PanelHeading icon={BookOpen} title="Proposal Relevance" />
      <div className="space-y-3.5">
        {rows.map(([label, val]) => (
          <div key={label}>
            <div className="flex justify-between mb-1">
              <span className="text-[12.5px]" style={{ ...sans, color: T.black }}>{label}</span>
              <span className="text-[12px]" style={{ ...mono, color: T.black, opacity: 0.6 }}>{val}</span>
            </div>
            <Bar value={val} label={label} />
          </div>
        ))}
      </div>
      <p className="text-[11px] mt-4 mb-1.5" style={{ ...sans, color: T.black, opacity: 0.45 }}>Missing conceptual components</p>
      {data.missing.map((m, i) => (
        <div key={i} className="flex gap-2 mb-1.5">
          <span className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ background: T.warn }} />
          <p className="text-[12.5px] leading-relaxed" style={{ ...sans, color: T.black, opacity: 0.75 }}>{m}</p>
        </div>
      ))}
    </div>
  );
}
