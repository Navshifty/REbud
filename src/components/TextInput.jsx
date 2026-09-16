import { T, sans } from "../styles/tokens";

/* Plain text input styled to the REbud line/ink palette. Highlights in warn colour when `error` is set. */
export default function TextInput({ error, className = "", ...props }) {
  return (
    <input
      aria-invalid={error ? true : undefined}
      className={`w-full px-3.5 py-2.5 text-[14px] bg-white outline-none ${className}`}
      style={{
        border: `1px solid ${error ? T.warn : T.line}`,
        color: T.black,
        ...sans,
      }}
      {...props}
    />
  );
}
