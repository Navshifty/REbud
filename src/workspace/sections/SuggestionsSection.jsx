import { useState } from "react";
import { CheckCircle2, Circle, Lightbulb } from "lucide-react";
import PanelHeading from "../../components/PanelHeading";
import EvidenceList from "../../components/EvidenceList";
import { T, sans } from "../../styles/tokens";

/* Actionable suggestions the researcher can tick off; each may carry a rationale and evidence. */
export default function SuggestionsSection({ data }) {
  const [done, setDone] = useState([]);
  const [open, setOpen] = useState(null);

  function toggleDone(id) {
    setDone((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  }

  return (
    <div>
      <PanelHeading icon={Lightbulb} title="Suggestions" />
      <div className="space-y-2">
        {data.map((s) => {
          const isDone = done.includes(s.id);
          const hasDetail = Boolean(s.rationale) || (Array.isArray(s.evidence) && s.evidence.length > 0);
          const isOpen = open === s.id;
          return (
            <div key={s.id} className="border bg-white" style={{ borderColor: T.softBlueLine, opacity: isDone ? 0.55 : 1 }}>
              <div className="flex items-start gap-2.5 px-3.5 py-3">
                <button type="button" aria-pressed={isDone} aria-label={isDone ? "Mark as not done" : "Mark as done"} onClick={() => toggleDone(s.id)} className="mt-0.5 shrink-0">
                  {isDone
                    ? <CheckCircle2 size={15} style={{ color: T.ok }} aria-hidden="true" />
                    : <Circle size={15} style={{ color: T.black, opacity: 0.3 }} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] leading-relaxed" style={{ ...sans, color: T.black, textDecoration: isDone ? "line-through" : "none" }}>{s.text}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10.5px]" style={{ ...sans, color: T.inkSoft }}>{s.tag}</span>
                    {hasDetail && (
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setOpen(isOpen ? null : s.id)}
                        className="text-[10.5px] underline underline-offset-2"
                        style={{ ...sans, color: T.black, opacity: 0.5 }}
                      >
                        {isOpen ? "Hide why" : "Why?"}
                      </button>
                    )}
                  </div>
                  {isOpen && (
                    <div className="mt-2">
                      {s.rationale && (
                        <p className="text-[12px] leading-relaxed" style={{ ...sans, color: T.black, opacity: 0.7 }}>{s.rationale}</p>
                      )}
                      <EvidenceList evidence={s.evidence} compact />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
