import { config, llmEnabled } from "../config.js";
import { LlmError } from "./llm/errors.js";
import * as anthropic from "./llm/anthropic.provider.js";
import * as gemini from "./llm/gemini.provider.js";

/*
  The pipeline's single door to a language model.

  Which provider answers is decided by LLM_PROVIDER in server/.env
  (gemini or anthropic). Both providers expose the same three calls, so
  prompts, schemas, retrieval and citation handling are provider-neutral
  and nothing downstream knows which model ran.
*/

export { LlmError };

const PROVIDERS = { anthropic, gemini };

function provider() {
  const impl = PROVIDERS[config.llmProvider];
  if (!impl) {
    throw new LlmError(`Unknown LLM_PROVIDER "${config.llmProvider}". Use "gemini" or "anthropic".`);
  }
  return impl;
}

export const isConfigured = () => llmEnabled();

/** Capability report surfaced on /api/health. */
export function describe() {
  if (!PROVIDERS[config.llmProvider]) {
    return { provider: config.llmProvider, configured: false, model: null, webSearch: false, error: "unknown provider" };
  }
  return provider().describe();
}

/** JSON matching `schema`. `context` is the large, reusable document block. */
export const generateStructured = (args) => provider().generateStructured(args);

/** A plain text turn, optionally with the provider's web-search tool. */
export const generateText = (args) => provider().generateText(args);

/** The active provider's web-search tool definition, shaped for its own API. */
export const webSearchTool = () => provider().webSearchTool();
