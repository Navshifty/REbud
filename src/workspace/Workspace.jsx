import { useState } from "react";
import TopNav from "./TopNav";
import Sidebar from "./Sidebar";
import CentralWorkspace from "./CentralWorkspace";
import RightPanel from "./RightPanel";
import ProjectDialog from "./ProjectDialog";
import ConfirmDialog from "../components/ConfirmDialog";
import Button from "../components/Button";
import { useWorkspace } from "./state/useWorkspace";
import { CHAT_TOPICS } from "../data/mockData";
import { T, serif, sans } from "../styles/tokens";

/*
  Workspace root. State and side effects live in useWorkspace; this
  component composes the layout and holds transient UI state: selected
  tab, open chat topic, search query and which dialog is open.

  dialog: null | { kind: "create" } | { kind: "edit", project } | { kind: "delete", project }
*/
export default function Workspace({ go }) {
  const ws = useWorkspace();
  const [section, setSection] = useState("overview");
  const [chatTopic, setChatTopic] = useState(null); // key into CHAT_TOPICS
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState(null);

  const closeDialog = () => setDialog(null);

  function selectProject(id) {
    ws.selectProject(id);
    setChatTopic(null);
  }

  function runAction(action) {
    setSection(action.section);
    setChatTopic(null);
    ws.runModules(action.modules);
  }

  function handleDialogSubmit(values) {
    if (dialog?.kind === "edit") ws.updateProject(dialog.project.id, values);
    else ws.createProject(values);
    closeDialog();
  }

  function confirmDelete() {
    ws.deleteProject(dialog.project.id);
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

  const sidebarProps = {
    projects: ws.projects,
    summaries: ws.summaries,
    activeId: ws.activeProjectId,
    query,
    onSelectProject: selectProject,
    onNewProject: () => setDialog({ kind: "create" }),
    onEditProject: (project) => setDialog({ kind: "edit", project }),
    onArchiveProject: (project, archived) => ws.setArchived(project.id, archived),
    onDeleteProject: (project) => setDialog({ kind: "delete", project }),
  };

  if (!ws.activeProject) {
    return (
      <div className="h-screen flex flex-col" style={{ ...sans }}>
        <TopNav project={null} projects={ws.projects} onSelectProject={selectProject} go={go} query={query} onQueryChange={setQuery} />
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
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ ...sans }}>
      <TopNav
        project={ws.activeProject}
        projects={ws.projects.filter((p) => !p.archived)}
        onSelectProject={selectProject}
        go={go}
        query={query}
        onQueryChange={setQuery}
      />
      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        <Sidebar {...sidebarProps} />
        <CentralWorkspace
          project={ws.activeProject}
          summary={ws.activeSummary}
          files={ws.files}
          setFiles={ws.setFiles}
          running={ws.isRunning}
          onRun={runAction}
          onEditProject={() => setDialog({ kind: "edit", project: ws.activeProject })}
        />
        <RightPanel
          section={section}
          onSelectSection={setSection}
          analysis={ws.analysis}
          hasFiles={ws.files.length > 0}
          onRetry={(module) => ws.runModules([module])}
          chat={chatTopic ? CHAT_TOPICS[chatTopic] : null}
          onOpenChat={setChatTopic}
          onCloseChat={() => setChatTopic(null)}
        />
      </div>
      {dialogs}
    </div>
  );
}
