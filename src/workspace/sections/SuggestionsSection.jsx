import { useState } from "react";
import { CheckCircle2, Circle, Lightbulb } from "lucide-react";
import PanelHeading from "../../components/PanelHeading";
import { T, sans } from "../../styles/tokens";

/* Actionable suggestions the researcher can tick off as they address them. */
export default function SuggestionsSection({ data }) {
  const [done, setDone] = useState([]);

  function toggle(id) {
    setDone((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  }

  return (
    <div>
      <PanelHeading icon={Lightbulb} title="Suggestions" />
      <div className="space-y-2">
        {data.map((s) => {
          const isDone = done.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              aria-pressed={isDone}
              className="w-full flex items-start gap-2.5 border bg-white px-3.5 py-3 cursor-pointer text-left"
              style={{ borderColor: T.softBlueLine, opacity: isDone ? 0.5 : 1 }}
            >
              {isDone
                ? <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: T.ok }} aria-hidden="true" />
                : <Circle size={15} className="mt-0.5 shrink-0" style={{ color: T.black, opacity: 0.3 }} aria-hidden="true" />}
              <div>
                <p className="text-[12.5px] leading-relaxed" style={{ ...sans, color: T.black, textDecoration: isDone ? "line-through" : "none" }}>{s.text}</p>
                <span className="text-[10.5px] mt-1 inline-block" style={{ ...sans, color: T.inkSoft }}>{s.tag}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
