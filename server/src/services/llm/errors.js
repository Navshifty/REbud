/*
  Provider-neutral error type. Each provider translates its own SDK
  errors into this so the pipeline and the UI see one vocabulary.
*/
export class LlmError extends Error {
  constructor(message, { retryable = false, cause } = {}) {
    super(message);
    this.name = "LlmError";
    this.retryable = retryable;
    this.cause = cause;
  }
}

/*
  Provider errors arrive as a JSON blob in the message. Pull out the
  human-readable sentence; a raw payload in the interface helps nobody.
*/
export function cleanDetail(detail = "") {
  const text = String(detail);
  const match = text.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (match) {
    const sentence = match[1].replace(/\\"/g, '"').replace(/\\n/g, " ").trim();
    return sentence.length > 200 ? `${sentence.slice(0, 197)}…` : sentence;
  }
  const plain = text.replace(/\s+/g, " ").trim();
  if (!plain || plain.startsWith("{")) return "";
  return plain.length > 200 ? `${plain.slice(0, 197)}…` : plain;
}

/** Map an HTTP status to a readable message, shared by both providers. */
export function fromStatus(status, providerLabel, rawDetail = "") {
  const detail = cleanDetail(rawDetail);
  const suffix = detail ? ` ${detail}` : "";
  if (status === 401 || status === 403) {
    return new LlmError(`The ${providerLabel} API key was rejected. Check it in server/.env.${suffix}`);
  }
  if (status === 429) {
    return new LlmError(`${providerLabel} is rate-limited right now. Try again in a moment.${suffix}`, { retryable: true });
  }
  if (status === 400) {
    return new LlmError(`${providerLabel} rejected the analysis request.${suffix}`);
  }
  if (status === 503) {
    return new LlmError(`${providerLabel} is overloaded right now. This is usually brief.${suffix}`, { retryable: true });
  }
  if (status >= 500) {
    return new LlmError(`${providerLabel} had a server error. Try again in a moment.${suffix}`, { retryable: true });
  }
  return new LlmError(`${providerLabel} error (${status}).${suffix}`);
}
