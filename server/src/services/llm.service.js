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

/*
  Transient failures — provider overload, rate limits, dropped
  connections, a truncated JSON response — are retried here with
  exponential backoff rather than surfaced. Only an error that survives
  every attempt reaches the user.
*/
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 2000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry(label, fn) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!err?.retryable || attempt === MAX_ATTEMPTS) break;
      // 2s, then 4s — long enough for a demand spike to pass.
      const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
      console.warn(`[llm] ${label} attempt ${attempt}/${MAX_ATTEMPTS} failed (${err.message}); retrying in ${delay}ms`);
      await sleep(delay);
    }
  }
  if (lastError?.retryable) {
    lastError.message = `${lastError.message} Tried ${MAX_ATTEMPTS} times.`;
  }
  throw lastError;
}

/** JSON matching `schema`. `context` is the large, reusable document block. */
export const generateStructured = (args) => withRetry("generateStructured", () => provider().generateStructured(args));

/** A plain text turn, optionally with the provider's web-search tool. */
export const generateText = (args) => withRetry("generateText", () => provider().generateText(args));

/** The active provider's web-search tool definition, shaped for its own API. */
export const webSearchTool = () => provider().webSearchTool();
