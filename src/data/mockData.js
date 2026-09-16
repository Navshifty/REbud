/*
  Mock research data for the REbud frontend.

  Everything the workspace renders today comes from here. When the
  backend/AI pipeline exists, these shapes become the contract for the
  API responses, so keep fields descriptive and stable.

  Where relevant, records distinguish evidence pulled from uploaded
  documents (e.g. `evidence` citations) from model-generated
  interpretation (explanations, scores, suggestions).
*/

/* ---------------------------------------------------------------------- */
/*  PROJECTS & DOCUMENTS                                                   */
/* ---------------------------------------------------------------------- */

export const PROJECTS = [
  {
    id: "p1",
    name: "Cortical Visual Prosthesis",
    objective: "Exploring brain-aligned visual representation learning for cortical visual prostheses.",
    status: "In analysis",
    files: 8,
    gaps: 4,
    lastAnalysis: "2 hours ago",
  },
  {
    id: "p2",
    name: "Patient Context Intelligence",
    objective: "Modelling longitudinal patient context from ABHA health records for clinical decision support.",
    status: "Awaiting documents",
    files: 2,
    gaps: 0,
    lastAnalysis: "—",
  },
  {
    id: "p3",
    name: "REbud Architecture",
    objective: "Formalising the evaluation methodology behind REbud's own novelty scoring engine.",
    status: "Draft",
    files: 5,
    gaps: 2,
    lastAnalysis: "1 day ago",
  },
  {
    id: "p4",
    name: "New Research Idea",
    objective: "",
    status: "Empty",
    files: 0,
    gaps: 0,
    lastAnalysis: "—",
  },
];

export const FILES_BY_PROJECT = {
  p1: [
    { id: 1, name: "Nishimoto_2011_reconstruction.pdf", type: "PDF", size: "2.1 MB", status: "Processed" },
    { id: 2, name: "phosphene-mapping-review.pdf", type: "PDF", size: "1.4 MB", status: "Processed" },
    { id: 3, name: "proposal-draft-v3.docx", type: "DOCX", size: "88 KB", status: "Processed" },
    { id: 4, name: "electrode-array-notes.md", type: "MD", size: "12 KB", status: "Processed" },
    { id: 5, name: "cortical-mapping-data.csv", type: "CSV", size: "340 KB", status: "Processed" },
    { id: 6, name: "related-work-list.txt", type: "TXT", size: "4 KB", status: "Processed" },
    { id: 7, name: "van-Steveninck-2022.pdf", type: "PDF", size: "3.0 MB", status: "Processing" },
    { id: 8, name: "ethics-appendix.docx", type: "DOCX", size: "56 KB", status: "Processed" },
  ],
  p2: [
    { id: 1, name: "abha-schema-notes.md", type: "MD", size: "9 KB", status: "Processed" },
    { id: 2, name: "context-model-draft.docx", type: "DOCX", size: "40 KB", status: "Processed" },
  ],
  p3: [
    { id: 1, name: "novelty-scoring-spec.md", type: "MD", size: "18 KB", status: "Processed" },
    { id: 2, name: "evaluation-methodology.pdf", type: "PDF", size: "990 KB", status: "Processed" },
    { id: 3, name: "baseline-comparisons.csv", type: "CSV", size: "120 KB", status: "Processed" },
    { id: 4, name: "reviewer-feedback.txt", type: "TXT", size: "6 KB", status: "Processed" },
    { id: 5, name: "architecture-proposal.docx", type: "DOCX", size: "74 KB", status: "Processed" },
  ],
  p4: [],
};

/* ---------------------------------------------------------------------- */
/*  ANALYSIS MODULES                                                       */
/* ---------------------------------------------------------------------- */

