import { useState } from "react";
import { ChevronDown, ChevronUp, MessageSquare, ScanSearch } from "lucide-react";
import PanelHeading from "../../components/PanelHeading";
import SeverityTag from "../../components/SeverityTag";
import EvidenceList from "../../components/EvidenceList";
import { T, sans, mono } from "../../styles/tokens";

/*
  Research gaps as expandable cards. Each gap separates the model's
  explanation (interpretation) from the document evidence behind it.
*/
export default function GapsSection({ data, onOpenChat }) {
  const [expanded, setExpanded] = useState(null);
  return (
    <div>
      <PanelHeading icon={ScanSearch} title="Research Gaps" />
      <div className="space-y-2">
        {data.map((g) => {
          const open = expanded === g.id;
          return (
            <div key={g.id} className="border bg-white" style={{ borderColor: T.softBlueLine }}>
              <button
                type="button"
                className="w-full text-left px-3.5 py-3"
                aria-expanded={open}
                onClick={() => setExpanded(open ? null : g.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] leading-snug" style={{ ...sans, color: T.black }}>{g.title}</p>
                  {open
                    ? <ChevronUp size={14} className="shrink-0 mt-0.5" style={{ opacity: 0.5 }} aria-hidden="true" />
                    : <ChevronDown size={14} className="shrink-0 mt-0.5" style={{ opacity: 0.5 }} aria-hidden="true" />}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <SeverityTag level={g.severity} />
                  <span className="text-[11px]" style={{ ...mono, color: T.black, opacity: 0.55 }}>{g.confidence}% confidence</span>
                </div>
              </button>
              {open && (
                <div className="px-3.5 pb-3.5 pt-0.5" style={{ borderTop: `1px solid ${T.softBlueLine}` }}>
                  <p className="text-[12.5px] leading-relaxed mt-3" style={{ ...sans, color: T.black, opacity: 0.75 }}>{g.explanation}</p>
                  {g.opportunity && (
                    <div className="mt-3">
                      <p className="text-[11px] mb-1" style={{ ...sans, color: T.ok }}>Opportunity</p>
                      <p className="text-[12.5px] leading-relaxed" style={{ ...sans, color: T.black, opacity: 0.75 }}>{g.opportunity}</p>
                    </div>
                  )}
                  <EvidenceList evidence={g.evidence} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onOpenChat}
        className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 border text-[12.5px]"
        style={{ borderColor: T.line, ...sans, color: T.ink }}
      >
        <MessageSquare size={13} aria-hidden="true" /> Discuss these gaps
      </button>
    </div>
  );
}
