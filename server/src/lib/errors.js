/* HTTP-aware error type and helpers shared by routes and services. */

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message, details) => new HttpError(400, message, details);
export const unauthorized = (message = "Authentication required.") => new HttpError(401, message);
export const forbidden = (message = "You don't have access to this resource.") => new HttpError(403, message);
export const notFound = (message = "Not found.") => new HttpError(404, message);
export const conflict = (message) => new HttpError(409, message);

/** Wrap an async route handler so rejections reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Throw 400 unless `value` is a non-empty string; returns the trimmed value. */
export function requireString(value, field, { min = 1, max = 500 } = {}) {
  if (typeof value !== "string" || value.trim().length < min) {
    throw badRequest(`${field} is required.`, { field });
  }
  if (value.trim().length > max) {
    throw badRequest(`${field} must be at most ${max} characters.`, { field });
  }
  return value.trim();
}
