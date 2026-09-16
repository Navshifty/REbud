import { MessageSquare, Target } from "lucide-react";
import PanelHeading from "../../components/PanelHeading";
import ScoreRing from "../../components/ScoreRing";
import { T, serif, sans } from "../../styles/tokens";

/* Novelty estimate with strengths, overlap with prior work, and what needs differentiation. */
export default function NoveltySection({ data, onOpenChat }) {
  const facets = [
    { label: "Strengths", color: T.ok, text: data.strengths },
    { label: "Overlap", color: T.warn, text: data.overlap },
    { label: "Needs differentiation", color: T.inkSoft, text: data.needsDifferentiation },
  ];
  return (
    <div>
      <PanelHeading icon={Target} title="Novelty" note="An analytical estimate, not a definitive claim of originality." />
      <div className="flex items-center gap-5 border bg-white p-4" style={{ borderColor: T.softBlueLine }}>
        <ScoreRing value={data.score} />
        <div>
          <p className="text-[13px]" style={{ ...serif, color: T.black }}>{data.verdict}</p>
          <p className="text-[12px] mt-1 leading-relaxed" style={{ ...sans, color: T.black, opacity: 0.65 }}>{data.summary}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 mt-3">
        {facets.map((f) => (
          <div key={f.label}>
            <p className="text-[11.5px] mb-1.5" style={{ ...sans, color: f.color }}>{f.label}</p>
            <p className="text-[12.5px] leading-relaxed" style={{ ...sans, color: T.black, opacity: 0.7 }}>{f.text}</p>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onOpenChat}
        className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 border text-[12.5px]"
        style={{ borderColor: T.line, ...sans, color: T.ink }}
      >
        <MessageSquare size={13} aria-hidden="true" /> Ask about this score
      </button>
    </div>
  );
}
