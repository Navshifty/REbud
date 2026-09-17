import { useState } from "react";
import { AlertTriangle, Loader2, RotateCcw, X } from "lucide-react";
import TopNav from "./TopNav";
import Sidebar from "./Sidebar";
import CentralWorkspace from "./CentralWorkspace";
import RightPanel from "./RightPanel";
import MobileBar from "./MobileBar";
import ProjectDialog from "./ProjectDialog";
import ConfirmDialog from "../components/ConfirmDialog";
import Button from "../components/Button";
import { useWorkspace } from "./state/useWorkspace";
import { CHAT_SEEDS } from "../services/chatService";
import { T, serif, sans } from "../styles/tokens";

/*
  Workspace root. Data and side effects live in useWorkspace; this
  component composes the layout and holds transient UI state: selected
  tab, open chat topic, search query, open dialog, and the phone-only
  layout state (sidebar drawer, which column is visible).

  dialog: null | { kind: "create" } | { kind: "edit", project } | { kind: "delete", project }
*/
export default function Workspace({ go, user, onSignOut }) {
  const ws = useWorkspace();
  const [section, setSection] = useState("overview");
  const [chatTopic, setChatTopic] = useState(null); // key into CHAT_SEEDS
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // phone drawer
  const [mobileView, setMobileView] = useState("main"); // "main" | "panel"

  const closeDialog = () => setDialog(null);

  function selectProject(id) {
    ws.selectProject(id);
    setChatTopic(null);
    setSidebarOpen(false);
    setMobileView("main");
  }

  function runAction(action) {
    setSection(action.section);
    setChatTopic(null);
    setMobileView("panel");
    ws.runModules(action.modules);
  }

  async function handleDialogSubmit(values) {
    if (dialog?.kind === "edit") await ws.updateProject(dialog.project.id, values);
    else await ws.createProject(values);
    closeDialog();
    setSidebarOpen(false);
  }

  async function confirmDelete() {
    await ws.deleteProject(dialog.project.id);
    closeDialog();
  }

  const dialogs = (
    <>
      {(dialog?.kind === "create" || dialog?.kind === "edit") && (
        <ProjectDialog project={dialog.kind === "edit" ? dialog.project : null} onSubmit={handleDialogSubmit} onClose={closeDialog} />
      )}
      {dialog?.kind === "delete" && (
        <ConfirmDialog
          title="Delete project?"
          message={`"${dialog.project.name}" and its ${ws.summaries[dialog.project.id]?.fileCount ?? 0} document(s) and analysis results will be removed. This can't be undone.`}
          confirmLabel="Delete project"
          danger
          onConfirm={confirmDelete}
          onCancel={closeDialog}
        />
      )}
    </>
  );

  const errorBanner = ws.lastError && (
    <div
      role="alert"
      className="fixed bottom-14 md:bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[92vw] md:max-w-md flex items-start gap-2 px-4 py-3 border bg-white shadow-lg"
      style={{ borderColor: T.warn }}
    >
      <AlertTriangle size={15} className="mt-0.5 shrink-0" style={{ color: T.warn }} aria-hidden="true" />
      <p className="text-[12.5px] leading-relaxed flex-1" style={{ ...sans, color: T.black }}>{ws.lastError}</p>
      <button type="button" aria-label="Dismiss" onClick={ws.dismissError}><X size={14} style={{ color: T.black, opacity: 0.5 }} /></button>
    </div>
  );

  const sidebarProps = {
    projects: ws.projects,
    summaries: ws.summaries,
    activeId: ws.activeProjectId,
    query,
    mobileOpen: sidebarOpen,
    onCloseMobile: () => setSidebarOpen(false),
    onSelectProject: selectProject,
    onNewProject: () => setDialog({ kind: "create" }),
    onEditProject: (project) => setDialog({ kind: "edit", project }),
    onArchiveProject: (project, archived) => ws.setArchived(project.id, archived),
    onDeleteProject: (project) => setDialog({ kind: "delete", project }),
  };

  const topNavProps = {
    projects: ws.projects.filter((p) => !p.archived),
    onSelectProject: selectProject,
    go,
    query,
    onQueryChange: setQuery,
    onToggleSidebar: () => setSidebarOpen((v) => !v),
    user,
    onSignOut,
  };

  /* ---- loading / failed to load ---------------------------------------- */

  if (ws.status !== "ready") {
    return (
      <div className="h-screen flex flex-col" style={{ ...sans }}>
        <TopNav project={null} {...topNavProps} projects={[]} />
        <main className="flex-1 flex flex-col items-center justify-center text-center px-6" style={{ background: T.cream }}>
          {ws.status === "loading" ? (
            <div className="flex items-center gap-2" role="status">
              <Loader2 size={16} className="animate-spin" style={{ color: T.inkSoft }} aria-hidden="true" />
              <span className="text-[13.5px]" style={{ color: T.black, opacity: 0.6 }}>Loading your projects…</span>
            </div>
          ) : (
            <>
              <AlertTriangle size={20} style={{ color: T.warn }} className="mb-3" aria-hidden="true" />
              <h1 className="text-[20px] mb-2" style={{ ...serif, color: T.black }}>Couldn't load your workspace</h1>
              <p className="text-[13.5px] mb-6 max-w-[48ch]" style={{ color: T.black, opacity: 0.65 }}>{ws.error}</p>
              <Button variant="secondary" onClick={ws.retryLoad}><RotateCcw size={14} /> Try again</Button>
            </>
          )}
        </main>
      </div>
    );
  }

  /* ---- no projects ----------------------------------------------------- */

  if (!ws.activeProject) {
    return (
      <div className="h-screen flex flex-col" style={{ ...sans }}>
        <TopNav project={null} {...topNavProps} />
        <div className="flex flex-1 min-h-0">
          <Sidebar {...sidebarProps} />
          <main className="flex-1 flex flex-col items-center justify-center text-center px-6" style={{ background: T.cream }}>
            <h1 className="text-[22px] mb-2" style={{ ...serif, color: T.black }}>No projects yet</h1>
            <p className="text-[13.5px] mb-6 max-w-[42ch]" style={{ ...sans, color: T.black, opacity: 0.65 }}>
              Create a project to upload papers and proposals and start analysing them.
            </p>
            <Button onClick={() => setDialog({ kind: "create" })}>New Project</Button>
          </main>
        </div>
        {dialogs}
        {errorBanner}
      </div>
    );
  }

  /* ---- workspace ------------------------------------------------------- */

  return (
    <div className="h-screen flex flex-col" style={{ ...sans }}>
      <TopNav project={ws.activeProject} {...topNavProps} />
      <div className="flex flex-1 min-h-0">
        <Sidebar {...sidebarProps} />
        <CentralWorkspace
          project={ws.activeProject}
          summary={ws.activeSummary}
          files={ws.files}
          filesLoaded={ws.activeLoaded}
          onUpload={ws.uploadFiles}
          onRemoveFile={ws.removeFile}
          running={ws.isRunning}
          onRun={runAction}
          onEditProject={() => setDialog({ kind: "edit", project: ws.activeProject })}
          mobileHidden={mobileView === "panel"}
        />
        <RightPanel
          projectId={ws.activeProjectId}
          section={section}
          onSelectSection={setSection}
          analysis={ws.analysis}
          hasFiles={ws.files.length > 0}
          onRetry={(module) => ws.runModules([module])}
          chat={chatTopic ? { key: chatTopic, ...CHAT_SEEDS[chatTopic] } : null}
          onOpenChat={setChatTopic}
          onCloseChat={() => setChatTopic(null)}
          mobileVisible={mobileView === "panel"}
        />
      </div>
      <MobileBar view={mobileView} onChange={setMobileView} busy={ws.isRunning} />
      {dialogs}
      {errorBanner}
    </div>
  );
}
