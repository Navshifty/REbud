import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, RotateCcw, Upload, X } from "lucide-react";
import { fileIcon } from "../utils/fileIcon";
import { ACCEPT_ATTR, MAX_FILES } from "../services/documentService";
import { T, serif, sans, mono } from "../styles/tokens";

/*
  A document is usable for analysis only once its text has been
  extracted, so the badge reports extraction, not just upload.
*/
function StatusBadge({ doc }) {
  if (doc.status === "Uploading") {
    return (
      <span className="flex items-center gap-1.5 text-[11.5px]" style={{ ...sans, color: T.inkSoft }}>
        <Loader2 size={11} className="animate-spin" aria-hidden="true" /> Uploading
      </span>
    );
  }
  if (doc.status === "Processing") {
    return <span className="text-[11.5px]" style={{ ...sans, color: T.inkSoft }}>Processing</span>;
  }
  if (doc.status === "Failed") {
    return (
      <span className="flex items-center gap-1.5 text-[11.5px]" style={{ ...sans, color: T.warn }}>
        <AlertTriangle size={12} aria-hidden="true" /> Upload failed
      </span>
    );
  }
  if (doc.extraction === "failed") {
    return (
      <span className="flex items-center gap-1.5 text-[11.5px]" style={{ ...sans, color: T.warn }} title={doc.extractionError}>
        <AlertTriangle size={12} aria-hidden="true" /> No text found
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-[11.5px]" style={{ ...sans, color: T.ok }}>
      <CheckCircle2 size={12} aria-hidden="true" /> Ready
    </span>
  );
}

/*
  Drag-and-drop document uploader plus file list for the active project.
  `onUpload(files)` resolves with { rejected: [...reasons] }; the list
  itself is owned by the workspace state (optimistic placeholders included).
*/
export default function DocumentUpload({ files, filesLoaded = true, onUpload, onRemove, onReprocess }) {
  const [dragging, setDragging] = useState(false);
  const [rejections, setRejections] = useState([]);
  const inputRef = useRef(null);
  const atLimit = files.length >= MAX_FILES;

  async function addFiles(list) {
    if (atLimit || !list?.length) return;
    const { rejected } = await onUpload(list);
    setRejections(rejected ?? []);
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
          <p className="text-[11.5px] mt-1" style={{ ...sans, color: T.black, opacity: 0.5 }}>PDF, DOCX, TXT, CSV, Markdown · up to 25 MB each</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT_ATTR}
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

      {rejections.length > 0 && (
        <div className="mt-3 border px-4 py-3" style={{ borderColor: T.warn, background: "#FBF1EC" }} role="alert">
          <div className="flex items-start justify-between gap-3">
            <div>
              {rejections.map((r, i) => (
                <p key={i} className="text-[12.5px] leading-relaxed" style={{ ...sans, color: T.warn }}>{r}</p>
              ))}
            </div>
            <button type="button" aria-label="Dismiss" onClick={() => setRejections([])}>
              <X size={14} style={{ color: T.warn }} />
            </button>
          </div>
        </div>
      )}

      {!filesLoaded && files.length === 0 && (
        <p className="mt-3 flex items-center gap-2 text-[12.5px]" style={{ ...sans, color: T.black, opacity: 0.5 }} role="status">
          <Loader2 size={12} className="animate-spin" aria-hidden="true" /> Loading documents…
        </p>
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
                  <StatusBadge doc={f} />
                  {f.extraction === "failed" && onReprocess && (
                    <button
                      type="button"
                      aria-label={`Retry text extraction for ${f.name}`}
                      onClick={() => onReprocess(f.id)}
                      className="flex items-center gap-1 text-[11.5px]"
                      style={{ ...sans, color: T.ink }}
                    >
                      <RotateCcw size={11} aria-hidden="true" /> Retry
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    disabled={f.status === "Uploading"}
                    className="disabled:opacity-30"
                    onClick={() => onRemove(f.id)}
                  >
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
