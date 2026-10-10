import Anthropic from "@anthropic-ai/sdk";
import { config } from "../../config.js";
import { LlmError } from "./errors.js";

/*
  Anthropic (Claude) provider.

  Structured outputs via output_config.format, adaptive thinking with
  configurable effort, prompt caching on the system prompt and document
  block, and streaming so large analyses don't hit HTTP timeouts.
*/

const LABEL = "Claude";

let client = null;
function getClient() {
  if (!config.anthropicApiKey) throw new LlmError("Claude is not configured on this server (missing ANTHROPIC_API_KEY).");
  if (!client) client = new Anthropic({ apiKey: config.anthropicApiKey });
  return client;
}

function translateError(err) {
  if (err instanceof LlmError) return err;
  if (err instanceof Anthropic.AuthenticationError) return new LlmError(`The ${LABEL} API key was rejected. Check ANTHROPIC_API_KEY in server/.env.`, { cause: err });
  if (err instanceof Anthropic.RateLimitError) return new LlmError(`${LABEL} is rate-limited right now. Try again in a moment.`, { retryable: true, cause: err });
  if (err instanceof Anthropic.BadRequestError) return new LlmError(`The analysis request was rejected: ${err.message}`, { cause: err });
  if (err instanceof Anthropic.APIConnectionError) return new LlmError(`Couldn't reach the ${LABEL} API.`, { retryable: true, cause: err });
  if (err instanceof Anthropic.APIError) return new LlmError(`${LABEL} API error (${err.status}): ${err.message}`, { retryable: err.status >= 500, cause: err });
  return new LlmError(err?.message || "Analysis failed.", { cause: err });
}

function textOf(message) {
  return message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
}

function checkStop(message) {
  if (message.stop_reason === "refusal") {
    const why = message.stop_details?.explanation ? ` ${message.stop_details.explanation}` : "";
    throw new LlmError(`${LABEL} declined to analyse this content.${why}`);
  }
  if (message.stop_reason === "max_tokens") {
    throw new LlmError("The analysis was too long to finish. Try again with fewer or shorter documents.", { retryable: true });
  }
}

export const describe = () => ({
  provider: "anthropic",
  configured: Boolean(config.anthropicApiKey),
  model: config.anthropicApiKey ? config.anthropicModel : null,
  webSearch: Boolean(config.anthropicApiKey) && config.enableWebSearch,
});

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
      throw new LlmError(`${LABEL} returned malformed JSON.`, { retryable: true, cause: err });
    }
    return { data, usage: message.usage, model: message.model };
  } catch (err) {
    throw translateError(err);
  }
}

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
      // Server-tool turns can pause; push the turn back to resume it.
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

/** The web-search tool definition the pipeline passes to generateText. */
export const webSearchTool = () => ({ type: "web_search_20260209", name: "web_search", max_uses: 6 });
