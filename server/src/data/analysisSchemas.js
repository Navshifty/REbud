/*
  Prompts and JSON schemas for each analysis module.

  Every claim the model makes is tied to `evidence` — quotes from the
  supplied chunks, cited by chunk id — so the UI can separate what the
  documents say from what the model infers. Schemas follow the structured
  outputs rules: every object has additionalProperties:false and lists
  all properties as required; numeric ranges are enforced server-side.
*/

const EVIDENCE = {
  type: "array",
  description: "Passages from the documents that support this point. Cite chunk ids exactly as given; quote verbatim and briefly (max ~40 words).",
  items: {
    type: "object",
    properties: {
      chunkId: { type: "string", description: "A chunk id from the documents, e.g. D1#3." },
      quote: { type: "string", description: "Short verbatim excerpt from that chunk." },
    },
    required: ["chunkId", "quote"],
    additionalProperties: false,
  },
};

const textWithEvidence = (description) => ({
  type: "object",
  properties: { text: { type: "string", description }, evidence: EVIDENCE },
  required: ["text", "evidence"],
  additionalProperties: false,
});

const score = (description) => ({ type: "integer", description: `${description} Integer from 0 to 100.` });

export const SYSTEM_PROMPT = `You are REbud, a research-intelligence analyst that helps students and researchers evaluate research papers and proposals.

You are given the extracted text of a project's documents, split into chunks with ids like D1#3 (document 1, chunk 3). Analyse only what is in front of you.

Principles:
- Separate evidence from interpretation. Evidence is a verbatim quote from a chunk, cited by its id. Interpretation is your reasoning about it. Never present an inference as something the documents state.
- If the documents do not contain enough information to judge something, say so plainly instead of guessing, and lower any related score or confidence.
- Be specific and concrete: name the section, claim, method or assumption you are talking about.
- Be critical but fair. Point out genuine weaknesses; do not manufacture problems.
- Do not invent citations, authors, venues or results. When you mention prior work that is not in the documents, mark it as unverified.
- Write for a researcher: precise, plain English, no filler.`;

const SEVERITY = { type: "string", enum: ["High", "Medium", "Low"] };

