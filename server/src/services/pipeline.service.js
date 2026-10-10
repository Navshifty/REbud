import { config } from "../config.js";
import { MODULES, SYSTEM_PROMPT } from "../data/analysisSchemas.js";
import { MOCK_ANALYSIS } from "../data/mockAnalysis.js";
import { getCorpus, renderChunks, resolveCitation, selectChunks } from "./corpus.service.js";
import * as llm from "./llm.service.js";

/*
  The research-intelligence pipeline for one analysis module:

    documents → corpus (chunks + index) → context selection → prompt →
    structured model output → normalised result with resolved citations

  runModule() returns { data, meta }. `data` is what the UI renders;
  `meta` records provenance (model vs sample, model id, documents used,
  token usage) so the interface can say where a result came from.
*/

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));

function resolveEvidence(corpus, list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((e) => resolveCitation(corpus, e?.chunkId, e?.quote))
    .filter(Boolean);
}

const withEvidence = (corpus, item) => ({ text: item.text, evidence: resolveEvidence(corpus, item.evidence) });

/** Map the model's schema-shaped output onto the shapes the UI sections render. */
function normalise(module, raw, corpus) {
  switch (module) {
    case "overview":
      return {
        strength: clamp(raw.scores.strength),
        gap: clamp(raw.scores.gap),
        novelty: clamp(raw.scores.novelty),
        relevance: clamp(raw.scores.relevance),
        evidence: clamp(raw.scores.evidenceStrength),
        summary: raw.summary,
        findings: raw.findings.map((f) => withEvidence(corpus, f)),
        critical: raw.critical.map((c) => withEvidence(corpus, c)),
        next: raw.next,
      };
    case "gaps":
      return raw.gaps.map((g, i) => ({
        id: i + 1,
        title: g.title,
        explanation: g.explanation,
        severity: g.severity,
        confidence: clamp(g.confidence),
        opportunity: g.opportunity,
        evidence: resolveEvidence(corpus, g.evidence),
      }));
    case "novelty":
      return { ...raw, score: clamp(raw.score), evidence: resolveEvidence(corpus, raw.evidence) };
    case "critique":
      return raw.categories
        .filter((c) => c.items?.length)
        .map((c) => ({ category: c.category, items: c.items.map((it) => withEvidence(corpus, it)) }));
    case "relevance":
      return {
        problemRelevance: clamp(raw.problemRelevance),
        questionAlignment: clamp(raw.questionAlignment),
        methodAlignment: clamp(raw.methodAlignment),
        expectedContribution: clamp(raw.expectedContribution),
        rationale: raw.rationale,
        missing: raw.missing,
        evidence: resolveEvidence(corpus, raw.evidence),
      };
    case "related":
      return {
        papers: raw.papers.map((p) => ({ ...p, relevance: clamp(p.relevance), verified: Boolean(p.verified) })),
        domains: raw.domains,
        directions: raw.directions,
      };
    case "suggestions":
      return raw.suggestions.map((s, i) => ({
        id: i + 1,
        text: s.text,
        tag: s.tag,
        rationale: s.rationale,
        evidence: resolveEvidence(corpus, s.evidence),
      }));
    default:
      return raw;
  }
}

function projectPreamble(project) {
  const objective = project.objective ? `Stated research objective: ${project.objective}` : "No research objective was provided by the researcher.";
  return `Project: "${project.name}"\n${objective}`;
}

/** Optional web-search pass used by the "related" module to verify papers. */
async function researchRelatedWork(project, context) {
  const prompt = `${projectPreamble(project)}\n\n${context}\n\nUsing web search, find 4-8 real, verifiable papers or surveys closely related to this project. For each give title, authors, year, venue and a URL you actually retrieved, plus one sentence on why it matters here. Only include works you confirmed exist.`;
  const result = await llm.generateText({
    system: SYSTEM_PROMPT,
    prompt,
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 6 }],
    maxTokens: 12000,
    effort: "medium",
  });
  return result;
}

/**
 * Run one module against a project's documents.
 * Falls back to labelled sample data when the model isn't configured.
 */
export async function runModule(module, project, docs) {
  const spec = MODULES[module];
  if (!spec) throw new Error(`Unknown analysis module "${module}".`);
  const startedAt = Date.now();
  const documentsUsed = docs.map((d) => d.name);

  if (!llm.isConfigured()) {
    await new Promise((resolve) => setTimeout(resolve, config.mockAnalysisMs));
    return {
      data: MOCK_ANALYSIS[module],
      meta: {
        source: "sample",
        model: null,
        generatedAt: Date.now(),
        documents: documentsUsed,
        durationMs: Date.now() - startedAt,
        note: "Sample result. Set ANTHROPIC_API_KEY on the server to analyse your own documents.",
      },
    };
  }

  const corpus = await getCorpus(project.id);
  if (corpus.chunks.length === 0) {
    throw new Error("None of this project's documents have readable text yet. Check the documents' extraction status.");
  }

  const chunks = selectChunks(corpus, spec.queries);
  const context = renderChunks(chunks, corpus.sources);
  const warnings = [];
  if (chunks.length < corpus.chunks.length) {
    warnings.push(`Corpus is large: ${chunks.length} of ${corpus.chunks.length} passages were selected by relevance.`);
  }

  let task = `${projectPreamble(project)}\n\n${spec.task}`;
  let searchUsage = null;
  if (module === "related" && config.enableWebSearch) {
    try {
      const research = await researchRelatedWork(project, context);
      searchUsage = research.usage;
      task += `\n\nWeb search notes (these works were retrieved and may be marked verified=true):\n${research.text}`;
    } catch (err) {
      warnings.push(`Web search failed, related work is unverified: ${err.message}`);
    }
  }

  const { data: raw, usage, model } = await llm.generateStructured({
    system: SYSTEM_PROMPT,
    context,
    task,
    schema: spec.schema,
    maxTokens: spec.maxTokens,
  });

  return {
    data: normalise(module, raw, corpus),
    meta: {
      source: "model",
      model,
      effort: config.analysisEffort,
      generatedAt: Date.now(),
      documents: documentsUsed,
      chunksUsed: chunks.length,
      chunksTotal: corpus.chunks.length,
      usage: {
        inputTokens: (usage?.input_tokens ?? 0) + (searchUsage?.input_tokens ?? 0),
        outputTokens: (usage?.output_tokens ?? 0) + (searchUsage?.output_tokens ?? 0),
        cacheReadTokens: usage?.cache_read_input_tokens ?? 0,
      },
      durationMs: Date.now() - startedAt,
      warnings,
    },
  };
}
