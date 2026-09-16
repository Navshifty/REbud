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

Phase 1 (frontend architecture) — the prototype UI runs on mock data.
Authentication, uploads, analysis and chat are simulated in the browser;
the backend and AI pipeline come in later phases.

## Tech stack

- React 19 + Vite
- JavaScript / JSX (no TypeScript yet)
- Tailwind CSS v4 via PostCSS
- lucide-react icons
- ESLint

## Getting started

```bash
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run preview`, `npm run lint`.

Demo login: any valid email with the password `correcthorse`.

## Project structure

```
src/
├── components/   # Reusable UI primitives (Button, Field, ScoreRing, ...)
├── data/         # Mock data — the future API contract
├── pages/        # Top-level screens: Landing, Login, Signup
├── styles/       # Design tokens (palette, type stacks)
├── utils/        # Small helpers
├── workspace/    # Research workspace shell (nav, sidebar, upload, panels)
│   └── sections/ # Analysis modules: Overview, Gaps, Novelty, Critique,
│                 # Relevance, Related, Suggestions
├── App.jsx       # View switcher
└── main.jsx      # Entry point
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
2. **Frontend functionality** — navigation, upload/file state, loading,
   empty and error states, responsive polish.
3. **Backend API** — auth, projects, document upload/parsing, analysis
   endpoints, chat.
4. **Research intelligence** — extraction, chunking, embeddings and
   retrieval, structured LLM analysis with citation tracking.
5. **Production engineering** — database, OAuth, security, tests,
   logging, CI/CD, deployment.

## Contributing workflow

`main` → feature branch → meaningful commits → push → pull request →
review → merge. No direct commits to `main`.
