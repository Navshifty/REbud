import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { fileIcon } from "../utils/fileIcon";
import { MAX_FILES } from "./config";
import { T, serif, sans, mono } from "../styles/tokens";

const ACCEPT = ".pdf,.docx,.txt,.csv,.md";

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function StatusBadge({ status }) {
  if (status === "Uploading") {
    return (
      <span className="flex items-center gap-1.5 text-[11.5px]" style={{ ...sans, color: T.inkSoft }}>
        <Loader2 size={11} className="animate-spin" aria-hidden="true" /> Uploading
      </span>
    );
  }
  if (status === "Processing") {
    return <span className="text-[11.5px]" style={{ ...sans, color: T.inkSoft }}>Processing</span>;
  }
  return (
    <span className="flex items-center gap-1.5 text-[11.5px]" style={{ ...sans, color: T.ok }}>
      <CheckCircle2 size={12} aria-hidden="true" /> Processed
    </span>
  );
}

/*
  Drag-and-drop document uploader plus file list for the active project.
  Upload/processing is simulated locally; the real upload API lands in Phase 3.
*/
export default function DocumentUpload({ files, setFiles }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const atLimit = files.length >= MAX_FILES;

  function addFiles(list) {
    if (atLimit) return;
    const room = MAX_FILES - files.length;
    const added = Array.from(list).slice(0, room).map((f, i) => ({
      id: Date.now() + i,
      name: f.name,
      type: (f.name.split(".").pop() || "FILE").toUpperCase(),
      size: formatSize(f.size),
      status: "Uploading",
    }));
    setFiles((prev) => [...prev, ...added]);
    added.forEach((a) => {
      setTimeout(() => {
        setFiles((prev) => prev.map((f) => (f.id === a.id ? { ...f, status: "Processed" } : f)));
      }, 1200);
    });
  }

  function removeFile(id) {
    setFiles((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <section className="mb-8" aria-labelledby="documents-heading">
      <div className="flex items-center justify-between mb-3">
        <h3 id="documents-heading" className="text-[14px]" style={{ ...serif, color: T.black }}>Documents</h3>
        <span className="text-[12px]" style={{ ...mono, color: atLimit ? T.warn : T.black, opacity: atLimit ? 1 : 0.55 }}>
          {files.length} / {MAX_FILES} files
        </span>
      </div>

      {!atLimit ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
          role="button"
          tabIndex={0}
          aria-label="Upload documents"
          className="border border-dashed flex flex-col items-center justify-center py-8 cursor-pointer"
          style={{ borderColor: dragging ? T.ink : T.line, background: dragging ? T.softBlue : "white" }}
        >
          <Upload size={20} style={{ color: T.inkSoft }} strokeWidth={1.5} aria-hidden="true" />
          <p className="text-[13px] mt-3" style={{ ...sans, color: T.black }}>Drag and drop files, or click to browse</p>
          <p className="text-[11.5px] mt-1" style={{ ...sans, color: T.black, opacity: 0.5 }}>PDF, DOCX, TXT, CSV, Markdown</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
          />
        </div>
      ) : (
        <div className="border py-4 px-4 flex items-center gap-2" style={{ borderColor: T.warn, background: "#FBF1EC" }} role="alert">
          <AlertTriangle size={15} style={{ color: T.warn }} aria-hidden="true" />
          <p className="text-[13px]" style={{ ...sans, color: T.warn }}>Upload limit reached — remove a file to add another.</p>
        </div>
      )}

      {files.length > 0 && (
        <ul className="mt-3 border" style={{ borderColor: T.line }}>
          {files.map((f, i) => {
            const Icon = fileIcon(f.type);
            return (
              <li key={f.id} className="flex items-center justify-between px-4 py-2.5 gap-3" style={{ borderTop: i > 0 ? `1px solid ${T.line}` : "none" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <Icon size={15} style={{ color: T.inkSoft }} className="shrink-0" aria-hidden="true" />
                  <span className="text-[13px] truncate" style={{ ...sans, color: T.black }}>{f.name}</span>
                  <span className="text-[11px] px-1.5 py-[1px] border shrink-0" style={{ borderColor: T.line, color: T.black, opacity: 0.55, ...mono }}>{f.type}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="hidden sm:inline text-[11.5px]" style={{ ...mono, color: T.black, opacity: 0.5 }}>{f.size}</span>
                  <StatusBadge status={f.status} />
                  <button type="button" aria-label={`Remove ${f.name}`} onClick={() => removeFile(f.id)}>
                    <X size={14} style={{ color: T.black, opacity: 0.4 }} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
