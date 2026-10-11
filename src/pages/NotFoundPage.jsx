import { Link } from "react-router-dom";
import Button from "../components/Button";
import { T, serif, sans } from "../styles/tokens";

/* Shown for any unmatched URL. */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6" style={{ background: T.cream }}>
      <p className="text-[13px] mb-3" style={{ ...sans, color: T.inkSoft }}>404</p>
      <h1 className="text-[26px] mb-2" style={{ ...serif, color: T.black }}>This page doesn&rsquo;t exist</h1>
      <p className="text-[13.5px] mb-7 max-w-[44ch]" style={{ ...sans, color: T.black, opacity: 0.65 }}>
        The link may be out of date, or the project may have been deleted.
      </p>
      <Link to="/">
        <Button>Back to REbud</Button>
      </Link>
    </div>
  );
}
