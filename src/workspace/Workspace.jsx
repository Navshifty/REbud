import { useState } from "react";
import TopNav from "./TopNav";
import Sidebar from "./Sidebar";
import CentralWorkspace from "./CentralWorkspace";
import RightPanel from "./RightPanel";
import { useWorkspace } from "./state/useWorkspace";
import { CHAT_TOPICS } from "../data/mockData";
import { sans } from "../styles/tokens";

/*
  Workspace root. State and side effects live in useWorkspace; this
  component only composes the layout and holds transient UI state
  (selected tab, open chat topic).
*/
export default function Workspace({ go }) {
  const ws = useWorkspace();
  const [section, setSection] = useState("overview");
  const [chatTopic, setChatTopic] = useState(null); // key into CHAT_TOPICS

  function selectProject(id) {
    ws.selectProject(id);
    setChatTopic(null);
  }

  function runAction(action) {
    setSection(action.section);
    setChatTopic(null);
    ws.runModules(action.modules);
  }

  function retryModule(module) {
    ws.runModules([module]);
  }

  if (!ws.activeProject) {
    return (
      <div className="h-screen flex flex-col" style={{ ...sans }}>
        <TopNav project={null} projects={ws.projects} onSelectProject={selectProject} go={go} />
        <div className="flex-1 flex items-center justify-center text-[13.5px] opacity-60">
          Create a project to get started.
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ ...sans }}>
      <TopNav project={ws.activeProject} projects={ws.projects} onSelectProject={selectProject} go={go} />
      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        <Sidebar
          projects={ws.projects}
          summaries={ws.summaries}
          activeId={ws.activeProjectId}
          onSelectProject={selectProject}
          onNewProject={() => ws.createProject({ name: "Untitled project" })}
        />
        <CentralWorkspace
          project={ws.activeProject}
          summary={ws.activeSummary}
          files={ws.files}
          setFiles={ws.setFiles}
          running={ws.isRunning}
          onRun={runAction}
        />
        <RightPanel
          section={section}
          onSelectSection={setSection}
          analysis={ws.analysis}
          hasFiles={ws.files.length > 0}
          onRetry={retryModule}
          chat={chatTopic ? CHAT_TOPICS[chatTopic] : null}
          onOpenChat={setChatTopic}
          onCloseChat={() => setChatTopic(null)}
        />
      </div>
    </div>
  );
}
