import { useState } from "react";
import { Archive, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { T, sans } from "../styles/tokens";

const PROJECT_MENU = [
  { label: "Rename", icon: Pencil },
  { label: "Archive", icon: Archive },
  { label: "Delete", icon: Trash2 },
];

/* Left rail listing the user's research projects. */
export default function Sidebar({ projects, summaries = {}, activeId, onSelectProject, onNewProject }) {
  const [menuFor, setMenuFor] = useState(null);

  return (
    <aside className="w-64 border-r bg-white shrink-0 hidden md:flex flex-col" style={{ borderColor: T.line }} aria-label="Projects">
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <span className="text-[13px] uppercase tracking-wide" style={{ ...sans, color: T.black, opacity: 0.45 }}>Projects</span>
      </div>
      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={onNewProject}
          className="w-full flex items-center gap-2 px-3 py-2 text-[13px] border"
          style={{ borderColor: T.line, ...sans, color: T.ink }}
        >
          <Plus size={14} aria-hidden="true" /> New Project
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-2">
        {projects.map((p) => {
          const active = p.id === activeId;
          return (
            <div
              key={p.id}
              onClick={() => onSelectProject(p.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectProject(p.id); } }}
              aria-current={active ? "true" : undefined}
              className="group relative px-3 py-3 mb-1 cursor-pointer border-l-2"
              style={{ borderColor: active ? T.ink : "transparent", background: active ? T.softBlue : "transparent" }}
            >
              <div className="flex items-start justify-between">
                <p className="text-[13.5px] leading-snug pr-4" style={{ ...sans, color: T.black, fontWeight: active ? 600 : 400 }}>{p.name}</p>
                <button
                  type="button"
                  aria-label={`Project options for ${p.name}`}
                  onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === p.id ? null : p.id); }}
                  className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <MoreHorizontal size={14} style={{ color: T.black, opacity: 0.4 }} />
                </button>
              </div>
              <p className="text-[11.5px] mt-1" style={{ ...sans, color: T.black, opacity: 0.5 }}>
                {summaries[p.id]?.status ?? "Draft"} · {summaries[p.id]?.fileCount ?? 0} files
              </p>
              {menuFor === p.id && (
                <div className="absolute right-2 top-9 bg-white border z-10 w-36" style={{ borderColor: T.line }} role="menu">
                  {PROJECT_MENU.map(({ label, icon: Icon }) => (
                    <button
                      key={label}
                      type="button"
                      role="menuitem"
                      onClick={(e) => { e.stopPropagation(); setMenuFor(null); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] hover:bg-cream text-left"
                      style={{ ...sans, color: label === "Delete" ? T.warn : T.black }}
                    >
                      <Icon size={12.5} aria-hidden="true" /> {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
