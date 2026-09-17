import { API_ENABLED, request } from "./apiClient";
import { ApiError } from "./apiClient";
import { clone, db, delay, emptyModules, nextId, summarise } from "./mock/mockDb";

/*
  Projects. Every function resolves with plain data; projects carry a
  server-derived `summary` ({ fileCount, gapCount, lastAnalysisAt, status }).
*/

const mock = {
  async listProjects() {
    await delay(300);
    return db.projects.map((p) => ({ ...clone(p), summary: summarise(p) }));
  },
  async createProject({ name, objective = "" }) {
    await delay(300);
    const now = Date.now();
    const project = { id: nextId("p"), name: name.trim(), objective: objective.trim(), archived: false, createdAt: now, updatedAt: now };
    db.projects.unshift(project);
    db.filesByProject[project.id] = [];
    db.analysisByProject[project.id] = emptyModules();
    return { ...clone(project), summary: summarise(project) };
  },
  async updateProject(id, patch) {
    await delay(200);
    const project = db.projects.find((p) => p.id === id);
    if (!project) throw new ApiError(404, "Project not found.");
    Object.assign(project, patch, { updatedAt: Date.now() });
    return { ...clone(project), summary: summarise(project) };
  },
  async deleteProject(id) {
    await delay(200);
    db.projects = db.projects.filter((p) => p.id !== id);
    delete db.filesByProject[id];
    delete db.analysisByProject[id];
  },
};

const api = {
  async listProjects() {
    const { projects } = await request("/projects");
    return projects;
  },
  async createProject(values) {
    const { project } = await request("/projects", { method: "POST", body: values });
    return project;
  },
  async updateProject(id, patch) {
    const { project } = await request(`/projects/${id}`, { method: "PATCH", body: patch });
    return project;
  },
  async deleteProject(id) {
    await request(`/projects/${id}`, { method: "DELETE" });
  },
};

const impl = API_ENABLED ? api : mock;

export const listProjects = () => impl.listProjects();
export const createProject = (values) => impl.createProject(values);
export const updateProject = (id, patch) => impl.updateProject(id, patch);
export const deleteProject = (id) => impl.deleteProject(id);
