import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, FolderOpen, LogOut, Menu, Search, Settings } from "lucide-react";
import { T, serif, sans } from "../styles/tokens";

function useOutsideClose(open, setOpen) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, setOpen]);
  return ref;
}

function initialsOf(user) {
  const name = user?.name?.trim();
  if (!name) return "?";
  const parts = name.split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/* Workspace header: brand, project switcher, project search, account menu. */
export default function TopNav({
  project, projects, onSelectProject, go, query = "", onQueryChange, onToggleSidebar, user, onSignOut,
}) {
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const projectsRef = useOutsideClose(projectsOpen, setProjectsOpen);
  const accountRef = useOutsideClose(accountOpen, setAccountOpen);

  return (
    <header className="h-14 flex items-center justify-between px-4 md:px-5 border-b bg-white shrink-0" style={{ borderColor: T.line }}>
      <div className="flex items-center gap-3 md:gap-6 min-w-0">
        {onToggleSidebar && (
          <button type="button" aria-label="Open projects" onClick={onToggleSidebar} className="md:hidden">
            <Menu size={18} style={{ color: T.black, opacity: 0.7 }} />
          </button>
        )}
        <button type="button" className="text-[17px] cursor-pointer" style={{ ...serif, color: T.ink }} onClick={() => go("landing")}>
          REbud
        </button>
        <div className="relative" ref={projectsRef}>
          <button
            type="button"
            onClick={() => setProjectsOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={projectsOpen}
            className="flex items-center gap-2 px-3 py-1.5 border text-[13px] max-w-[160px] sm:max-w-[220px]"
            style={{ borderColor: T.line, ...sans, color: T.black }}
          >
            <FolderOpen size={14} style={{ color: T.inkSoft }} aria-hidden="true" />
            <span className="truncate">{project?.name ?? "No project"}</span>
            <ChevronDown size={13} aria-hidden="true" />
          </button>
          {projectsOpen && (
            <ul role="listbox" className="absolute top-full mt-1 left-0 w-64 bg-white border z-20 max-h-72 overflow-y-auto" style={{ borderColor: T.line }}>
              {projects.length === 0 && (
                <li className="px-3.5 py-2.5 text-[12.5px]" style={{ ...sans, color: T.black, opacity: 0.5 }}>No projects yet</li>
              )}
              {projects.map((p) => (
                <li
                  key={p.id}
                  role="option"
                  aria-selected={p.id === project?.id}
                  onClick={() => { onSelectProject(p.id); setProjectsOpen(false); }}
                  className="px-3.5 py-2.5 text-[13px] cursor-pointer hover:bg-cream"
                  style={{ ...sans, color: T.black, fontWeight: p.id === project?.id ? 600 : 400 }}
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
            value={query}
            onChange={(e) => onQueryChange?.(e.target.value)}
            aria-label="Search projects"
            placeholder="Search projects…"
            className="w-full text-[13px] outline-none bg-transparent"
            style={{ ...sans, color: T.black }}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <button type="button" aria-label="Notifications" className="hidden sm:block"><Bell size={17} style={{ color: T.black, opacity: 0.6 }} /></button>
        <button type="button" aria-label="Settings" className="hidden sm:block"><Settings size={17} style={{ color: T.black, opacity: 0.6 }} /></button>
        <div className="relative" ref={accountRef}>
          <button
            type="button"
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={accountOpen}
            onClick={() => setAccountOpen((v) => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-full"
            style={{ background: T.ink }}
          >
            <span className="text-[11px] text-white" style={{ ...sans }}>{initialsOf(user)}</span>
          </button>
          {accountOpen && (
            <div role="menu" className="absolute right-0 top-full mt-1 w-56 bg-white border z-20" style={{ borderColor: T.line }}>
              <div className="px-3.5 py-3 border-b" style={{ borderColor: T.line }}>
                <p className="text-[13px] truncate" style={{ ...sans, color: T.black, fontWeight: 600 }}>{user?.name ?? "Signed in"}</p>
                <p className="text-[11.5px] truncate" style={{ ...sans, color: T.black, opacity: 0.55 }}>{user?.email}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => { setAccountOpen(false); onSignOut?.(); }}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 text-[12.5px] hover:bg-cream text-left"
                style={{ ...sans, color: T.black }}
              >
                <LogOut size={13} aria-hidden="true" /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
