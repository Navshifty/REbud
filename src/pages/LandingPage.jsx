import { Fragment } from "react";
import { ArrowRight, ClipboardList, FileText, GitBranch, ScanSearch, Shield, Target } from "lucide-react";
import Button from "../components/Button";
import { T, serif, sans, mono } from "../styles/tokens";

const PIPELINE_STEPS = ["Research Paper / Proposal", "REbud Analysis", "Evidence", "Gaps", "Novelty", "Recommendations"];

const CAPABILITIES = [
  { icon: FileText, title: "Paper Analysis", body: "Surface a paper's core claims, method, and evidentiary support in a structured read." },
  { icon: ClipboardList, title: "Proposal Analysis", body: "Evaluate a research proposal against its stated problem and objectives." },
  { icon: ScanSearch, title: "Research Gap Detection", body: "Identify what the surrounding literature has not yet addressed." },
  { icon: Target, title: "Novelty Assessment", body: "Estimate how a proposed contribution sits against existing work, with reasoning." },
  { icon: Shield, title: "Critical Analysis", body: "Question assumptions, method choices, and unsupported claims directly." },
  { icon: GitBranch, title: "Evidence & Recommendations", body: "Ground findings in cited material and suggest concrete next steps." },
];

/* Public marketing/landing screen. `go(view)` navigates between top-level views. */
export default function LandingPage({ go }) {
  return (
    <div style={{ background: T.cream, minHeight: "100vh" }}>
      <nav className="flex items-center justify-between px-6 md:px-10 py-6 border-b" style={{ borderColor: T.line }}>
        <span className="text-[19px] tracking-tight" style={{ ...serif, color: T.ink }}>REbud</span>
        <div className="flex items-center gap-5 md:gap-8">
          <a href="#capabilities" className="hidden sm:inline text-[13.5px]" style={{ ...sans, color: T.black, opacity: 0.7 }}>Capabilities</a>
          <a href="#method" className="hidden sm:inline text-[13.5px]" style={{ ...sans, color: T.black, opacity: 0.7 }}>Method</a>
          <Button onClick={() => go("login")}>Get Started</Button>
        </div>
      </nav>

      <header className="px-6 md:px-10 pt-14 md:pt-20 pb-16 md:pb-24 max-w-[1180px] mx-auto grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-7">
          <p className="text-[13px] mb-5" style={{ ...sans, color: T.inkSoft }}>A research intelligence workbench</p>
          <h1 className="text-[38px] md:text-[52px] leading-[1.08] mb-8" style={{ ...serif, color: T.black, maxWidth: "12ch" }}>
            Research intelligence for ideas that want to become research.
          </h1>
          <p className="text-[16.5px] leading-[1.65] mb-10" style={{ ...sans, color: T.black, opacity: 0.75, maxWidth: "56ch" }}>
            REbud helps researchers move beyond simply finding papers. It reads your literature and
            proposals, identifies gaps, questions assumptions, evaluates novelty, and helps you
            strengthen a proposal before it goes to review.
          </p>
          <div className="flex items-center flex-wrap gap-4">
            <Button onClick={() => go("login")}>Get Started <ArrowRight size={15} /></Button>
            <Button variant="secondary" onClick={() => go("login")}>Explore REbud</Button>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-5 flex items-start justify-end pt-3">
          <div className="w-full p-6 border" style={{ borderColor: T.line, background: "white" }}>
            <p className="text-[11.5px] mb-4" style={{ ...sans, color: T.black, opacity: 0.5 }}>Cortical Visual Prosthesis — sample finding</p>
            <p className="text-[14.5px] leading-[1.6] mb-4" style={{ ...serif, color: T.black }}>
              "Temporal reasoning is insufficiently addressed."
            </p>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[10.5px] uppercase tracking-wide" style={{ ...sans, color: T.black, opacity: 0.45 }}>Severity</p>
                <p className="text-[13px] mt-0.5" style={{ ...sans, color: T.warn }}>High</p>
              </div>
              <div>
                <p className="text-[10.5px] uppercase tracking-wide" style={{ ...sans, color: T.black, opacity: 0.45 }}>Confidence</p>
                <p className="text-[13px] mt-0.5" style={{ ...mono, color: T.black }}>87%</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section id="method" className="px-6 md:px-10 py-16 border-t" style={{ borderColor: T.line, background: T.softBlue }}>
        <div className="max-w-[1180px] mx-auto">
          <p className="text-[13px] mb-8" style={{ ...sans, color: T.inkSoft }}>How a document becomes an assessment</p>
          <div className="flex items-center flex-wrap gap-y-4">
            {PIPELINE_STEPS.map((s, i) => (
              <Fragment key={s}>
                <div className="px-4 py-2.5 border bg-white text-[13.5px]" style={{ borderColor: T.softBlueLine, ...sans, color: T.black }}>{s}</div>
                {i < PIPELINE_STEPS.length - 1 && <ArrowRight size={16} className="mx-3" style={{ color: T.inkSoft }} aria-hidden="true" />}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      <section id="capabilities" className="px-6 md:px-10 py-20 max-w-[1180px] mx-auto">
        <p className="text-[13px] mb-2" style={{ ...sans, color: T.inkSoft }}>V1 capabilities</p>
        <h2 className="text-[28px] mb-12" style={{ ...serif, color: T.black }}>What REbud does today</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
          {CAPABILITIES.map((c) => (
            <div key={c.title}>
              <c.icon size={20} style={{ color: T.ink }} strokeWidth={1.6} aria-hidden="true" />
              <h3 className="text-[16.5px] mt-4 mb-2" style={{ ...serif, color: T.black }}>{c.title}</h3>
              <p className="text-[13.5px] leading-[1.6]" style={{ ...sans, color: T.black, opacity: 0.68 }}>{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-6 md:px-10 py-10 border-t flex items-center justify-between" style={{ borderColor: T.line }}>
        <span className="text-[13px]" style={{ ...serif, color: T.ink }}>REbud</span>
        <span className="text-[12px]" style={{ ...sans, color: T.black, opacity: 0.5 }}>Research intelligence workbench — V1</span>
      </footer>
    </div>
  );
}
