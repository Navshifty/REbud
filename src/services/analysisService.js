import { MOCK_ANALYSIS } from "../data/mockData";

/*
  Analysis service — the single place the UI asks for research intelligence.

  Today it is a mock: it waits, checks the project has processed documents,
  and returns canned results per module. In Phase 3 the body of
  `runAnalysis` becomes a fetch to the analysis API; callers don't change.
*/

const MOCK_LATENCY_MS = 1400;

export const ANALYSIS_MODULES = ["overview", "gaps", "novelty", "critique", "relevance", "related", "suggestions"];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run one analysis module for a project.
 * @param {string} moduleKey  one of ANALYSIS_MODULES
 * @param {{ project: object, files: object[] }} ctx
 * @returns {Promise<object>} the module's result payload
 */
export async function runAnalysis(moduleKey, { files }) {
  if (!ANALYSIS_MODULES.includes(moduleKey)) {
    throw new Error(`Unknown analysis module "${moduleKey}".`);
  }

  await delay(MOCK_LATENCY_MS);

  const processed = files.filter((f) => f.status === "Processed");
  if (processed.length === 0) {
    throw new Error("No processed documents yet. Wait for uploads to finish processing, then run the analysis again.");
  }

  return MOCK_ANALYSIS[moduleKey];
}
