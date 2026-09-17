import { badRequest } from "../lib/errors.js";
import { CHAT_REPLIES } from "../data/mockAnalysis.js";
import { getAnalysis } from "./analysis.service.js";

/*
  Research chat scoped to one project and an optional topic (a module key
  such as "gaps" or "novelty"). Replies are canned until Phase 4 grounds
  them in the project's documents and analysis; the request/response
  contract stays the same.
*/

const MAX_MESSAGES = 50;
const MAX_TEXT = 4000;

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

export function reply(project, { topic, messages }) {
  validateMessages(messages);

  const analysis = getAnalysis(project.id);
  const key = topic && CHAT_REPLIES[topic] ? topic : "general";
  const replies = CHAT_REPLIES[key];
  const userTurns = messages.filter((m) => m.role === "user").length;

  let text = replies[Math.min(userTurns - 1, replies.length - 1)];
  if (key !== "general" && analysis[key]?.status !== "done") {
    text = `The ${key} analysis hasn't been run for this project yet, so I can only speak generally. Run it from Research Intelligence and ask again for grounded answers.`;
  }

  return {
    message: { role: "assistant", text },
    // Provenance flag so the UI can distinguish grounded answers later.
    grounded: false,
  };
}
