import { useEffect, useRef, useState } from "react";
import { Loader2, MessageSquare, Send, X } from "lucide-react";
import { T, serif, sans } from "../styles/tokens";

/*
  Context-aware AI discussion about one analysis topic (e.g. gaps, novelty).
  Replies are canned `followups` until the chat API exists (Phase 3/4).
*/
export default function ChatPanel({ title, seed, followups, onClose }) {
  const [messages, setMessages] = useState(seed);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  function send() {
    const text = input.trim();
    if (!text || loading) return;
    const userTurns = messages.filter((m) => m.role === "user").length;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      const reply = followups[Math.min(userTurns - 1, followups.length - 1)] || followups[0];
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
      setLoading(false);
    }, 1100);
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
          return (
            <div key={i} className={isUser ? "flex justify-end" : "flex justify-start"}>
              <div className="max-w-[85%]">
                <p className="text-[10.5px] mb-1 uppercase tracking-wide" style={{ ...sans, color: T.black, opacity: 0.4, textAlign: isUser ? "right" : "left" }}>
                  {isUser ? "You" : "REbud"}
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
      </div>

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
