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

/** Map an HTTP status to a readable message, shared by both providers. */
export function fromStatus(status, providerLabel, detail = "") {
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
  if (status >= 500) {
    return new LlmError(`${providerLabel} had a server error. Try again in a moment.${suffix}`, { retryable: true });
  }
  return new LlmError(`${providerLabel} error (${status}).${suffix}`);
}
