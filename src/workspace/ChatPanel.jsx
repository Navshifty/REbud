import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, MessageSquare, Send, X } from "lucide-react";
import { sendMessage } from "../services/chatService";
import EvidenceList from "../components/EvidenceList";
import { T, serif, sans } from "../styles/tokens";

/*
  Context-aware AI discussion about one analysis topic for one project.
  Replies come from chatService (API or mock). Assistant messages carry
  `grounded` and `citations` so the UI can show which answers rest on the
  project's documents and quote the passages they rely on.
*/
export default function ChatPanel({ projectId, topic, title, seed = [], onClose }) {
  const [messages, setMessages] = useState(seed);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const scrollRef = useRef(null);

  // Keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  async function send(textOverride) {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;
    const history = [...messages, { role: "user", text }];
    setMessages(history);
    setInput("");
    setFollowUps([]);
    setLoading(true);
    setError(null);
    try {
      const result = await sendMessage(projectId, {
        topic,
        messages: history.map(({ role, text: t }) => ({ role, text: t })),
      });
      setMessages((m) => [...m, { ...result.message, grounded: result.grounded, source: result.source }]);
      setFollowUps(result.followUps ?? []);
    } catch (err) {
      setError(err.message || "Couldn't get a reply.");
    } finally {
      setLoading(false);
    }
  }

  function provenanceLabel(m) {
    if (m.source === "sample") return "sample reply";
    if (m.grounded === true) return "grounded in your documents";
    if (m.grounded === false) return "general knowledge";
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: T.line }}>
        <div className="flex items-center gap-2">
          <MessageSquare size={14} style={{ color: T.inkSoft }} aria-hidden="true" />
          <span className="text-[13.5px]" style={{ ...serif, color: T.black }}>{title}</span>
        </div>
        <button type="button" aria-label="Close discussion" onClick={onClose}>
          <X size={16} style={{ color: T.black, opacity: 0.5 }} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4" role="log" aria-live="polite">
        {messages.map((m, i) => {
          const isUser = m.role === "user";
          const label = isUser ? null : provenanceLabel(m);
          return (
            <div key={i} className={isUser ? "flex justify-end" : "flex justify-start"}>
              <div className="max-w-[88%]">
                <p className="text-[10.5px] mb-1 uppercase tracking-wide" style={{ ...sans, color: T.black, opacity: 0.4, textAlign: isUser ? "right" : "left" }}>
                  {isUser ? "You" : "REbud"}
                  {label && <span className="normal-case tracking-normal"> · {label}</span>}
                </p>
                <div
                  className="px-3.5 py-2.5 text-[12.5px] leading-relaxed"
                  style={{
                    ...sans,
                    color: T.black,
                    background: isUser ? T.softBlue : "white",
                    border: `1px solid ${isUser ? T.softBlueLine : T.line}`,
                  }}
                >
                  {m.text}
                  {!isUser && <EvidenceList evidence={m.citations} label="Cited passages" compact />}
                </div>
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex justify-start">
            <div className="px-3.5 py-2.5 border flex items-center gap-1.5" style={{ borderColor: T.line }}>
              <Loader2 size={12} className="animate-spin" style={{ color: T.inkSoft }} aria-hidden="true" />
              <span className="text-[12px]" style={{ ...sans, color: T.black, opacity: 0.5 }}>Thinking…</span>
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 px-3.5 py-2.5 border" style={{ borderColor: T.warn }} role="alert">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" style={{ color: T.warn }} aria-hidden="true" />
            <p className="text-[12px] leading-relaxed" style={{ ...sans, color: T.warn }}>{error}</p>
          </div>
        )}
      </div>

      {followUps.length > 0 && !loading && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
          {followUps.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              className="text-[11.5px] px-2.5 py-1 border text-left hover:bg-cream"
              style={{ ...sans, borderColor: T.softBlueLine, color: T.inkSoft }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <form
        className="p-3 border-t shrink-0"
        style={{ borderColor: T.line }}
        onSubmit={(e) => { e.preventDefault(); send(); }}
      >
        <div className="flex items-center gap-2 border px-3 py-2" style={{ borderColor: T.line }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a follow-up question…"
            aria-label="Ask a follow-up question"
            className="flex-1 text-[13px] outline-none bg-transparent"
            style={{ ...sans, color: T.black }}
          />
          <button type="submit" aria-label="Send" disabled={!input.trim() || loading} className="disabled:opacity-40">
            <Send size={15} style={{ color: T.ink }} />
          </button>
        </div>
      </form>
    </div>
  );
}
