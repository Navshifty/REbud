/*
  Canned analysis results served by the API until the research
  intelligence pipeline (Phase 4) generates them from document text.
  Shapes match the frontend sections' `data` props.
*/

export const ANALYSIS_MODULES = ["overview", "gaps", "novelty", "critique", "relevance", "related", "suggestions"];

export const MOCK_ANALYSIS = {
  overview: {
    strength: 78, gap: 82, novelty: 72, relevance: 86, evidence: 79,
    findings: [
      "The proposal is well positioned relative to recent self-supervised encoding work, with a credible architectural contribution.",
      "Temporal stability of electrode-tissue interfaces is the most significant unaddressed risk to the central claim.",
      "Evidence for the core hypothesis is currently drawn from adjacent domains rather than direct prior demonstration.",
    ],
    critical: ["No non-learned baseline reported.", "Clinical validation pathway is undefined."],
    next: [
      "Add a classical encoding baseline to the evaluation plan.",
      "Draft an explicit, falsifiable primary hypothesis.",
      "Scope a pilot calibration protocol for 3–5 patients.",
    ],
  },
  gaps: [
    { id: 1, title: "Temporal reasoning is insufficiently addressed.", explanation: "Reviewed work treats phosphene perception as a static mapping problem. None of the cited studies model how perception drifts as electrode-tissue interfaces change over months of implantation.", severity: "High", confidence: 87, evidence: ["Nishimoto_2011_reconstruction.pdf, §4.2", "phosphene-mapping-review.pdf, §2"] },
    { id: 2, title: "No baseline comparison against non-learned phosphene encodings.", explanation: "The proposal assumes a learned encoder outperforms hand-designed mappings, but no classical baseline is reported anywhere in the uploaded material.", severity: "Medium", confidence: 74, evidence: ["proposal-draft-v3.docx, §3"] },
    { id: 3, title: "Patient variability is mentioned but not operationalised.", explanation: "Individual differences in cortical topology are acknowledged in the introduction, but no method section addresses per-patient calibration.", severity: "Medium", confidence: 69, evidence: ["proposal-draft-v3.docx, §1", "electrode-array-notes.md"] },
    { id: 4, title: "Limited discussion of failure modes in low-electrode-count regimes.", explanation: "Most evaluation appears to assume high-density arrays; sparse-array behaviour is not characterised.", severity: "Low", confidence: 58, evidence: ["cortical-mapping-data.csv"] },
  ],
  novelty: {
    score: 72,
    verdict: "Moderate novelty",
    summary: "Architectural framing is fresh; the calibration mechanism needs more development to differentiate fully.",
    strengths: "Combines self-supervised alignment with a prosthetic decoding target in a way not yet common in the literature.",
    overlap: "Closely related to Okafor & Lindqvist (2024)'s encoder design.",
    needsDifferentiation: "Patient-specific calibration is asserted, not yet developed as a method.",
  },
  critique: [
    { category: "Conceptual weaknesses", items: ["The link between 'brain-aligned' representations and improved patient outcomes is asserted rather than demonstrated."] },
    { category: "Methodological concerns", items: ["Evaluation relies on a single simulated-vision dataset; no clinical or behavioural validation is proposed.", "Cross-validation strategy is not specified for the calibration step."] },
    { category: "Missing assumptions", items: ["Assumes stable electrode placement over the study period without justification."] },
    { category: "Unsupported claims", items: ["“Significantly improves usable vision” is stated without an effect size or comparison baseline."] },
    { category: "Scope problems", items: ["The proposal spans encoding, calibration, and clinical deployment — any one of which could be a full study."] },
  ],
  relevance: {
    problemRelevance: 81, questionAlignment: 76, methodAlignment: 68, expectedContribution: 74,
    missing: [
      "A clear falsifiable hypothesis connecting representation alignment to perceptual quality.",
      "An explicit patient population and inclusion criteria.",
    ],
  },
  related: [
    { title: "Learning to See Again: Cortical Prosthesis Encoding via Self-Supervised Alignment", authors: "Okafor, R., Lindqvist, M.", year: 2024, relevance: 91, reason: "Closest architectural overlap — proposes a similar brain-aligned encoder trained on natural image statistics." },
    { title: "Phosphene Perception Under Non-Stationary Electrode Interfaces", authors: "Vale, D. et al.", year: 2023, relevance: 84, reason: "Directly addresses the temporal-drift gap flagged in this project." },
    { title: "Patient-Specific Calibration for Visual Neuroprostheses: A Survey", authors: "Huang, T., Bassi, C.", year: 2022, relevance: 77, reason: "Survey covering calibration strategies missing from the current proposal." },
    { title: "Behavioural Validation Protocols for Simulated Prosthetic Vision", authors: "Okonkwo, N.", year: 2021, relevance: 63, reason: "Offers a validation protocol that could address the methodological concern on clinical grounding." },
  ],
  suggestions: [
    { id: 1, text: "Clarify the research question so it names a single measurable perceptual outcome.", tag: "Clarity" },
    { id: 2, text: "Strengthen theoretical grounding for why representational alignment should transfer to phosphene quality.", tag: "Theory" },
    { id: 3, text: "Investigate the calibration literature — an under-covered domain in the current material.", tag: "Coverage" },
    { id: 4, text: "Compare against at least one classical, non-learned encoding as a baseline.", tag: "Methodology" },
    { id: 5, text: "Validate the assumption of stable electrode placement, or scope the study to a shorter timeframe.", tag: "Assumption" },
  ],
};

/* Canned chat replies per discussion topic, indexed by the user's turn number. */
export const CHAT_REPLIES = {
  novelty: [
    "Your architecture combines a self-supervised visual encoder with electrode-space decoding, but a similar combination appears in Okafor & Lindqvist (2024). The differentiator in your draft — patient-specific calibration — is mentioned but not yet developed into a method, so it isn't currently contributing to the novelty score.",
    "Given that, that suggests differentiating on the calibration side rather than the encoder architecture. Two papers touch calibration burden reduction — Huang & Bassi (2022) and Vale et al. (2023) — but neither ties it to representation alignment the way your draft implies. That connection, if developed, would raise the novelty assessment.",
    "The overlap is architectural, not empirical — no one has reported calibration-time measurements for this class of encoder. If you added that measurement, the novelty claim would rest on evidence rather than design alone.",
  ],
  gaps: [
    "The reviewed works address encoding quality and calibration strategy independently, but the relationship between the two — whether a better-aligned encoder reduces the calibration burden — remains unexplored. That intersection is where your proposal could stake a clear claim.",
    "Concretely: no reviewed source reports how calibration time changes as encoder alignment improves. A single experiment measuring that relationship would close the most load-bearing part of this gap.",
    "It also means the 'brain-aligned' framing is currently untested against the outcome that matters clinically — usable vision, not reconstruction accuracy. That distinction is worth stating explicitly in your framing.",
  ],
  general: [
    "I can discuss the analysis of this project: its research gaps, novelty estimate, critique, or how the proposal aligns with the stated problem. Which would you like to dig into?",
    "The most load-bearing issue across the analysis is the missing classical baseline — several findings trace back to it. Addressing it would strengthen the novelty, critique and relevance assessments at once.",
  ],
};