export const OVERVIEW = {
  strength: 78,
  gap: 82,
  novelty: 72,
  relevance: 86,
  evidence: 79,
  findings: [
    "The proposal is well positioned relative to recent self-supervised encoding work, with a credible architectural contribution.",
    "Temporal stability of electrode-tissue interfaces is the most significant unaddressed risk to the central claim.",
    "Evidence for the core hypothesis is currently drawn from adjacent domains rather than direct prior demonstration.",
  ],
  critical: [
    "No non-learned baseline reported.",
    "Clinical validation pathway is undefined.",
  ],
  next: [
    "Add a classical encoding baseline to the evaluation plan.",
    "Draft an explicit, falsifiable primary hypothesis.",
    "Scope a pilot calibration protocol for 3–5 patients.",
  ],
};

export const GAPS = [
  {
    id: 1,
    title: "Temporal reasoning is insufficiently addressed.",
    explanation: "Reviewed work treats phosphene perception as a static mapping problem. None of the cited studies model how perception drifts as electrode-tissue interfaces change over months of implantation.",
    severity: "High",
    confidence: 87,
    evidence: ["Nishimoto_2011_reconstruction.pdf, §4.2", "phosphene-mapping-review.pdf, §2"],
  },
  {
    id: 2,
    title: "No baseline comparison against non-learned phosphene encodings.",
    explanation: "The proposal assumes a learned encoder outperforms hand-designed mappings, but no classical baseline is reported anywhere in the uploaded material.",
    severity: "Medium",
    confidence: 74,
    evidence: ["proposal-draft-v3.docx, §3"],
  },
  {
    id: 3,
    title: "Patient variability is mentioned but not operationalised.",
    explanation: "Individual differences in cortical topology are acknowledged in the introduction, but no method section addresses per-patient calibration.",
    severity: "Medium",
    confidence: 69,
    evidence: ["proposal-draft-v3.docx, §1", "electrode-array-notes.md"],
  },
  {
    id: 4,
    title: "Limited discussion of failure modes in low-electrode-count regimes.",
    explanation: "Most evaluation appears to assume high-density arrays; sparse-array behaviour is not characterised.",
    severity: "Low",
    confidence: 58,
    evidence: ["cortical-mapping-data.csv"],
  },
];

export const NOVELTY = {
  score: 72,
  verdict: "Moderate novelty",
  summary: "Architectural framing is fresh; the calibration mechanism needs more development to differentiate fully.",
  strengths: "Combines self-supervised alignment with a prosthetic decoding target in a way not yet common in the literature.",
  overlap: "Closely related to Okafor & Lindqvist (2024)'s encoder design.",
  needsDifferentiation: "Patient-specific calibration is asserted, not yet developed as a method.",
};

export const CRITIQUE = [
  { category: "Conceptual weaknesses", items: ["The link between 'brain-aligned' representations and improved patient outcomes is asserted rather than demonstrated."] },
  { category: "Methodological concerns", items: ["Evaluation relies on a single simulated-vision dataset; no clinical or behavioural validation is proposed.", "Cross-validation strategy is not specified for the calibration step."] },
  { category: "Missing assumptions", items: ["Assumes stable electrode placement over the study period without justification."] },
  { category: "Unsupported claims", items: ["“Significantly improves usable vision” is stated without an effect size or comparison baseline."] },
  { category: "Scope problems", items: ["The proposal spans encoding, calibration, and clinical deployment — any one of which could be a full study."] },
];

export const RELEVANCE = {
  problemRelevance: 81,
  questionAlignment: 76,
  methodAlignment: 68,
  expectedContribution: 74,
  missing: [
    "A clear falsifiable hypothesis connecting representation alignment to perceptual quality.",
    "An explicit patient population and inclusion criteria.",
  ],
};

