import { Quote } from "lucide-react";
import { T, sans, serif } from "../styles/tokens";

/*
  Renders the evidence behind a finding: verbatim passages from the
  uploaded documents. Accepts the model's { document, quote, chunkId }
  objects as well as the plain strings used by sample data.
*/
export default function EvidenceList({ evidence, label = "Supporting evidence", compact = false }) {
  if (!Array.isArray(evidence) || evidence.length === 0) return null;
  return (
    <div className={compact ? "mt-2" : "mt-3"}>
      <p className="text-[11px] mb-1" style={{ ...sans, color: T.black, opacity: 0.45 }}>{label}</p>
      {evidence.map((e, i) => {
        const isObject = e && typeof e === "object";
        const document = isObject ? e.document : null;
        const quote = isObject ? e.quote : e;
        return (
          <div key={i} className="flex items-start gap-1.5 mt-1">
            <Quote size={11} className="mt-[3px] shrink-0" style={{ color: T.inkSoft }} aria-hidden="true" />
            <div className="min-w-0">
              {document && (
                <p className="text-[11px] truncate" style={{ ...sans, color: T.inkSoft }}>{document}</p>
              )}
              <p className="text-[11.5px] leading-relaxed" style={{ ...(document ? serif : sans), color: T.black, opacity: document ? 0.8 : 1, ...(document ? {} : { color: T.inkSoft }) }}>
                {document ? `“${quote}”` : quote}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
