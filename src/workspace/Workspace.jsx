import { useState } from "react";
import TopNav from "./TopNav";
import Sidebar from "./Sidebar";
import CentralWorkspace from "./CentralWorkspace";
import RightPanel from "./RightPanel";
import { CHAT_TOPICS, FILES_BY_PROJECT, MOCK_ANALYSIS, PROJECTS } from "../data/mockData";
import { sans } from "../styles/tokens";

const ANALYSIS_DURATION_MS = 1400;

/*
  Workspace root. Owns the active project, per-project document lists,
  the selected analysis section, open chat topic and running state.
  Data is mock for now; each piece of state maps to a future API call.
*/
export default function Workspace({ go }) {
  const [projectId, setProjectId] = useState(PROJECTS[0].id);
  const [filesByProject, setFilesByProject] = useState(FILES_BY_PROJECT);
  const [section, setSection] = useState("overview");
  const [chatTopic, setChatTopic] = useState(null); // key into CHAT_TOPICS
  const [running, setRunning] = useState(false);

  const project = PROJECTS.find((p) => p.id === projectId) ?? PROJECTS[0];
  const files = filesByProject[projectId] || [];
  const hasFiles = files.length > 0;

  // Update only the active project's file list; accepts a value or an updater fn.
  function setFiles(updater) {
    setFilesByProject((prev) => ({
      ...prev,
      [projectId]: typeof updater === "function" ? updater(prev[projectId] || []) : updater,
    }));
  }

  function selectProject(id) {
    setProjectId(id);
    setChatTopic(null);
  }

  function runAnalysis(action) {
    setSection(action.section);
    setChatTopic(null);
    setRunning(true);
    // Simulated analysis latency — replaced by the analysis API in Phase 3.
    setTimeout(() => setRunning(false), ANALYSIS_DURATION_MS);
  }

  return (
    <div className="h-screen flex flex-col" style={{ ...sans }}>
      <TopNav project={project} projects={PROJECTS} onSelectProject={selectProject} go={go} />
      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        <Sidebar projects={PROJECTS} activeId={projectId} onSelectProject={selectProject} onNewProject={() => {}} />
        <CentralWorkspace project={project} files={files} setFiles={setFiles} running={running} onRun={runAnalysis} />
        <RightPanel
          section={section}
          onSelectSection={setSection}
          analysis={MOCK_ANALYSIS}
          hasFiles={hasFiles}
          chat={chatTopic ? CHAT_TOPICS[chatTopic] : null}
          onOpenChat={setChatTopic}
          onCloseChat={() => setChatTopic(null)}
        />
      </div>
    </div>
  );
}
