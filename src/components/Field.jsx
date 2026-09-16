import { T, sans } from "../styles/tokens";

/* Labelled form field wrapper with optional inline error message. */
export default function Field({ label, error, children }) {
  return (
    <label className="block mb-4">
      <span className="block text-[12.5px] mb-1.5" style={{ color: T.black, ...sans, opacity: 0.75 }}>{label}</span>
      {children}
      {error ? (
        <span role="alert" className="block mt-1.5 text-[12px]" style={{ color: T.warn, ...sans }}>{error}</span>
      ) : null}
    </label>
  );
}
