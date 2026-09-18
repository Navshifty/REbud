/*
  Plain-text utilities for the research pipeline: normalisation and
  chunking. Chunks are the unit of retrieval and of evidence citation.
*/

/** Collapse odd whitespace while keeping paragraph breaks. */
export function normaliseText(text) {
  return String(text ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Split text into overlapping chunks, preferring paragraph and sentence
 * boundaries. Returns [{ index, start, end, text }] with character offsets
 * into the normalised text.
 */
export function chunkText(text, { size = 1800, overlap = 200 } = {}) {
  const clean = normaliseText(text);
  if (!clean) return [];
  if (clean.length <= size) return [{ index: 0, start: 0, end: clean.length, text: clean }];

  const chunks = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + size, clean.length);
    if (end < clean.length) {
      // Prefer to break at a paragraph, then a sentence, then a word.
      const window = clean.slice(start, end);
      const cut = Math.max(
        window.lastIndexOf("\n\n"),
        window.lastIndexOf(". "),
        window.lastIndexOf(".\n"),
      );
      if (cut > size * 0.5) end = start + cut + 1;
      else {
        const space = window.lastIndexOf(" ");
        if (space > size * 0.5) end = start + space;
      }
    }
    const piece = clean.slice(start, end).trim();
    if (piece) chunks.push({ index: chunks.length, start, end, text: piece });
    if (end >= clean.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}

/** Rough token estimate (≈4 chars per token for English prose). */
export function estimateTokens(text) {
  return Math.ceil(String(text ?? "").length / 4);
}
