# Portal Financiero — AGENTS.md

## ⚠️ Regla de paridad: web + Android

**Por defecto, casi toda funcionalidad nueva debe implementarse en las dos plataformas: la web (`frontend/`) y la Android (`mobile/`).** Salvo excepciones justificadas, una feature no se considera completa mientras exista solo en una.

- Implementa la misma lógica de negocio en ambas, **adaptando la UI y las APIs de plataforma a cada entorno**:
  - **Web** → React + Vite + Tailwind, React Router, `localStorage`, componentes `Clay*` (`.jsx`).
  - **Android** → Expo + React Navigation, `AsyncStorage`, componentes `Clay*` nativos, respetando la doc versionada de Expo SDK 57 (`mobile/AGENTS.md`).
- Comparte el contrato: ambas consumen los **mismos endpoints** del backend. Si una feature necesita un endpoint nuevo, agrégalo en `backend/` una sola vez y conéctalo desde las dos clientes.
- Mantén la **paridad de comportamiento** (validaciones, textos en español, flujos, estados de carga/error) aunque la presentación difiera.
- Si por una limitación real solo puede ir en una plataforma, **decláralo explícitamente** en el PR/commit y anota aquí la diferencia y el motivo.
- Antes de dar por terminada una feature, verifica ambas: `npm run build` (frontend) y `npx expo export --platform android` (mobile).

## Stack

```
portal-financiero/
├── backend/       Express + Knex + PostgreSQL (Supabase) — Render deploy
├── frontend/      React + Vite + Tailwind + clay neumorphic — Vite dev
└── mobile/        Expo SDK 57 + React Navigation 7 + clay neumorphic
```

## Key commands

**Root** — `npm run dev` starts both backend (`nodemon src/server.js`) and frontend (`vite`) via `concurrently`.

**Backend**
- `npm run dev` — nodemon watch on `src/server.js`
- `npm start` — production start
- `npm run db:migrate` — `knex migrate:latest`
- `npm run db:rollback` — `knex migrate:rollback`
- `npm run db:seed` — `knex seed:run`

**Frontend**
- `npm run dev` — vite dev server (port 5173, proxies `/api` → `localhost:3000`)
- `npm run build` — vite build

**Mobile**
- `npx expo start` — Expo dev server
- `npx expo start --android` — run on Android emulator/device
- No lint/typecheck scripts are configured.

## Deployed endpoints

- **Backend**: `https://portal-financiero-backend.onrender.com/api` (free tier — ~30s cold start)
- **DB**: Supabase at `gxfexdsfrpreftjxcilg.supabase.co`
- **Frontend**: Vite build deployed (no CI/CD config in repo)

## API architecture

`backend/src/server.js` mounts routes under `/api`:
```
/auth       → POST   /login, /register
/categories → GET, POST, PUT, DELETE  (default categories seeded per user)
/budgets    → GET, POST, PUT, DELETE
/incomes    → GET, POST, PUT, DELETE  (user_id from JWT)
/expenses   → GET, POST, PUT, DELETE  (supports four_per_thousand flag + auto-calc amount * 0.004)
/debts      → GET, POST, PUT, DELETE  (payment_day, cut_day for billing cycles)
/savings    → GET, POST, PUT, DELETE
/projections→ GET
/simulations→ simulador engine (computeSimulation over real debts)
/reports    → GET   /cash-flow, /monthly-evolution, /expenses-by-category
/health     → GET   (liveness check)
```

Backend domain logic in `backend/src/utils/`: `simulationEngine.js` (pure `computeSimulation(config, debts)`), `billingCycles.js` (`buildCycles` — cut-day/billing math), `defaultCategories.js`.

JWT token stored in `localStorage.getItem('token')` (frontend) or `AsyncStorage.getItem('token')` (mobile). 401 interceptor clears token and redirects to `/login`.

## Database

Migrations in `backend/migrations/` — Knex-based. `knexfile.js` has `development` (no SSL) and `production` (SSL with `rejectUnauthorized: false`). The `expenses` table has `apply_four_per_thousand` (boolean) and `four_per_thousand_amount` (decimal) columns.

## Frontend (Web)

- React Router v6 with `PrivateRoute`/`PublicRoute` wrappers checking `useAuth()` context
- AuthContext in `src/context/AuthContext.jsx`
- API client in `src/services/api.js` — base URL from `VITE_API_URL` env var, falls back to `/api` (proxied by Vite)
- Tailwind config at `frontend/tailwind.config.js` — includes custom `clay-inset` shadow for neumorphism
- `ClayToggle.jsx` replaces native checkboxes in Egresos and Ingresos
- All UI in Spanish

## Mobile (Android)

- Expo SDK 57 — `mobile/AGENTS.md` warns to read `https://docs.expo.dev/versions/v57.0.0/` before writing Expo code
- React Navigation 7 — `@react-navigation/bottom-tabs` + `@react-navigation/native-stack`
- 4 bottom tabs: Inicio, Egresos, Ingresos, Más (nested stack: Deudas, Ahorros, Reportes, Calculadora, Proyecciones)
- Auth flow: login/register → MainTabs
- API client in `mobile/src/api/client.js` — hardcoded to Render URL (60s timeout for cold start)
- Theme in `mobile/src/theme/index.js` — `clay` object with bg, card, text, shadow, highlight colors
- Reusable components: `ClayCard`, `ClayButton`, `ClayInput`, `ClayToggle`
- All UI in Spanish

## Important gotchas

- No lint, typecheck, or test scripts exist anywhere in the project — rely on export/build to catch errors
- Mobile: run `npx expo export --platform android` to verify Metro bundle compiles without errors
- Render backend has ~30s cold start — mobile client sets 60s timeout to compensate
- Vite proxying only works in dev; production frontend build points to the Render URL via `VITE_API_URL`
- Mobile API URL is hardcoded (not env-based) — change in `mobile/src/api/client.js` line 4
- `knexfile.js` `production` connection expects all `DB_*` env vars (set in Render dashboard)
- `.env` files are gitignored — backend needs `.env` with `JWT_SECRET`, `DB_*` vars
