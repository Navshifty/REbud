import { badRequest } from "../lib/errors.js";
import { CHAT_REPLIES } from "../data/mockAnalysis.js";
import { CHAT_SCHEMA, CHAT_SYSTEM_PROMPT } from "../data/analysisSchemas.js";
import { getAnalysis } from "./analysis.service.js";
import { getCorpus, renderChunks, resolveCitation, retrieve } from "./corpus.service.js";
import * as llm from "./llm.service.js";

/*
  Research chat scoped to one project and an optional topic (a module key
  such as "gaps" or "novelty").

  With the model configured, each reply is grounded: the question is used
  to retrieve the most relevant document passages, the completed analysis
  for the topic is supplied as context, and the answer comes back with
  citations. Without the model, canned replies are served and flagged.
*/

const MAX_MESSAGES = 50;
const MAX_TEXT = 4000;
const HISTORY_TURNS = 12;

export function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) throw badRequest("Provide a non-empty `messages` array.");
  if (messages.length > MAX_MESSAGES) throw badRequest(`Send at most ${MAX_MESSAGES} messages.`);
  for (const m of messages) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.text !== "string" || !m.text.trim()) {
      throw badRequest("Each message needs a role of user|assistant and non-empty text.");
    }
    if (m.text.length > MAX_TEXT) throw badRequest(`Messages must be at most ${MAX_TEXT} characters.`);
  }
  if (messages[messages.length - 1].role !== "user") throw badRequest("The last message must be from the user.");
}

function cannedReply(project, topic, messages) {
  const analysis = getAnalysis(project.id);
  const key = topic && CHAT_REPLIES[topic] ? topic : "general";
  const replies = CHAT_REPLIES[key];
  const userTurns = messages.filter((m) => m.role === "user").length;
  let text = replies[Math.min(userTurns - 1, replies.length - 1)];
  if (key !== "general" && analysis[key]?.status !== "done") {
    text = `The ${key} analysis hasn't been run for this project yet, so I can only speak generally. Run it from Research Intelligence and ask again for grounded answers.`;
  }
  return { message: { role: "assistant", text, citations: [] }, grounded: false, source: "sample", followUps: [] };
}

/** Compact JSON of the finished analysis modules, most relevant topic first. */
function analysisContext(projectId, topic) {
  const analysis = getAnalysis(projectId);
  const done = Object.entries(analysis).filter(([, m]) => m.status === "done" && m.meta?.source !== "sample");
  if (done.length === 0) return "No analysis modules have been run yet.";
  done.sort(([a], [b]) => (a === topic ? -1 : b === topic ? 1 : 0));
  const parts = done.map(([key, m]) => `### ${key}\n${JSON.stringify(m.data).slice(0, key === topic ? 12000 : 3000)}`);
  return `Completed analysis results (JSON):\n${parts.join("\n\n")}`;
}

async function groundedReply(project, topic, messages) {
  const question = messages[messages.length - 1].text;
  const corpus = await getCorpus(project.id);
  const hits = corpus.chunks.length ? retrieve(corpus, question, 8) : [];
  const passages = hits.length
    ? renderChunks(hits, corpus.sources.filter((s) => hits.some((h) => h.docLabel === s.label)))
    : "No document passages matched the question (or the project has no readable documents).";

  const history = messages
    .slice(-HISTORY_TURNS - 1, -1)
    .map((m) => `${m.role === "user" ? "Researcher" : "REbud"}: ${m.text}`)
    .join("\n");

  const task = [
    `Project: "${project.name}"${project.objective ? `\nStated objective: ${project.objective}` : ""}`,
    topic ? `Discussion topic: ${topic}` : "",
    "",
    "Retrieved passages:",
    passages,
    "",
    analysisContext(project.id, topic),
    "",
    history ? `Conversation so far:\n${history}\n` : "",
    `Researcher's question: ${question}`,
  ].join("\n");

  const { data, usage, model } = await llm.generateStructured({
    system: CHAT_SYSTEM_PROMPT,
    task,
    schema: CHAT_SCHEMA,
    maxTokens: 6000,
    effort: "medium",
  });

  const citations = (data.citations ?? [])
    .map((c) => resolveCitation(corpus, c.chunkId, c.quote))
    .filter(Boolean);

  return {
    message: { role: "assistant", text: data.answer, citations },
    grounded: Boolean(data.grounded) && citations.length > 0,
    followUps: (data.followUps ?? []).slice(0, 3),
    source: "model",
    meta: { model, usage: { inputTokens: usage?.input_tokens ?? 0, outputTokens: usage?.output_tokens ?? 0 } },
  };
}

export async function reply(project, { topic, messages }) {
  validateMessages(messages);
  if (!llm.isConfigured()) return cannedReply(project, topic, messages);
  return groundedReply(project, topic, messages);
}
