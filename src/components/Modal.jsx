import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { T, serif } from "../styles/tokens";

/*
  Minimal accessible modal: backdrop, Escape to close, focus moved inside
  on open and restored on close. Rendered inline (no portal) — the
  workspace root is the only place that mounts it.
*/
export default function Modal({ title, onClose, children, width = 460 }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const first = panelRef.current?.querySelector("input, textarea, select, button:not([data-modal-close])");
    (first ?? panelRef.current)?.focus();

    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(23, 22, 15, 0.45)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className="w-full bg-white border outline-none"
        style={{ maxWidth: width, borderColor: T.line }}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 id="modal-title" className="text-[17px]" style={{ ...serif, color: T.black }}>{title}</h2>
          <button type="button" data-modal-close aria-label="Close" onClick={onClose}>
            <X size={16} style={{ color: T.black, opacity: 0.5 }} />
          </button>
        </div>
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}
