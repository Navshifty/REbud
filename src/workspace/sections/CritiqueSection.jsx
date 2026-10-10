import { Shield } from "lucide-react";
import PanelHeading from "../../components/PanelHeading";
import EvidenceList from "../../components/EvidenceList";
import { itemEvidence, itemText } from "../../utils/evidence";
import { T, sans } from "../../styles/tokens";

/* Critical analysis grouped by category; each point may carry document evidence. */
export default function CritiqueSection({ data }) {
  return (
    <div>
      <PanelHeading icon={Shield} title="Critique" />
      <div className="space-y-4">
        {data.map((c) => (
          <div key={c.category}>
            <p className="text-[12px] mb-1.5" style={{ ...sans, color: T.inkSoft, fontWeight: 600 }}>{c.category}</p>
            {c.items.map((it, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <span className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ background: T.black, opacity: 0.4 }} />
                <div className="min-w-0">
                  <p className="text-[12.5px] leading-relaxed" style={{ ...sans, color: T.black, opacity: 0.75 }}>{itemText(it)}</p>
                  <EvidenceList evidence={itemEvidence(it)} compact />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
