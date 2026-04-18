# AGENTS.md

## Project Overview

Litmus is a **composable text compliance engine** — a "linter for prose." Users define test packets (bundles of writing criteria), run them against text via Claude, and iterate until everything passes.

**Live demo:** Run `npm run dev` and visit http://localhost:5173/

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite 8
- **UI components:** Ant Design 6
- **Rich text editor:** TipTap (ProseMirror-based, Medium-style)
- **LLM:** Anthropic Claude (model: `claude-sonnet-4-6`) via Vite dev proxy
- **Storage:** localStorage (no backend database)
- **Cloud Functions:** Firebase Cloud Functions (in `functions/`) — not yet deployed, requires Blaze plan
- **Hosting:** Firebase Hosting (configured but not yet deployed)

## Project Structure

```
litmus-app/
├── src/
│   ├── App.tsx                         # Main app shell, layout, welcome modal, tour
│   ├── components/
│   │   ├── Editor/Editor.tsx           # TipTap rich text editor wrapper
│   │   ├── TestRunner/TestRunner.tsx   # Test results panel, run/rewrite buttons
│   │   ├── PacketManager/PacketManager.tsx  # Drawer for CRUD packets
│   │   ├── DemoSwitcher/DemoSwitcher.tsx    # Context dropdown in header
│   │   └── DiffView/DiffView.tsx       # Inline word-level diff for rewrite proposals
│   ├── data/
│   │   └── demoContexts.ts            # 4 pre-loaded demo contexts with sample text
│   ├── hooks/
│   │   └── usePackets.ts              # localStorage-backed packet CRUD + stacking
│   ├── services/
│   │   └── api.ts                     # Claude API calls (evaluate + rewrite)
│   └── types/
│       └── index.ts                   # TypeScript interfaces
├── functions/
│   └── src/index.ts                   # Firebase Cloud Functions (evaluate + rewrite)
├── firebase.json                      # Firebase config (hosting + functions)
├── vite.config.ts                     # Vite config with Anthropic API proxy
└── package.json
```

## Development

```bash
cd litmus-app
npm install
npm run dev          # Starts Vite dev server on http://localhost:5173/
```

### First-time setup
1. Get an Anthropic API key from https://console.anthropic.com/
2. Open the app, click the 🔑 icon in the header, paste the key, and save

### Commands
- `npm run dev` — start dev server with HMR
- `npm run build` — production build (outputs to `dist/`)
- `npm run lint` — run ESLint
- `npx tsc -b --noEmit` — type-check without emitting

## Architecture Decisions

### API key handling (two paths)
- **Dev mode (current):** User enters API key in the browser UI. Stored in localStorage. Requests go through Vite's dev proxy (`/anthropic-proxy` → `https://api.anthropic.com`) to bypass CORS.
- **Production (future):** API key stored as Firebase secret. Browser calls Firebase Cloud Functions which call Anthropic server-side. The client-side key input would be removed.

### Claude response parsing
Claude sometimes returns multiple JSON blocks when it self-corrects mid-response. The parser in `api.ts` extracts all fenced code blocks and uses the **last valid JSON array** — this is always Claude's final/corrected answer. See the `evaluateText` function.

### Error handling pattern
Every error thrown from `api.ts` follows the format: **what happened → what the user should do.** Errors are displayed as Ant Design `Alert` components with a title and description. Error categories:
- 401: bad API key → direct user to Settings
- 400/model: software bug → contact developer
- 429: rate limit → wait and retry
- 503/529: Anthropic overloaded → wait and retry
- Parse failure: retry or contact developer

### Demo contexts
Four pre-loaded contexts in `data/demoContexts.ts`, each with intentional failures in the sample text:
- **Law firm:** uncited claims, speculative language, contractions, missing full legal names
- **Product team:** revenue disclosure, internal codenames, missing benefit statements, verbose features
- **Engineering org:** missing problem statement, undefined acronyms, TODO placeholders, no rollback plan
- **Journalist:** passive voice, unattributed statistics, adjective-laden headline

## Key Interfaces

```typescript
interface TestPacket {
  id: string;
  name: string;
  description?: string;
  criteria: Criterion[];
  createdAt: number;
}

interface Criterion {
  id: string;
  label: string;          // e.g. "No passive voice"
  description?: string;   // Detailed instruction for Claude
}

interface TestResult {
  criterionId: string;
  pass: boolean;
  reasoning: string;      // Claude's explanation
}
```

## localStorage Keys
- `litmus-anthropic-key` — Anthropic API key
- `litmus-packets` — user-created and demo-loaded test packets
- `litmus-onboarded` — whether the welcome modal has been shown

## Firebase Deployment (not yet active)
The project `litmus-compliance` is created but needs the Blaze plan to deploy Cloud Functions:
1. Upgrade at https://console.firebase.google.com/project/litmus-compliance/usage/details
2. `firebase functions:secrets:set ANTHROPIC_API_KEY`
3. `firebase deploy --project litmus-compliance`
4. Update `api.ts` to call Cloud Function URLs instead of the Vite proxy

## Testing Notes
- No automated tests yet — the app was built as a POC/demo
- To manually test: select a demo context → Run Tests → verify pass/fail results → AI Rewrite → review diff → accept → re-run tests → verify all pass
- The welcome modal + tour only shows on first visit (clear `litmus-onboarded` from localStorage to re-trigger)
