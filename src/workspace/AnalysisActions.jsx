import { Loader2 } from "lucide-react";
import { ACTIONS } from "./config";
import { T, serif, sans } from "../styles/tokens";

/*
  Grid of analysis triggers. Disabled while an analysis is running and
  replaced by an empty state when the project has no documents.
  `onRun(action)` receives the full action config (key, label, section).
*/
export default function AnalysisActions({ hasFiles, running, onRun }) {
  return (
    <section aria-labelledby="analysis-heading">
      <div className="flex items-center justify-between mb-3">
        <h3 id="analysis-heading" className="text-[14px]" style={{ ...serif, color: T.black }}>Research Intelligence</h3>
        {running && (
          <span className="flex items-center gap-1.5 text-[12px]" style={{ ...sans, color: T.inkSoft }} role="status">
            <Loader2 size={12} className="animate-spin" aria-hidden="true" /> Running analysis…
          </span>
        )}
      </div>
      {!hasFiles ? (
        <div className="border py-6 px-5 text-center" style={{ borderColor: T.line }}>
          <p className="text-[13px]" style={{ ...sans, color: T.black, opacity: 0.6 }}>Upload at least one document to run an analysis.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACTIONS.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => onRun(a)}
              disabled={running}
              className="flex items-center gap-3 px-4 py-3.5 border text-left disabled:opacity-50 hover:bg-cream transition-colors"
              style={{ borderColor: T.line, background: "white" }}
            >
              <a.icon size={16} style={{ color: T.ink }} strokeWidth={1.6} aria-hidden="true" />
              <span className="text-[13px]" style={{ ...sans, color: T.black }}>{a.label}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
