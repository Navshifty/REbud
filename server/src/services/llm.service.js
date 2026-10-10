import Anthropic from "@anthropic-ai/sdk";
import { config, llmEnabled } from "../config.js";

/*
  The only place that talks to the Claude API.

  generateStructured() returns a JSON object that conforms to a schema
  (structured outputs); generateText() runs a plain or server-tool
  assisted turn. Both throw LlmError with a user-readable message.
*/

export class LlmError extends Error {
  constructor(message, { retryable = false, cause } = {}) {
    super(message);
    this.retryable = retryable;
    this.cause = cause;
  }
}

let client = null;
function getClient() {
  if (!llmEnabled()) throw new LlmError("AI analysis is not configured on this server (missing ANTHROPIC_API_KEY).");
  if (!client) client = new Anthropic({ apiKey: config.anthropicApiKey });
  return client;
}

export const isConfigured = () => llmEnabled();

export function describe() {
  return { configured: llmEnabled(), model: llmEnabled() ? config.anthropicModel : null, webSearch: llmEnabled() && config.enableWebSearch };
}

function translateError(err) {
  if (err instanceof LlmError) return err;
  if (err instanceof Anthropic.AuthenticationError) return new LlmError("The Anthropic API key was rejected. Check ANTHROPIC_API_KEY on the server.", { cause: err });
  if (err instanceof Anthropic.RateLimitError) return new LlmError("The model is rate-limited right now. Try again in a moment.", { retryable: true, cause: err });
  if (err instanceof Anthropic.BadRequestError) return new LlmError(`The analysis request was rejected: ${err.message}`, { cause: err });
  if (err instanceof Anthropic.APIConnectionError) return new LlmError("Couldn't reach the Anthropic API.", { retryable: true, cause: err });
  if (err instanceof Anthropic.APIError) return new LlmError(`Anthropic API error (${err.status}): ${err.message}`, { retryable: err.status >= 500, cause: err });
  return new LlmError(err?.message || "Analysis failed.", { cause: err });
}

function textOf(message) {
  return message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
}

function checkStop(message) {
  if (message.stop_reason === "refusal") {
    const why = message.stop_details?.explanation ? ` ${message.stop_details.explanation}` : "";
    throw new LlmError(`The model declined to analyse this content.${why}`);
  }
  if (message.stop_reason === "max_tokens") {
    throw new LlmError("The analysis was too long to finish. Try again with fewer or shorter documents.", { retryable: true });
  }
}

/**
 * Ask for JSON that matches `schema`.
 * `context` (optional) is a large, reusable text block — it is placed
 * first and marked for prompt caching so sibling requests reuse it.
 */
export async function generateStructured({ system, context, task, schema, maxTokens = 16000, effort = config.analysisEffort }) {
  const content = [];
  if (context) content.push({ type: "text", text: context, cache_control: { type: "ephemeral" } });
  content.push({ type: "text", text: task });

  try {
    const stream = getClient().messages.stream({
      model: config.anthropicModel,
      max_tokens: maxTokens,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content }],
      thinking: { type: "adaptive" },
      output_config: { effort, format: { type: "json_schema", schema } },
    });
    const message = await stream.finalMessage();
    checkStop(message);

    let data;
    try {
      data = JSON.parse(textOf(message));
    } catch (err) {
      throw new LlmError("The model returned malformed JSON.", { retryable: true, cause: err });
    }
    return { data, usage: message.usage, model: message.model };
  } catch (err) {
    throw translateError(err);
  }
}

/**
 * Plain text turn, optionally with Anthropic server tools (e.g. web search).
 * Resumes `pause_turn` so long tool-using turns complete.
 */
export async function generateText({ system, prompt, tools, maxTokens = 16000, effort = config.analysisEffort, maxRounds = 6 }) {
  const messages = [{ role: "user", content: prompt }];
  try {
    for (let round = 0; round < maxRounds; round += 1) {
      const message = await getClient().messages.create({
        model: config.anthropicModel,
        max_tokens: maxTokens,
        system,
        messages,
        tools,
        thinking: { type: "adaptive" },
        output_config: { effort },
      });
      if (message.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: message.content });
        continue;
      }
      checkStop(message);
      return { text: textOf(message), usage: message.usage, model: message.model, content: message.content };
    }
    throw new LlmError("The research turn did not finish in time.", { retryable: true });
  } catch (err) {
    throw translateError(err);
  }
}
