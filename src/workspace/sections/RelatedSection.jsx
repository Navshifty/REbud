import { ExternalLink, GitBranch } from "lucide-react";
import PanelHeading from "../../components/PanelHeading";
import { T, serif, sans, mono } from "../../styles/tokens";

/*
  Related literature ranked by relevance, plus research domains and
  directions. Accepts either a plain array of papers (sample data) or
  { papers, domains, directions } from the pipeline. Papers the model
  could not confirm from the documents or a search are marked unverified.
*/
export default function RelatedSection({ data }) {
  const papers = Array.isArray(data) ? data : data.papers ?? [];
  const domains = Array.isArray(data) ? [] : data.domains ?? [];
  const directions = Array.isArray(data) ? [] : data.directions ?? [];
  const anyUnverified = papers.some((p) => p.verified === false);

  return (
    <div>
      <PanelHeading
        icon={GitBranch}
        title="Related Research"
        note={anyUnverified
          ? "Works marked Unverified come from the model's knowledge, not from your documents or a search — check them before citing."
          : "Related work drawn from the documents' references and the model's knowledge."}
      />

      {domains.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {domains.map((d) => (
            <span key={d} className="text-[11px] px-2 py-[3px] border" style={{ ...sans, borderColor: T.softBlueLine, color: T.inkSoft }}>{d}</span>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {papers.map((r, i) => (
          <article key={i} className="border bg-white p-3.5" style={{ borderColor: T.softBlueLine }}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-[13px] leading-snug" style={{ ...serif, color: T.black }}>
                {r.url ? (
                  <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1 hover:underline">
                    {r.title} <ExternalLink size={11} className="mt-1 shrink-0" style={{ color: T.inkSoft }} aria-hidden="true" />
                  </a>
                ) : r.title}
              </p>
              <span
                className="text-[11px] shrink-0 px-1.5 py-[1px]"
                style={{ ...mono, color: T.ink, background: T.softBlue }}
                aria-label={`Relevance ${r.relevance}`}
              >
                {r.relevance}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <p className="text-[11.5px]" style={{ ...sans, color: T.black, opacity: 0.5 }}>
                {r.authors} · {r.year}{r.venue ? ` · ${r.venue}` : ""}
              </p>
              {r.verified === false && (
                <span className="text-[10.5px] px-1.5 py-[1px] border" style={{ ...sans, borderColor: T.warn, color: T.warn }}>Unverified</span>
              )}
            </div>
            <p className="text-[12px] leading-relaxed" style={{ ...sans, color: T.black, opacity: 0.7 }}>{r.reason}</p>
          </article>
        ))}
      </div>

      {directions.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] mb-1.5" style={{ ...sans, color: T.black, opacity: 0.45 }}>Directions worth exploring</p>
          {directions.map((d, i) => (
            <div key={i} className="flex gap-2 mb-1.5">
              <span className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ background: T.ink }} />
              <p className="text-[12.5px] leading-relaxed" style={{ ...sans, color: T.black, opacity: 0.75 }}>{d}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
