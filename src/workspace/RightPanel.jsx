import { AlertTriangle, Loader2, RotateCcw, Sparkles } from "lucide-react";
import ChatPanel from "./ChatPanel";
import { TABS } from "./config";
import {
  CritiqueSection, GapsSection, NoveltySection, OverviewSection,
  RelatedSection, RelevanceSection, SuggestionsSection,
} from "./sections";
import { T, sans } from "../styles/tokens";

const SECTION_LABEL = Object.fromEntries(TABS.map((t) => [t.key, t.label]));

function Notice({ icon: Icon, iconColor, children }) {
  return (
    <div className="text-center py-14 px-4">
      <Icon size={20} style={{ color: iconColor ?? T.black, opacity: iconColor ? 1 : 0.25 }} className="mx-auto mb-3" aria-hidden="true" />
      {children}
    </div>
  );
}

function NoDocuments() {
  return (
    <Notice icon={Sparkles}>
      <p className="text-[13px]" style={{ ...sans, color: T.black, opacity: 0.55 }}>
        Upload documents and run an analysis to populate this panel.
      </p>
    </Notice>
  );
}

function NotRun({ section }) {
  return (
    <Notice icon={Sparkles}>
      <p className="text-[13px]" style={{ ...sans, color: T.black, opacity: 0.55 }}>
        {SECTION_LABEL[section] ?? "This module"} hasn't been analysed for this project yet.
      </p>
      <p className="text-[12px] mt-1.5" style={{ ...sans, color: T.black, opacity: 0.45 }}>
        Choose an action under Research Intelligence to run it.
      </p>
    </Notice>
  );
}

function Running({ section }) {
  return (
    <Notice icon={Loader2} iconColor={T.inkSoft}>
      <p className="text-[13px]" style={{ ...sans, color: T.black, opacity: 0.6 }} role="status">
        Analysing {SECTION_LABEL[section]?.toLowerCase() ?? "this module"}…
      </p>
      <p className="text-[12px] mt-1.5" style={{ ...sans, color: T.black, opacity: 0.45 }}>
        Reading the uploaded documents and drafting findings.
      </p>
    </Notice>
  );
}

function Failed({ error, onRetry }) {
  return (
    <Notice icon={AlertTriangle} iconColor={T.warn}>
      <p className="text-[13px]" style={{ ...sans, color: T.warn }} role="alert">Analysis couldn't be completed.</p>
      <p className="text-[12px] mt-1.5 leading-relaxed" style={{ ...sans, color: T.black, opacity: 0.6 }}>{error}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 border text-[12.5px]"
        style={{ borderColor: T.ink, color: T.ink, ...sans }}
      >
        <RotateCcw size={12} aria-hidden="true" /> Try again
      </button>
    </Notice>
  );
}

function SectionView({ section, data, onOpenChat }) {
  switch (section) {
    case "gaps": return <GapsSection data={data} onOpenChat={() => onOpenChat("gaps")} />;
    case "novelty": return <NoveltySection data={data} onOpenChat={() => onOpenChat("novelty")} />;
    case "critique": return <CritiqueSection data={data} />;
    case "relevance": return <RelevanceSection data={data} />;
    case "related": return <RelatedSection data={data} />;
    case "suggestions": return <SuggestionsSection data={data} />;
    case "overview":
    default: return <OverviewSection data={data} />;
  }
}

/*
  Right-hand intelligence panel. Shows tabbed analysis sections, each
  driven by its module record { status, data, error }, or a ChatPanel when
  a discussion is open. `chat` is a CHAT_TOPICS entry or null.
*/
export default function RightPanel({ section, onSelectSection, analysis, hasFiles, onRetry, chat, onOpenChat, onCloseChat, mobileVisible = false }) {
  const module = analysis?.[section] ?? { status: "idle" };

  function renderBody() {
    if (!hasFiles && module.status !== "done") return <NoDocuments />;
    if (module.status === "running") return <Running section={section} />;
    if (module.status === "error") return <Failed error={module.error} onRetry={() => onRetry(section)} />;
    if (module.status === "done") return <SectionView section={section} data={module.data} onOpenChat={onOpenChat} />;
    return <NotRun section={section} />;
  }

  return (
    <aside
      className={`${mobileVisible ? "flex" : "hidden"} md:flex w-full md:w-[380px] min-h-0 flex-1 md:flex-none border-l bg-white shrink-0 flex-col pb-12 md:pb-0`}
      style={{ borderColor: T.line }}
      aria-label="Research intelligence"
    >
      {chat ? (
        <ChatPanel key={chat.title} title={chat.title} seed={chat.seed} followups={chat.followups} onClose={onCloseChat} />
      ) : (
        <>
          <div className="flex border-b overflow-x-auto shrink-0" style={{ borderColor: T.line }} role="tablist">
            {TABS.map((t) => {
              const active = section === t.key;
              const status = analysis?.[t.key]?.status;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSelectSection(t.key)}
                  className="relative flex items-center gap-1.5 px-3 py-3 text-[12px] shrink-0 border-b-2"
                  style={{ borderColor: active ? T.ink : "transparent", ...sans, color: T.black, opacity: active ? 1 : 0.5 }}
                >
                  <t.icon size={13} aria-hidden="true" /> {t.label}
                  {status === "running" && <Loader2 size={10} className="animate-spin" style={{ color: T.inkSoft }} aria-label="running" />}
                  {status === "error" && <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.warn }} aria-label="failed" />}
                </button>
              );
            })}
          </div>
          <div className="flex-1 overflow-y-auto p-4" role="tabpanel">
            {renderBody()}
          </div>
        </>
      )}
    </aside>
  );
}
