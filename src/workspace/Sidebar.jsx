import { useEffect, useRef, useState } from "react";
import { Archive, ArchiveRestore, ChevronDown, ChevronRight, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { T, sans } from "../styles/tokens";

function ProjectRow({ project, summary, active, onSelect, actions }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
      aria-current={active ? "true" : undefined}
      className="group relative px-3 py-3 mb-1 cursor-pointer border-l-2"
      style={{ borderColor: active ? T.ink : "transparent", background: active ? T.softBlue : "transparent" }}
    >
      <div className="flex items-start justify-between">
        <p className="text-[13.5px] leading-snug pr-4" style={{ ...sans, color: T.black, fontWeight: active ? 600 : 400 }}>{project.name}</p>
        <button
          type="button"
          aria-label={`Project options for ${project.name}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 focus:opacity-100"
          style={{ opacity: menuOpen ? 1 : undefined }}
        >
          <MoreHorizontal size={14} style={{ color: T.black, opacity: 0.4 }} />
        </button>
      </div>
      <p className="text-[11.5px] mt-1" style={{ ...sans, color: T.black, opacity: 0.5 }}>
        {summary?.status ?? "Draft"} · {summary?.fileCount ?? 0} files
      </p>
      {menuOpen && (
        <div ref={menuRef} className="absolute right-2 top-9 bg-white border z-10 w-40" style={{ borderColor: T.line }} role="menu">
          {actions.map(({ label, icon: Icon, onClick, danger }) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onClick(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] hover:bg-cream text-left"
              style={{ ...sans, color: danger ? T.warn : T.black }}
            >
              <Icon size={12.5} aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/*
  Left rail listing research projects. Active projects first; archived
  ones live in a collapsible group. `query` filters by name.
*/
export default function Sidebar({
  projects, summaries = {}, activeId, query = "",
  onSelectProject, onNewProject, onEditProject, onArchiveProject, onDeleteProject,
}) {
  const [showArchived, setShowArchived] = useState(false);
  const q = query.trim().toLowerCase();
  const matches = (p) => !q || p.name.toLowerCase().includes(q) || (p.objective ?? "").toLowerCase().includes(q);
  const active = projects.filter((p) => !p.archived && matches(p));
  const archived = projects.filter((p) => p.archived && matches(p));

  const actionsFor = (p) => p.archived
    ? [
        { label: "Unarchive", icon: ArchiveRestore, onClick: () => onArchiveProject(p, false) },
        { label: "Delete", icon: Trash2, onClick: () => onDeleteProject(p), danger: true },
      ]
    : [
        { label: "Edit", icon: Pencil, onClick: () => onEditProject(p) },
        { label: "Archive", icon: Archive, onClick: () => onArchiveProject(p, true) },
        { label: "Delete", icon: Trash2, onClick: () => onDeleteProject(p), danger: true },
      ];

  return (
    <aside className="w-64 border-r bg-white shrink-0 hidden md:flex flex-col" style={{ borderColor: T.line }} aria-label="Projects">
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <span className="text-[13px] uppercase tracking-wide" style={{ ...sans, color: T.black, opacity: 0.45 }}>Projects</span>
      </div>
      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={onNewProject}
          className="w-full flex items-center gap-2 px-3 py-2 text-[13px] border hover:bg-cream"
          style={{ borderColor: T.line, ...sans, color: T.ink }}
        >
          <Plus size={14} aria-hidden="true" /> New Project
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 pb-3">
        {active.length === 0 && (
          <p className="px-3 py-4 text-[12.5px]" style={{ ...sans, color: T.black, opacity: 0.5 }}>
            {q ? "No projects match your search." : "No active projects yet."}
          </p>
        )}
        {active.map((p) => (
          <ProjectRow
            key={p.id}
            project={p}
            summary={summaries[p.id]}
            active={p.id === activeId}
            onSelect={() => onSelectProject(p.id)}
            actions={actionsFor(p)}
          />
        ))}

        {archived.length > 0 && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              aria-expanded={showArchived}
              className="w-full flex items-center gap-1.5 px-3 py-2 text-[11.5px] uppercase tracking-wide"
              style={{ ...sans, color: T.black, opacity: 0.45 }}
            >
              {showArchived ? <ChevronDown size={12} aria-hidden="true" /> : <ChevronRight size={12} aria-hidden="true" />}
              Archived ({archived.length})
            </button>
            {showArchived && archived.map((p) => (
              <ProjectRow
                key={p.id}
                project={p}
                summary={summaries[p.id]}
                active={p.id === activeId}
                onSelect={() => onSelectProject(p.id)}
                actions={actionsFor(p)}
              />
            ))}
          </div>
        )}
      </nav>
    </aside>
  );
}
