# REbud

An AI-powered research intelligence and proposal analysis workbench.

Upload a research paper or proposal and get structured intelligence: an
overview, research gaps, a novelty assessment, critical analysis,
proposal relevance, related research, concrete suggestions, and a
context-aware AI discussion about the work.

REbud distinguishes between **evidence extracted from the uploaded
documents**, **AI-generated interpretation**, and **suggestions or
inferences**, so speculative output is never presented as fact.

## Status

Phase 3 (backend API) — the frontend talks to a Node/Express API in
`server/` for authentication (JWT), projects, document upload and
storage, analysis jobs and chat. Analysis and chat results are still
canned on the server; the research-intelligence pipeline that generates
them from document text is Phase 4. Without `VITE_API_URL` the frontend
runs on an in-browser mock backend, so the UI stays usable on its own.

## Tech stack

- React 19 + Vite
- JavaScript / JSX (no TypeScript yet)
- Tailwind CSS v4 via PostCSS
- lucide-react icons
- ESLint
- API: Node 20+, Express 5, JSON Web Tokens, bcryptjs, multer (in `server/`)

## Getting started

**Frontend** (from the repo root):

```bash
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run preview`, `npm run lint`
(lint covers `server/` too).

**API** (in a second terminal):

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Then point the frontend at it: copy `.env.example` to `.env` in the repo
root (it sets `VITE_API_URL=http://localhost:4000/api`) and restart
`npm run dev`. Create an account on the signup page; passwords need 8+
characters with upper, lower and special characters.

**Mock mode** — leave the root `.env` out and the frontend runs entirely
in the browser on sample data. Demo login: any valid email with the
password `correcthorse`.

### API overview

All routes are under `/api`; everything except `/auth/*` and `/health`
needs `Authorization: Bearer <token>`.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/auth/signup`, `/auth/login` | Create an account / log in → `{ token, user }` |
| GET | `/auth/me` | Current user |
| GET, POST | `/projects` | List (with derived `summary`) / create |
| GET, PATCH, DELETE | `/projects/:id` | Read / update name, objective, archived / delete |
| GET, POST | `/projects/:id/documents` | List / upload (`files[]`, multipart) |
| DELETE | `/projects/:id/documents/:docId` | Remove a document |
| GET, POST | `/projects/:id/analysis` | Module states / start modules (202, then poll) |
| POST | `/projects/:id/chat` | `{ topic?, messages }` → assistant reply |

Persistence is a JSON-file store under `server/data/` and uploads live in
`server/uploads/` (both git-ignored). A database replaces the store in
Phase 5 without touching routes or services.

## Project structure

```
src/
├── components/   # Reusable UI primitives (Button, Field, ScoreRing, ...)
├── data/         # Mock data — the future API contract
├── pages/        # Top-level screens: Landing, Login, Signup
├── services/     # Async boundaries (analysis, documents) — mock today, API later
├── styles/       # Design tokens (palette, type stacks)
├── utils/        # Small helpers
├── workspace/    # Research workspace shell (nav, sidebar, upload, panels, dialogs)
│   ├── state/    # workspaceReducer + useWorkspace hook (projects, files, analysis)
│   └── sections/ # Analysis modules: Overview, Gaps, Novelty, Critique,
│                 # Relevance, Related, Suggestions
├── App.jsx       # View switcher + session handling
└── main.jsx      # Entry point

server/
├── src/
│   ├── app.js          # Express app (CORS, JSON, routes, error handling)
│   ├── index.js        # Entry point
│   ├── config.js       # Environment config (.env)
│   ├── lib/            # JSON-file store, HTTP error helpers
│   ├── middleware/     # requireAuth (JWT), loadProject (ownership), errors
│   ├── routes/         # auth, projects, documents, analysis, chat
│   ├── services/       # Business logic behind each route group
│   └── data/           # Canned analysis/chat content (until Phase 4)
├── data/               # JSON store (git-ignored)
└── uploads/            # Stored documents (git-ignored)
```

### Design system

| Token      | Value     |
| ---------- | --------- |
| Ink blue   | `#1C2B45` |
| Cream      | `#F3EEE3` |
| Black      | `#17160F` |
| Soft blue  | `#E4EBF3` |
| Line       | `#D8D2C2` |

Tokens live in `src/styles/tokens.js` (for inline styles) and are
registered with Tailwind in `src/index.css` (`bg-ink`, `text-cream`, …).
Type: Source Serif 4 for headings, IBM Plex Sans for UI, IBM Plex Mono
for numbers.

## Roadmap

1. **Frontend architecture** — refactor the prototype into components. ✅
2. **Frontend functionality** — project management, per-project file and
   analysis state, loading/empty/error states, phone layout. ✅
3. **Backend API** — JWT auth, projects, document upload/storage,
   analysis job endpoints, chat; frontend wired with a mock fallback. ✅
4. **Research intelligence** — extraction, chunking, embeddings and
   retrieval, structured LLM analysis with citation tracking.
5. **Production engineering** — database, OAuth, security, tests,
   logging, CI/CD, deployment.

## Contributing workflow

`main` → feature branch → meaningful commits → push → pull request →
review → merge. No direct commits to `main`.
