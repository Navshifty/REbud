/*
  Validation constants shared by the Mongoose schemas and the services,
  so a rule is defined once and cannot drift between the two layers.
*/

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_FILES_PER_PROJECT = 20;
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const ACCEPTED_EXTENSIONS = ["pdf", "docx", "txt", "csv", "md"];
export const ANALYSIS_MODULES = ["overview", "gaps", "novelty", "critique", "relevance", "related", "suggestions"];
export const MODULE_STATUSES = ["idle", "running", "done", "error"];
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
