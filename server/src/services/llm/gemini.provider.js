import { ApiError, GoogleGenAI } from "@google/genai";
import { config } from "../../config.js";
import { LlmError, fromStatus } from "./errors.js";

/*
  Gemini provider.

  Translates the pipeline's provider-neutral calls into Google GenAI
  requests: JSON Schema via responseJsonSchema, reasoning depth via
  thinkingConfig.thinkingLevel, and finishReason/ApiError into LlmError.
*/

const LABEL = "Gemini";

let client = null;
function getClient() {
  if (!config.geminiApiKey) throw new LlmError("Gemini is not configured on this server (missing GEMINI_API_KEY).");
  if (!client) client = new GoogleGenAI({ apiKey: config.geminiApiKey });
  return client;
}

/* The pipeline's five effort levels onto Gemini's four thinking levels. */
const THINKING_LEVEL = { low: "LOW", medium: "MEDIUM", high: "HIGH", xhigh: "HIGH", max: "HIGH" };

/*
  Gemini's schema dialect is derived from OpenAPI and rejects some
  JSON Schema keywords that the schemas carry for other providers.
  Strip those rather than maintaining a second set of schemas.
*/
const UNSUPPORTED_KEYS = ["additionalProperties", "$schema", "definitions", "$defs", "$ref", "minimum", "maximum", "minLength", "maxLength"];

export function sanitiseSchema(schema) {
  if (Array.isArray(schema)) return schema.map(sanitiseSchema);
  if (!schema || typeof schema !== "object") return schema;
  const out = {};
  for (const [key, value] of Object.entries(schema)) {
    if (UNSUPPORTED_KEYS.includes(key)) continue;
    out[key] = sanitiseSchema(value);
  }
  return out;
}

function translateError(err) {
  if (err instanceof LlmError) return err;
  if (err instanceof ApiError) return fromStatus(err.status, LABEL, err.message ?? "");
  const status = err?.status ?? err?.response?.status;
  if (typeof status === "number") return fromStatus(status, LABEL, err?.message ?? "");
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|network/i.test(err?.message ?? "")) {
    return new LlmError("Couldn't reach the Gemini API. Check the server's network connection.", { retryable: true, cause: err });
  }
  return new LlmError(err?.message || "Analysis failed.", { cause: err });
}

/* Gemini reports why it stopped on the candidate, not as an exception. */
function checkFinish(response) {
  const candidate = response.candidates?.[0];
  const reason = candidate?.finishReason;
  if (!reason || reason === "STOP") return;
  if (reason === "MAX_TOKENS") {
    throw new LlmError("The analysis was too long to finish. Try again with fewer or shorter documents.", { retryable: true });
  }
  if (reason === "SAFETY" || reason === "PROHIBITED_CONTENT" || reason === "SPII" || reason === "BLOCKLIST") {
    throw new LlmError("Gemini declined to analyse this content on safety grounds.");
  }
  if (reason === "RECITATION") {
    throw new LlmError("Gemini stopped because the response reproduced source material too closely.", { retryable: true });
  }
  throw new LlmError(`Gemini stopped unexpectedly (${reason}).`, { retryable: true });
}

function usageOf(response) {
  const u = response.usageMetadata ?? {};
  return {
    input_tokens: u.promptTokenCount ?? 0,
    output_tokens: u.candidatesTokenCount ?? 0,
    cache_read_input_tokens: u.cachedContentTokenCount ?? 0,
    thinking_tokens: u.thoughtsTokenCount ?? 0,
  };
}

export const describe = () => ({
  provider: "gemini",
  configured: Boolean(config.geminiApiKey),
  model: config.geminiApiKey ? config.geminiModel : null,
  webSearch: Boolean(config.geminiApiKey) && config.enableWebSearch,
});

export async function generateStructured({ system, context, task, schema, maxTokens = 16000, effort = config.analysisEffort }) {
  // The document block goes first so it stays a stable prefix, matching
  // how the Anthropic provider orders its cached content.
  const parts = [];
  if (context) parts.push({ text: context });
  parts.push({ text: task });

  try {
    const response = await getClient().models.generateContent({
      model: config.geminiModel,
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: system,
        maxOutputTokens: maxTokens,
        responseMimeType: "application/json",
        responseJsonSchema: sanitiseSchema(schema),
        thinkingConfig: { thinkingLevel: THINKING_LEVEL[effort] ?? "HIGH" },
      },
    });
    checkFinish(response);

    const text = response.text;
    if (!text) throw new LlmError("Gemini returned an empty response.", { retryable: true });
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      throw new LlmError("Gemini returned malformed JSON.", { retryable: true, cause: err });
    }
    return { data, usage: usageOf(response), model: config.geminiModel };
  } catch (err) {
    throw translateError(err);
  }
}

export async function generateText({ system, prompt, tools, maxTokens = 16000, effort = config.analysisEffort }) {
  try {
    const response = await getClient().models.generateContent({
      model: config.geminiModel,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: system,
        maxOutputTokens: maxTokens,
        thinkingConfig: { thinkingLevel: THINKING_LEVEL[effort] ?? "HIGH" },
        // Gemini's web grounding is a tool like any other; the pipeline
        // asks for it by passing tools through.
        ...(tools ? { tools } : {}),
      },
    });
    checkFinish(response);
    return { text: response.text ?? "", usage: usageOf(response), model: config.geminiModel };
  } catch (err) {
    throw translateError(err);
  }
}

/** The web-grounding tool definition the pipeline passes to generateText. */
export const webSearchTool = () => ({ googleSearch: {} });
