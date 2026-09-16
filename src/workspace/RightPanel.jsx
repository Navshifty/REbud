import { Sparkles } from "lucide-react";
import ChatPanel from "./ChatPanel";
import { TABS } from "./config";
import {
  CritiqueSection, GapsSection, NoveltySection, OverviewSection,
  RelatedSection, RelevanceSection, SuggestionsSection,
} from "./sections";
import { T, sans } from "../styles/tokens";

function EmptyState() {
  return (
    <div className="text-center py-14">
      <Sparkles size={20} style={{ color: T.black, opacity: 0.25 }} className="mx-auto mb-3" aria-hidden="true" />
      <p className="text-[13px]" style={{ ...sans, color: T.black, opacity: 0.55 }}>
        Upload documents and run an analysis to populate this panel.
      </p>
    </div>
  );
}

function SectionView({ section, analysis, onOpenChat }) {
  switch (section) {
    case "gaps": return <GapsSection data={analysis.gaps} onOpenChat={() => onOpenChat("gaps")} />;
    case "novelty": return <NoveltySection data={analysis.novelty} onOpenChat={() => onOpenChat("novelty")} />;
    case "critique": return <CritiqueSection data={analysis.critique} />;
    case "relevance": return <RelevanceSection data={analysis.relevance} />;
    case "related": return <RelatedSection data={analysis.related} />;
    case "suggestions": return <SuggestionsSection data={analysis.suggestions} />;
    case "overview":
    default: return <OverviewSection data={analysis.overview} />;
  }
}

/*
  Right-hand intelligence panel. Shows tabbed analysis sections, or a
  ChatPanel when a discussion is open. `chat` is a CHAT_TOPICS entry or null.
*/
export default function RightPanel({ section, onSelectSection, analysis, hasFiles, chat, onOpenChat, onCloseChat }) {
  return (
    <aside className="w-full md:w-[380px] border-l bg-white shrink-0 flex flex-col" style={{ borderColor: T.line }} aria-label="Research intelligence">
      {chat ? (
        <ChatPanel key={chat.title} title={chat.title} seed={chat.seed} followups={chat.followups} onClose={onCloseChat} />
      ) : (
        <>
          <div className="flex border-b overflow-x-auto shrink-0" style={{ borderColor: T.line }} role="tablist">
            {TABS.map((t) => {
              const active = section === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSelectSection(t.key)}
                  className="flex items-center gap-1.5 px-3 py-3 text-[12px] shrink-0 border-b-2"
                  style={{ borderColor: active ? T.ink : "transparent", ...sans, color: T.black, opacity: active ? 1 : 0.5 }}
                >
                  <t.icon size={13} aria-hidden="true" /> {t.label}
                </button>
              );
            })}
          </div>
          <div className="flex-1 overflow-y-auto p-4" role="tabpanel">
            {!hasFiles || !analysis
              ? <EmptyState />
              : <SectionView section={section} analysis={analysis} onOpenChat={onOpenChat} />}
          </div>
        </>
      )}
    </aside>
  );
}
