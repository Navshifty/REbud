import { API_ENABLED, request, tokenStore } from "./apiClient";
import { ApiError } from "./apiClient";
import { delay } from "./mock/mockDb";

/*
  Authentication. API mode talks to /api/auth; mock mode accepts the demo
  password and keeps a fake session in localStorage so refreshes survive.
  Both return { token, user }.
*/

const MOCK_USER_KEY = "rebud.mockUser";
export const DEMO_PASSWORD = "correcthorse";

function readMockUser() {
  try { return JSON.parse(localStorage.getItem(MOCK_USER_KEY) || "null"); } catch { return null; }
}
function writeMockUser(user) {
  try {
    if (user) localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(MOCK_USER_KEY);
  } catch { /* ignore */ }
}

function nameFromEmail(email) {
  const local = email.split("@")[0].replace(/[._-]+/g, " ").trim();
  return local ? local.replace(/\b\w/g, (c) => c.toUpperCase()) : "Researcher";
}

const mock = {
  async login({ email, password }) {
    await delay(800);
    if (password !== DEMO_PASSWORD) throw new ApiError(401, "Incorrect email or password.", { field: "password" });
    const user = { id: "mock-user", name: nameFromEmail(email), email };
    writeMockUser(user);
    tokenStore.set("mock");
    return { token: "mock", user };
  },
  async signup({ name, email }) {
    await delay(800);
    const user = { id: "mock-user", name, email };
    writeMockUser(user);
    tokenStore.set("mock");
    return { token: "mock", user };
  },
  async me() {
    return tokenStore.get() ? readMockUser() : null;
  },
};

const api = {
  async login(credentials) {
    const result = await request("/auth/login", { method: "POST", body: credentials, auth: false });
    tokenStore.set(result.token);
    return result;
  },
  async signup(details) {
    const result = await request("/auth/signup", { method: "POST", body: details, auth: false });
    tokenStore.set(result.token);
    return result;
  },
  async me() {
    if (!tokenStore.get()) return null;
    try {
      const { user } = await request("/auth/me");
      return user;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return null;
      throw err;
    }
  },
};

const impl = API_ENABLED ? api : mock;

export const login = (credentials) => impl.login(credentials);
export const signup = (details) => impl.signup(details);
/** Current user from the stored token, or null. */
export const me = () => impl.me();

export function logout() {
  tokenStore.clear();
  writeMockUser(null);
}
