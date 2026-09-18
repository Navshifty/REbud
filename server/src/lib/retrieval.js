/*
  Lightweight lexical retrieval (BM25) over text chunks.

  Dependency-free on purpose: it needs no embedding provider or extra
  API key, which keeps the pipeline runnable anywhere. The interface
  (buildIndex / search) is the seam for swapping in embeddings later.
*/

const STOPWORDS = new Set((
  "a an and are as at be but by for from has have if in into is it its of on or that the their there these " +
  "this to was were will with we our which who whom what when where why how not no nor so than then them they " +
  "he she his her you your i me my can could would should may might also such via per et al"
).split(" "));

export function tokenize(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** Build a BM25 index over [{ id, text, ...meta }]. */
export function buildIndex(chunks, { k1 = 1.4, b = 0.75 } = {}) {
  const docs = chunks.map((c) => {
    const tokens = tokenize(c.text);
    const tf = new Map();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    return { chunk: c, tf, length: tokens.length };
  });
  const df = new Map();
  for (const d of docs) for (const term of d.tf.keys()) df.set(term, (df.get(term) ?? 0) + 1);
  const avgLength = docs.reduce((s, d) => s + d.length, 0) / (docs.length || 1);
  return { docs, df, avgLength, k1, b, size: docs.length };
}

/** Top-k chunks for a query: [{ chunk, score }], best first. */
export function search(index, query, k = 8) {
  const terms = [...new Set(tokenize(query))];
  if (terms.length === 0 || index.size === 0) return [];
  const { docs, df, avgLength, k1, b } = index;
  const N = docs.length;

  const scored = docs.map((d) => {
    let score = 0;
    for (const term of terms) {
      const f = d.tf.get(term);
      if (!f) continue;
      const n = df.get(term) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      const norm = f * (k1 + 1) / (f + k1 * (1 - b + (b * d.length) / avgLength));
      score += idf * norm;
    }
    return { chunk: d.chunk, score };
  });

  return scored.filter((s) => s.score > 0).sort((a, b2) => b2.score - a.score).slice(0, k);
}
