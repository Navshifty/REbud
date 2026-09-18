import { config } from "../config.js";
import { documents } from "../lib/store.js";
import { chunkText } from "../lib/text.js";
import { buildIndex, search } from "../lib/retrieval.js";
import { readDocumentText } from "./document.service.js";

/*
  The corpus is a project's extracted document text, chunked and indexed.
  Chunk ids (e.g. "D2#7" = document 2, chunk 7) are what the model cites,
  so every finding can be traced back to a passage the user can read.

  Corpora are cached in memory per project and rebuilt when the set of
  extracted documents changes.
*/

const cache = new Map(); // projectId -> { key, corpus }

function corpusKey(docs) {
  return docs.map((d) => `${d.id}:${d.chars}:${d.extraction}`).sort().join("|");
}

export async function getCorpus(projectId) {
  const docs = documents
    .find((d) => d.projectId === projectId && d.extraction === "extracted")
    .sort((a, b) => a.createdAt - b.createdAt);
  const key = corpusKey(docs);
  const cached = cache.get(projectId);
  if (cached && cached.key === key) return cached.corpus;

  const chunks = [];
  const sources = [];
  for (let i = 0; i < docs.length; i += 1) {
    const doc = docs[i];
    const text = await readDocumentText(doc);
    if (!text) continue;
    const label = `D${i + 1}`;
    sources.push({ label, id: doc.id, name: doc.name, type: doc.type, chars: text.length, pages: doc.pages ?? null });
    for (const c of chunkText(text, { size: config.chunkChars, overlap: Math.round(config.chunkChars * 0.11) })) {
      chunks.push({ id: `${label}#${c.index + 1}`, docLabel: label, docId: doc.id, docName: doc.name, index: c.index, text: c.text });
    }
  }

  const corpus = {
    projectId,
    sources,
    chunks,
    index: buildIndex(chunks),
    totalChars: chunks.reduce((s, c) => s + c.text.length, 0),
  };
  cache.set(projectId, { key, corpus });
  return corpus;
}

export function invalidateCorpus(projectId) {
  cache.delete(projectId);
}

/**
 * Choose the chunks to show the model. Small corpora go in whole (in
 * document order); larger ones are narrowed to the chunks most relevant
 * to `queries`, padded with each document's opening chunk so every
 * source is represented.
 */
export function selectChunks(corpus, queries, { maxChars = config.maxContextChars } = {}) {
  if (corpus.totalChars <= maxChars) return corpus.chunks;

  // Every document keeps its opening chunk so no source disappears from view.
  const mustHave = corpus.sources
    .map((s) => corpus.chunks.find((c) => c.docLabel === s.label))
    .filter(Boolean);
  const picked = new Map(mustHave.map((c) => [c.id, c]));
  let budget = maxChars - mustHave.reduce((sum, c) => sum + c.text.length, 0);

  // Then the passages most relevant to the module's questions, best first.
  const perQuery = Math.max(4, Math.ceil(40 / Math.max(1, queries.length)));
  const ranked = [];
  for (const q of queries) for (const hit of search(corpus.index, q, perQuery)) ranked.push(hit);
  ranked.sort((a, b) => b.score - a.score);
  for (const { chunk } of ranked) {
    if (picked.has(chunk.id) || chunk.text.length > budget) continue;
    picked.set(chunk.id, chunk);
    budget -= chunk.text.length;
  }

  // Present in reading order so the model sees documents coherently.
  return [...picked.values()].sort((a, b) => (a.docLabel === b.docLabel ? a.index - b.index : a.docLabel.localeCompare(b.docLabel)));
}

/** Retrieval for chat: the k best chunks for a question. */
export function retrieve(corpus, question, k = 8) {
  return search(corpus.index, question, k).map(({ chunk, score }) => ({ ...chunk, score }));
}

/** Render chunks as the document block the prompts expect. */
export function renderChunks(chunks, sources) {
  const header = sources
    .map((s) => `${s.label}: "${s.name}" (${s.type}${s.pages ? `, ${s.pages} pages` : ""}, ${s.chars.toLocaleString()} chars)`)
    .join("\n");
  const body = chunks.map((c) => `<chunk id="${c.id}" document="${c.docName}">\n${c.text}\n</chunk>`).join("\n\n");
  return `Documents in this project:\n${header}\n\n${body}`;
}

/** Look up a cited chunk id → { document, excerpt } for the response. */
export function resolveCitation(corpus, chunkId, quote) {
  const chunk = corpus.chunks.find((c) => c.id === chunkId);
  if (!chunk) return null;
  return { chunkId, document: chunk.docName, quote: quote || chunk.text.slice(0, 240) };
}
