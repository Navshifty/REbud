import { T, sans } from "../styles/tokens";

/*
  Primary action button.
  Variants: primary (ink fill), secondary (ink outline), ghost, danger.
  Defaults to type="button" so it never submits a form by accident;
  pass type="submit" explicitly where needed.
*/
export default function Button({ children, variant = "primary", className = "", type = "button", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[13.5px] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed";
  const variants = {
    primary: "text-white",
    secondary: "border",
    ghost: "",
    danger: "text-white",
  };
  const style =
    variant === "primary" ? { background: T.ink } :
    variant === "secondary" ? { borderColor: T.ink, color: T.ink } :
    variant === "danger" ? { background: T.warn } : {};

  return (
    <button type={type} className={`${base} ${variants[variant]} ${className}`} style={{ ...style, ...sans }} {...props}>
      {children}
    </button>
  );
}