export const RELATED = [
  { title: "Learning to See Again: Cortical Prosthesis Encoding via Self-Supervised Alignment", authors: "Okafor, R., Lindqvist, M.", year: 2024, relevance: 91, reason: "Closest architectural overlap — proposes a similar brain-aligned encoder trained on natural image statistics." },
  { title: "Phosphene Perception Under Non-Stationary Electrode Interfaces", authors: "Vale, D. et al.", year: 2023, relevance: 84, reason: "Directly addresses the temporal-drift gap flagged in this project." },
  { title: "Patient-Specific Calibration for Visual Neuroprostheses: A Survey", authors: "Huang, T., Bassi, C.", year: 2022, relevance: 77, reason: "Survey covering calibration strategies missing from the current proposal." },
  { title: "Behavioural Validation Protocols for Simulated Prosthetic Vision", authors: "Okonkwo, N.", year: 2021, relevance: 63, reason: "Offers a validation protocol that could address the methodological concern on clinical grounding." },
];

export const SUGGESTIONS = [
  { id: 1, text: "Clarify the research question so it names a single measurable perceptual outcome.", tag: "Clarity" },
  { id: 2, text: "Strengthen theoretical grounding for why representational alignment should transfer to phosphene quality.", tag: "Theory" },
  { id: 3, text: "Investigate the calibration literature — an under-covered domain in the current material.", tag: "Coverage" },
  { id: 4, text: "Compare against at least one classical, non-learned encoding as a baseline.", tag: "Methodology" },
  { id: 5, text: "Validate the assumption of stable electrode placement, or scope the study to a shorter timeframe.", tag: "Assumption" },
];

/* ---------------------------------------------------------------------- */
/*  AI RESEARCH CHAT                                                       */
/* ---------------------------------------------------------------------- */

export const NOVELTY_CHAT_SEED = [
  { role: "user", text: "Why is my proposed approach considered only moderately novel?" },
  { role: "assistant", text: "Your architecture combines a self-supervised visual encoder with electrode-space decoding, but a similar combination appears in Okafor & Lindqvist (2024). The differentiator in your draft — patient-specific calibration — is mentioned but not yet developed into a method, so it isn't currently contributing to the novelty score." },
];

export const GAP_CHAT_SEED = [
  { role: "user", text: "What exactly is missing from the existing literature?" },
  { role: "assistant", text: "The reviewed works address encoding quality and calibration strategy independently, but the relationship between the two — whether a better-aligned encoder reduces the calibration burden — remains unexplored. That intersection is where your proposal could stake a clear claim." },
];

export const NOVELTY_FOLLOWUPS = [
  "Given that, that suggests differentiating on the calibration side rather than the encoder architecture. Two papers touch calibration burden reduction — Huang & Bassi (2022) and Vale et al. (2023) — but neither ties it to representation alignment the way your draft implies. That connection, if developed, would raise the novelty assessment.",
  "The overlap is architectural, not empirical — no one has reported calibration-time measurements for this class of encoder. If you added that measurement, the novelty claim would rest on evidence rather than design alone.",
];

export const GAP_FOLLOWUPS = [
  "Concretely: no reviewed source reports how calibration time changes as encoder alignment improves. A single experiment measuring that relationship would close the most load-bearing part of this gap.",
  "It also means the 'brain-aligned' framing is currently untested against the outcome that matters clinically — usable vision, not reconstruction accuracy. That distinction is worth stating explicitly in your framing.",
];

/* Chat configuration per discussion topic, keyed by the section that opens it. */
export const CHAT_TOPICS = {
  novelty: { title: "Novelty discussion", seed: NOVELTY_CHAT_SEED, followups: NOVELTY_FOLLOWUPS },
  gaps: { title: "Research gap discussion", seed: GAP_CHAT_SEED, followups: GAP_FOLLOWUPS },
};

/* Bundle of every analysis module for one project — the shape a future
   analysis endpoint would return for a given project. */
export const MOCK_ANALYSIS = {
  overview: OVERVIEW,
  gaps: GAPS,
  novelty: NOVELTY,
  critique: CRITIQUE,
  relevance: RELEVANCE,
  related: RELATED,
  suggestions: SUGGESTIONS,
};
