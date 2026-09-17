import { Pencil } from "lucide-react";
import DocumentUpload from "./DocumentUpload";
import AnalysisActions from "./AnalysisActions";
import { formatRelativeTime } from "../utils/time";
import { T, serif, sans, mono } from "../styles/tokens";

/* Main column: project header, derived stats, document upload and analysis triggers. */
export default function CentralWorkspace({ project, summary, files, setFiles, running, onRun, onEditProject }) {
  const hasFiles = files.length > 0;
  const stats = [
    ["Documents", summary.fileCount],
    ["Gaps identified", summary.gapCount],
    ["Last analysis", formatRelativeTime(summary.lastAnalysisAt)],
  ];

  return (
    <main className="flex-1 min-w-0 overflow-y-auto px-5 md:px-8 py-7" style={{ background: T.cream }}>
      <div className="max-w-[760px]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] px-2 py-[3px] border" style={{ borderColor: T.line, ...sans, color: T.black, opacity: 0.6 }}>{summary.status}</span>
        </div>
        <div className="flex items-start justify-between gap-4 mb-1.5">
          <h1 className="text-[24px]" style={{ ...serif, color: T.black }}>{project.name}</h1>
          <button
            type="button"
            onClick={onEditProject}
            aria-label="Edit project"
            className="shrink-0 mt-2 flex items-center gap-1.5 text-[12px] hover:opacity-100"
            style={{ ...sans, color: T.inkSoft, opacity: 0.8 }}
          >
            <Pencil size={12} aria-hidden="true" /> Edit
          </button>
        </div>
        {project.objective ? (
          <p className="text-[13.5px] mb-5 leading-relaxed" style={{ ...sans, color: T.black, opacity: 0.65 }}>{project.objective}</p>
        ) : (
          <p className="text-[13.5px] mb-5 leading-relaxed" style={{ ...sans, color: T.black, opacity: 0.65 }}>
            No research objective set yet.{" "}
            <button type="button" onClick={onEditProject} className="underline underline-offset-2" style={{ color: T.ink }}>
              Add one
            </button>{" "}
            to help REbud contextualise its analysis.
          </p>
        )}
        <dl className="flex items-center flex-wrap gap-6 mb-8 pb-6 border-b" style={{ borderColor: T.line }}>
          {stats.map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px]" style={{ ...sans, color: T.black, opacity: 0.45 }}>{label}</dt>
              <dd className="text-[15px] mt-0.5" style={{ ...mono, color: T.black }}>{value}</dd>
            </div>
          ))}
        </dl>

        <DocumentUpload files={files} setFiles={setFiles} />
        <AnalysisActions hasFiles={hasFiles} running={running} onRun={onRun} />
      </div>
    </main>
  );
}
