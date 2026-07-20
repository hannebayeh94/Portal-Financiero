# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read AGENTS.md first

`AGENTS.md` (repo root) is the primary contract for this project — commands, the web+mobile parity rule, API layout, deploy targets, and gotchas. Read it before making changes. This file adds architecture that AGENTS.md predates and flags where the code has drifted from it. `mobile/AGENTS.md` warns: **read the versioned Expo docs at https://docs.expo.dev/versions/v57.0.0/ before writing any mobile/Expo code** — Expo SDK 57 has breaking changes from prior versions.

## The parity rule (non-negotiable)

Almost every business feature ships to **both** `frontend/` (web) and `mobile/` (Android), sharing the same backend endpoints. A feature is not done until it exists on both, with matching behavior (validations, Spanish text, loading/error states) even where the UI differs. Backend endpoints are written once and consumed by both clients. If a feature can only go on one platform, say so explicitly in the commit/PR and note it in `AGENTS.md`. Verify both before finishing: `npm run build` (frontend) and `npx expo export --platform android` (mobile).

All UI text is in Spanish. Currency is COP (Colombian pesos).

## Commands

From repo root: `npm run dev` runs backend + frontend together via `concurrently`. Per-workspace commands (backend/frontend/mobile) are in `AGENTS.md` §Key commands.

There are **no lint, typecheck, or test scripts** anywhere in the repo. The build/export steps above are the only automated correctness gate — use them.

## Architecture beyond AGENTS.md

AGENTS.md's API list is stale. `backend/src/server.js` currently mounts, all under `/api`:
`auth`, `categories`, `budgets`, `incomes`, `expenses`, `debts`, `savings`, `projections`, `simulations`, `reports`, plus `/api/health`. Each route file lives in `backend/src/routes/`; `user_id` comes from the JWT via `middleware/auth.js`. `db.js` is the shared Knex instance.

Backend domain logic lives in `backend/src/utils/`:
- `simulationEngine.js` — pure function `computeSimulation(config, debts)` returning month-by-month projection (`months`, `alerts`, `summary`). No DB access; the `simulations` route supplies real debts. This is the core of the "Simulador" feature (recent work — see git log).
- `billingCycles.js` — `buildCycles(...)`, credit-card cut-day / billing-cycle math used by both the simulator and the debts feature.
- `defaultCategories.js` — categories seeded per new user (also backfilled by migration `...014_seed_categories_existing_users`).

DB schema is defined only by Knex migrations in `backend/migrations/` (chronological `2024...` prefixes). To understand a table, read its migration. `knexfile.js` has `development` (no SSL) and `production` (SSL, `rejectUnauthorized:false`); production reads all `DB_*` env vars.

## Web ↔ mobile file mapping

Both clients mirror the same feature set with parallel files:
- Web pages: `frontend/src/pages/*.jsx` (React Router v6, `PrivateRoute`/`PublicRoute` via `useAuth()`, `AuthContext.jsx`).
- Mobile screens: `mobile/src/screens/*.js` (React Navigation 7 — 4 bottom tabs Inicio/Egresos/Ingresos/Más; Más nests Deudas, Ahorros, Reportes, Calculadora, Proyecciones, etc.).
- Shared "clay" neumorphic design language: web `Clay*.jsx` components + `tailwind.config.js` (`clay-inset` shadow); mobile `Clay*` components + `mobile/src/theme/index.js`.
- Formatting helpers: `frontend/src/utils/formatters.js` and `mobile/src/utils/formatters.js`.

When adding a feature, expect to touch the matching file on each side (e.g. `pages/Simulator.jsx` ↔ `screens/Simulator.js`).

## API clients & auth

- Web: `frontend/src/services/api.js` — base URL from `VITE_API_URL`, falls back to `/api` (Vite dev-proxies `/api` → `localhost:3000`). Token in `localStorage`. 401 → clear token, redirect `/login`.
- Mobile: `mobile/src/api/client.js` — base URL **hardcoded** to the Render URL (line 5), 60s timeout for Render's ~30s cold start. Token read from `expo-secure-store`, falling back to `AsyncStorage`; 401 clears both. To point mobile at a local backend, edit that line.

## Mobile-only capabilities

- Native module `mobile/modules/notification-listener/` (Kotlin/Expo module) reads Android bank notifications (Nu, Bancolombia, Nequi, Daviplata, Rappi) to auto-detect payments → `AutoExpenseModal` / `NotificationContext`. Requires a real native build (**EAS Build**, not Expo Go). Do not commit its `android/build/` artifacts.
- App lock: `AppLockContext` + `LockScreen` + `PinPad`, using `expo-local-authentication` (biometrics) and `expo-secure-store`.
- Reminders: `RemindersContext` + `expo-notifications` (`utils/reminders.js`).