export const MODULES = {
  overview: {
    title: "Overall analysis",
    maxTokens: 12000,
    queries: ["research problem objective aim", "methodology method approach design", "results findings contribution", "limitations future work"],
    task: `Produce the overall analysis of this project.

Scores are integers 0-100 and mean: strength = overall quality and rigour of the research/proposal as written; gap = how clearly a genuine, well-motivated research gap is identified; novelty = how differentiated the contribution is from the prior work described; relevance = how well the proposed work addresses the stated problem; evidenceStrength = how well the central claims are supported by evidence in the documents. Calibrate: 50 is adequate, 80+ is strong, below 40 has serious problems.

summary fields should each be one or two sentences drawn from the documents (say "Not stated in the documents." when absent).
findings: 3-5 key findings about the research, each with evidence.
critical: the 1-4 most serious issues, each with evidence where possible.
next: 3-5 concrete recommended next steps.`,
    schema: {
      type: "object",
      properties: {
        summary: {
          type: "object",
          properties: {
            problem: { type: "string" },
            objective: { type: "string" },
            domain: { type: "string" },
            methodology: { type: "string" },
          },
          required: ["problem", "objective", "domain", "methodology"],
          additionalProperties: false,
        },
        scores: {
          type: "object",
          properties: {
            strength: score("Overall strength."),
            gap: score("Clarity of the research gap."),
            novelty: score("Novelty of the contribution."),
            relevance: score("Relevance to the stated problem."),
            evidenceStrength: score("Support for central claims."),
          },
          required: ["strength", "gap", "novelty", "relevance", "evidenceStrength"],
          additionalProperties: false,
        },
        findings: { type: "array", items: textWithEvidence("A key finding about the research.") },
        critical: { type: "array", items: textWithEvidence("A critical issue.") },
        next: { type: "array", items: { type: "string" } },
      },
      required: ["summary", "scores", "findings", "critical", "next"],
      additionalProperties: false,
    },
  },

  gaps: {
    title: "Research gaps",
    maxTokens: 12000,
    queries: ["limitation not addressed", "future work open question", "prior work does not", "unexplored gap missing"],
    task: `Identify the research gaps: limitations of the existing work described, areas the documents leave unaddressed, unanswered questions, and the resulting research opportunities.

Return 3-6 gaps ordered by importance. For each: a one-sentence title; an explanation of why it is a gap grounded in the documents; severity (High = undermines the central contribution if unaddressed, Medium = materially weakens it, Low = worth noting); confidence 0-100 in your judgement given the available text; the opportunity it opens; and evidence quotes.`,
    schema: {
      type: "object",
      properties: {
        gaps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              explanation: { type: "string" },
              severity: SEVERITY,
              confidence: score("Confidence in this gap."),
              opportunity: { type: "string", description: "The research opportunity this gap opens." },
              evidence: EVIDENCE,
            },
            required: ["title", "explanation", "severity", "confidence", "opportunity", "evidence"],
            additionalProperties: false,
          },
        },
      },
      required: ["gaps"],
      additionalProperties: false,
    },
  },

  novelty: {
    title: "Novelty",
    maxTokens: 10000,
    queries: ["novel contribution first to", "related work prior approaches", "compared with existing methods", "differs from"],
    task: `Assess the novelty of the proposed contribution relative to the prior work described in the documents.

score 0-100 (calibrate: 30 = incremental, 60 = meaningful variation, 85+ = clearly new). verdict is a 2-4 word label such as "Moderate novelty". summary is two sentences. strengths = what appears genuinely differentiated; overlap = where it resembles existing approaches; needsDifferentiation = what would have to be developed or shown to make the novelty claim hold. similarApproaches lists prior work you are comparing against — from the documents where possible; anything not in the documents must be labelled as unverified in its "source" field. Provide evidence quotes for the assessment.`,
    schema: {
      type: "object",
      properties: {
        score: score("Novelty score."),
        verdict: { type: "string" },
        summary: { type: "string" },
        strengths: { type: "string" },
        overlap: { type: "string" },
        needsDifferentiation: { type: "string" },
        similarApproaches: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              source: { type: "string", description: "Where this comes from: a chunk id, or 'unverified (model knowledge)'." },
            },
            required: ["name", "source"],
            additionalProperties: false,
          },
        },
        evidence: EVIDENCE,
      },
      required: ["score", "verdict", "summary", "strengths", "overlap", "needsDifferentiation", "similarApproaches", "evidence"],
      additionalProperties: false,
    },
  },

  critique: {
    title: "Critique",
    maxTokens: 12000,
    queries: ["we assume assumption", "evaluation dataset baseline", "significantly improves claim", "scope limitations threats to validity"],
    task: `Critically evaluate the research. Group your points under these categories, using only the ones that apply: "Conceptual weaknesses", "Methodological concerns", "Missing assumptions", "Unsupported claims", "Logical inconsistencies", "Scope problems", "Risks".

Each item is one specific, actionable point with evidence quotes where the text supports it. Prefer 4-10 items in total. Do not repeat the same issue under two categories.`,
    schema: {
      type: "object",
      properties: {
        categories: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: { type: "string" },
              items: { type: "array", items: textWithEvidence("A specific critique.") },
            },
            required: ["category", "items"],
            additionalProperties: false,
          },
        },
      },
      required: ["categories"],
      additionalProperties: false,
    },
  },

  relevance: {
    title: "Proposal relevance",
    maxTokens: 10000,
    queries: ["research question hypothesis", "objectives aims", "proposed method will", "expected outcome contribution impact"],
    task: `Evaluate how well the proposed direction follows from the identified problem and gap.

Scores 0-100: problemRelevance = does the work address the stated problem; questionAlignment = do the research questions/hypotheses follow from the gap; methodAlignment = can the proposed methods answer those questions; expectedContribution = are the expected outcomes plausible and valuable. rationale is a short paragraph. missing lists conceptual components a strong proposal would have but this one lacks (e.g. a falsifiable hypothesis, a defined population). Include evidence quotes.`,
    schema: {
      type: "object",
      properties: {
        problemRelevance: score("Problem relevance."),
        questionAlignment: score("Research question alignment."),
        methodAlignment: score("Method alignment."),
        expectedContribution: score("Expected contribution."),
        rationale: { type: "string" },
        missing: { type: "array", items: { type: "string" } },
        evidence: EVIDENCE,
      },
      required: ["problemRelevance", "questionAlignment", "methodAlignment", "expectedContribution", "rationale", "missing", "evidence"],
      additionalProperties: false,
    },
  },

  related: {
    title: "Related research",
    maxTokens: 10000,
    queries: ["related work", "references cited", "prior studies survey", "research domain field"],
    task: `Identify related research for this project.

papers: 4-8 relevant works. Prefer works actually cited or described in the documents. You may add well-known works from your own knowledge, but set verified=false for anything not confirmed by the documents or by search results, and never invent titles, authors or years — if unsure of a detail, leave url empty and say so in reason. relevance 0-100. url is "" when unknown.
domains: 3-6 research domains or subfields this work sits in.
directions: 3-5 research directions worth exploring next.`,
    schema: {
      type: "object",
      properties: {
        papers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              authors: { type: "string" },
              year: { type: "integer" },
              venue: { type: "string" },
              relevance: score("Relevance to the project."),
              reason: { type: "string" },
              url: { type: "string" },
              verified: { type: "boolean", description: "True only if confirmed by the documents or search results." },
            },
            required: ["title", "authors", "year", "venue", "relevance", "reason", "url", "verified"],
            additionalProperties: false,
          },
        },
        domains: { type: "array", items: { type: "string" } },
        directions: { type: "array", items: { type: "string" } },
      },
      required: ["papers", "domains", "directions"],
      additionalProperties: false,
    },
  },

  suggestions: {
    title: "Suggestions",
    maxTokens: 10000,
    queries: ["proposal plan", "evaluation experiments", "hypothesis research question", "limitations future work"],
    task: `Give 5-8 concrete suggestions for strengthening this research or proposal: missing concepts to add, alternative approaches, experiments or evaluations to run, clarifications to make. Each suggestion is one actionable sentence, tagged with exactly one of: Clarity, Theory, Coverage, Methodology, Assumption, Evaluation, Scope. rationale explains why it matters, with evidence quotes where the documents support the point.`,
    schema: {
      type: "object",
      properties: {
        suggestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              text: { type: "string" },
              tag: { type: "string", enum: ["Clarity", "Theory", "Coverage", "Methodology", "Assumption", "Evaluation", "Scope"] },
              rationale: { type: "string" },
              evidence: EVIDENCE,
            },
            required: ["text", "tag", "rationale", "evidence"],
            additionalProperties: false,
          },
        },
      },
      required: ["suggestions"],
      additionalProperties: false,
    },
  },
};

export const CHAT_SYSTEM_PROMPT = `${SYSTEM_PROMPT}

You are now in a conversation with the researcher about their project. Answer their question using the retrieved passages and the analysis results you are given. Quote the documents when you rely on them (cite chunk ids). When the documents do not cover something, say so and answer from general knowledge while making that distinction explicit. Keep answers focused: a few sentences to two short paragraphs.`;

export const CHAT_SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string", description: "The reply to the researcher, in plain prose." },
    citations: EVIDENCE,
    grounded: { type: "boolean", description: "True if the answer rests mainly on the documents/analysis rather than general knowledge." },
    followUps: { type: "array", items: { type: "string" }, description: "Up to 3 short follow-up questions the researcher might ask next." },
  },
  required: ["answer", "citations", "grounded", "followUps"],
  additionalProperties: false,
};
