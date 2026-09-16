import { GitBranch } from "lucide-react";
import PanelHeading from "../../components/PanelHeading";
import { T, serif, sans, mono } from "../../styles/tokens";

/* Related literature ranked by relevance, with the reason each paper matters. */
export default function RelatedSection({ data }) {
  return (
    <div>
      <PanelHeading
        icon={GitBranch}
        title="Related Research"
        note="Presentation layer for V1 — literature retrieval will be wired to a live index later."
      />
      <div className="space-y-3">
        {data.map((r, i) => (
          <article key={i} className="border bg-white p-3.5" style={{ borderColor: T.softBlueLine }}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-[13px] leading-snug" style={{ ...serif, color: T.black }}>{r.title}</p>
              <span
                className="text-[11px] shrink-0 px-1.5 py-[1px]"
                style={{ ...mono, color: T.ink, background: T.softBlue }}
                aria-label={`Relevance ${r.relevance}`}
              >
                {r.relevance}
              </span>
            </div>
            <p className="text-[11.5px] mb-2" style={{ ...sans, color: T.black, opacity: 0.5 }}>{r.authors} · {r.year}</p>
            <p className="text-[12px] leading-relaxed" style={{ ...sans, color: T.black, opacity: 0.7 }}>{r.reason}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
