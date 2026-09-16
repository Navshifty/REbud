import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, FolderOpen, Search, Settings } from "lucide-react";
import { T, serif, sans } from "../styles/tokens";

/* Workspace header: brand, project switcher, global search, notifications, avatar. */
export default function TopNav({ project, projects, onSelectProject, go, userInitials = "NK" }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the project dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <header className="h-14 flex items-center justify-between px-4 md:px-5 border-b bg-white shrink-0" style={{ borderColor: T.line }}>
      <div className="flex items-center gap-4 md:gap-6 min-w-0">
        <button type="button" className="text-[17px] cursor-pointer" style={{ ...serif, color: T.ink }} onClick={() => go("landing")}>
          REbud
        </button>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="flex items-center gap-2 px-3 py-1.5 border text-[13px] max-w-[220px]"
            style={{ borderColor: T.line, ...sans, color: T.black }}
          >
            <FolderOpen size={14} style={{ color: T.inkSoft }} aria-hidden="true" />
            <span className="truncate">{project.name}</span>
            <ChevronDown size={13} aria-hidden="true" />
          </button>
          {open && (
            <ul role="listbox" className="absolute top-full mt-1 left-0 w-64 bg-white border z-20" style={{ borderColor: T.line }}>
              {projects.map((p) => (
                <li
                  key={p.id}
                  role="option"
                  aria-selected={p.id === project.id}
                  onClick={() => { onSelectProject(p.id); setOpen(false); }}
                  className="px-3.5 py-2.5 text-[13px] cursor-pointer hover:bg-cream"
                  style={{ ...sans, color: T.black, fontWeight: p.id === project.id ? 600 : 400 }}
                >
                  {p.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="hidden md:flex items-center gap-1 flex-1 max-w-md mx-8">
        <div className="w-full flex items-center gap-2 px-3 py-1.5 border" style={{ borderColor: T.line }}>
          <Search size={14} style={{ color: T.black, opacity: 0.4 }} aria-hidden="true" />
          <input
            type="search"
            aria-label="Search projects, papers, findings"
            placeholder="Search projects, papers, findings…"
            className="w-full text-[13px] outline-none bg-transparent"
            style={{ ...sans, color: T.black }}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button type="button" aria-label="Notifications"><Bell size={17} style={{ color: T.black, opacity: 0.6 }} /></button>
        <button type="button" aria-label="Settings"><Settings size={17} style={{ color: T.black, opacity: 0.6 }} /></button>
        <div className="w-7 h-7 flex items-center justify-center rounded-full" style={{ background: T.ink }} aria-label="Account">
          <span className="text-[11px] text-white" style={{ ...sans }}>{userInitials}</span>
        </div>
      </div>
    </header>
  );
}
