import { API_ENABLED, request } from "./apiClient";
import { CHAT_TOPICS, analysisFor, delay } from "./mock/mockDb";

/*
  AI research chat scoped to a project and an optional topic (module key).
  sendMessage(projectId, { topic, messages }) resolves with
    { message: { role, text, citations }, grounded, source, followUps }
  where `source` is "model" or "sample" and `citations` quote the
  project's own documents.
*/

export const CHAT_SEEDS = Object.fromEntries(Object.entries(CHAT_TOPICS).map(([k, v]) => [k, { title: v.title, seed: v.seed }]));

const mock = {
  async sendMessage(projectId, { topic, messages }) {
    await delay(1100);
    const followups = CHAT_TOPICS[topic]?.followups ?? [
      "I can discuss this project's gaps, novelty estimate, critique, or proposal relevance. Which would you like to dig into?",
    ];
    // Seeded conversations already contain one user turn, so start from the first follow-up.
    const userTurns = messages.filter((m) => m.role === "user").length;
    const index = Math.max(0, Math.min(userTurns - 2, followups.length - 1));
    // Mock replies are canned text, never grounded in real documents.
    void analysisFor(projectId);
    return {
      message: { role: "assistant", text: followups[index], citations: [] },
      grounded: false,
      source: "sample",
      followUps: [],
    };
  },
};

const api = {
  sendMessage(projectId, payload) {
    return request(`/projects/${projectId}/chat`, { method: "POST", body: payload });
  },
};

const impl = API_ENABLED ? api : mock;

export const sendMessage = (projectId, payload) => impl.sendMessage(projectId, payload);
