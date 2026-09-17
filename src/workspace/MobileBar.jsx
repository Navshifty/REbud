import { LayoutGrid, Sparkles } from "lucide-react";
import { T, sans } from "../styles/tokens";

const VIEWS = [
  { key: "main", label: "Workspace", icon: LayoutGrid },
  { key: "panel", label: "Intelligence", icon: Sparkles },
];

/* Phone-only bottom bar to switch between the central workspace and the intelligence panel. */
export default function MobileBar({ view, onChange, busy = false }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-20 h-12 flex border-t bg-white"
      style={{ borderColor: T.line }}
      aria-label="Workspace views"
    >
      {VIEWS.map((v) => {
        const active = view === v.key;
        return (
          <button
            key={v.key}
            type="button"
            onClick={() => onChange(v.key)}
            aria-current={active ? "page" : undefined}
            className="relative flex-1 flex items-center justify-center gap-2 text-[12.5px]"
            style={{ ...sans, color: active ? T.ink : T.black, opacity: active ? 1 : 0.55, fontWeight: active ? 600 : 400 }}
          >
            <v.icon size={15} aria-hidden="true" /> {v.label}
            {v.key === "panel" && busy && (
              <span className="absolute top-2.5 right-1/4 w-1.5 h-1.5 rounded-full" style={{ background: T.inkSoft }} aria-label="analysis running" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
