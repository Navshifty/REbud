import { T, serif, sans } from "../styles/tokens";

/* Heading for an analysis panel section, with icon and optional caveat note. */
export default function PanelHeading({ icon: Icon, title, note }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        {Icon ? <Icon size={15} style={{ color: T.inkSoft }} aria-hidden="true" /> : null}
        <h3 className="text-[14.5px]" style={{ ...serif, color: T.black }}>{title}</h3>
      </div>
      {note && (
        <p className="text-[11.5px] mt-1.5 leading-relaxed" style={{ ...sans, color: T.black, opacity: 0.55 }}>{note}</p>
      )}
    </div>
  );
}
