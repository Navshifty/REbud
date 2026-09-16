import { BarChart3, BookOpen, ClipboardList, FileText, GitBranch, Lightbulb, ScanSearch, Shield, Target } from "lucide-react";

/* Maximum documents per project (mirrors the prototype's 20-file limit). */
export const MAX_FILES = 20;

/* Analysis actions the user can trigger from the central workspace.
   `section` is the right-panel tab that should open when the action runs. */
export const ACTIONS = [
  { key: "paper", label: "Analyze Paper", icon: FileText, section: "overview" },
  { key: "proposal", label: "Analyze Proposal", icon: ClipboardList, section: "overview" },
  { key: "gaps", label: "Find Research Gaps", icon: ScanSearch, section: "gaps" },
  { key: "novelty", label: "Evaluate Novelty", icon: Target, section: "novelty" },
  { key: "critique", label: "Critique Research Idea", icon: Shield, section: "critique" },
  { key: "related", label: "Find Related Research", icon: GitBranch, section: "related" },
  { key: "relevance", label: "Analyze Proposal Relevance", icon: BookOpen, section: "relevance" },
];

/* Tabs in the right-hand analysis panel, in display order. */
export const TABS = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "gaps", label: "Gaps", icon: ScanSearch },
  { key: "novelty", label: "Novelty", icon: Target },
  { key: "critique", label: "Critique", icon: Shield },
  { key: "relevance", label: "Relevance", icon: BookOpen },
  { key: "related", label: "Related", icon: GitBranch },
  { key: "suggestions", label: "Suggestions", icon: Lightbulb },
];
