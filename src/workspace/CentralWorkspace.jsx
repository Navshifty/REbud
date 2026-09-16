import DocumentUpload from "./DocumentUpload";
import AnalysisActions from "./AnalysisActions";
import { T, serif, sans, mono } from "../styles/tokens";

/* Main column: project header, stats, document upload and analysis triggers. */
export default function CentralWorkspace({ project, files, setFiles, running, onRun }) {
  const hasFiles = files.length > 0;
  const stats = [
    ["Documents", files.length],
    ["Gaps identified", project.gaps],
    ["Last analysis", project.lastAnalysis],
  ];

  return (
    <main className="flex-1 min-w-0 overflow-y-auto px-5 md:px-8 py-7" style={{ background: T.cream }}>
      <div className="max-w-[760px]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] px-2 py-[3px] border" style={{ borderColor: T.line, ...sans, color: T.black, opacity: 0.6 }}>{project.status}</span>
        </div>
        <h1 className="text-[24px] mb-1.5" style={{ ...serif, color: T.black }}>{project.name}</h1>
        <p className="text-[13.5px] mb-5 leading-relaxed" style={{ ...sans, color: T.black, opacity: 0.65 }}>
          {project.objective || "No research objective set yet — add one to help REbud contextualise its analysis."}
        </p>
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
