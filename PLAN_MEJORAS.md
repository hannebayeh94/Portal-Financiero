# Plan de Mejoras — Portal Financiero

Plan priorizado y accionable para backend, web y mobile. Cada ítem indica archivo(s), qué hacer, por qué y cómo verificar. Los números de línea son la referencia actual y pueden variar tras cada cambio.

**Convenciones**
- **Plataforma**: `B` = backend, `W` = web (frontend), `M` = mobile, `T` = todas.
- **Esfuerzo**: S (2-4h) / M (0.5-1 día) / L (2-3 días).
- **Verificación**: siempre `npm run build` (web) y `npx expo export --platform android` (mobile). Backend: `npm start` + probar endpoints con Postman/curl.
- **Regla de paridad**: cada feature de negocio va en W + M (AGENTS.md).

---

## FASE 0 — Bugs críticos (integridad de datos)

> Prioridad máxima: son errores que corrompen datos o exponen información de otros usuarios.

### 0.1 Transacciones SQL en operaciones multi-query — `B`
- **Archivos**: `backend/src/routes/debts.js` (POST `/:id/payments` ~L300, POST `/:id/charges` ~L368, PUT/DELETE de pagos ~L432-561), `backend/src/routes/savings.js` (registro/update/delete de transacciones ~L107-314).
- **Qué**: envolver todas las escrituras encadenadas (insert pago → update saldo → upsert categoría → insert egreso) en `db.transaction(trx => ...)`. Un fallo intermedio debe revertir todo.
- **Por qué**: hoy un fallo a medias deja el saldo desincronizado de los pagos/egresos.
- **Verificación**: script de prueba que fuerce un fallo en la 3ª operación y confirme rollback.

### 0.2 Validar ownership de `category_id` (fuga cross-tenant) — `B`
- **Archivos**: `backend/src/routes/incomes.js` (~L56, L74), `expenses.js` (~L137, L163), `budgets.js` (~L55), joins en GET de los 3.
- **Qué**: en cada POST/PUT verificar que `category_id` pertenezca a `req.user.id` (SELECT 1 de `categories` antes de insertar). En los GET, scoping del join: `leftJoin('categories', function(){ this.on(...).andOn('categories.user_id', req.user.id) })`.
- **Por qué**: hoy un usuario puede leer el nombre/color de la categoría de otro y referenciarla (viola integridad y privacidad).
- **Verificación**: prueba con dos usuarios, categoría ajena → 400/404.

### 0.3 Bug "Abono a capital" doble resta de interés — `W`
- **Archivo**: `frontend/src/pages/DebtPayoff.jsx:696`.
- **Qué**: cambiar `formatCurrency(Math.max(0, row.capital - row.interest))` por `formatCurrency(Math.max(0, row.capital))`. `row.capital` ya es `totalPayment - interest` (L76,91).
- **Verificación**: caso con tasa 10% mensual; la columna "Abono a capital" debe sumar = capital inicial.

### 0.4 Clamp en `parseInt(months)` (DoS) — `B`
- **Archivos**: `backend/src/routes/projections.js:66`, `reports.js:189,214`.
- **Qué**: validar `months` con `Number.isInteger`, rango 1..120 (igual que `simulationEngine.js:39`) y devolver 400 si no. También `debts.js:42-43` (calculator).
- **Verificación**: `GET /api/projections?...&months=999999999` → 400.

### 0.5 Clamp `remaining_months` y `capitalPortion` negativo — `B`
- **Archivo**: `backend/src/routes/debts.js:314-316,334`.
- **Qué**: `Math.max(0, ...)` en `remaining_months`; si `amount < interestPortion`, no permitir saldo negativo/capital negativo — devolver 400 "El pago no cubre los intereses del mes" o capital = 0 con abono a intereses del siguiente.
- **Verificación**: pago menor que el interés → respuesta coherente, saldo nunca crece por capital negativo.

### 0.6 Prevención de NaN en `four_per_thousand` — `B`
- **Archivo**: `backend/src/routes/expenses.js:131-133`.
- **Qué**: validar `amount` numérico > 0 antes de `Math.round(parseFloat(amount) * 0.004)`.
- **Verificación**: POST egreso con amount inválido → 400 (no 500).

---

## FASE 1 — Seguridad

### 1.1 Rate limiting + validación de auth — `B`
- **Archivo**: `backend/src/server.js`, `backend/src/routes/auth.js`.
- **Qué**: instalar `express-rate-limit`; limitar `/auth/login` y `/auth/register` (p.ej. 10/15 min por IP). Activar `express-validator` (ya instalado): email válido + normalizado (trim/lowercase), password ≥ 8 chars, respuestas de error uniformes.
- **Por qué**: hoy fuerza bruta y enumeración directas; email duplicados case-sensitive.
- **Verificación**: 11 login en 15 min → 429.

### 1.2 JWT: verificación de usuario + refresh/revocación — `B`
- **Archivos**: `backend/src/middleware/auth.js`, `auth.js`.
- **Qué (fase 1)**: en `auth.js` middleware, verificar que el `user_id` del token exista en BD (query ligera) o añadir `jti` + tabla de sesiones revocadas.
- **Qué (fase 2)**: refresh token de larga duración (rotación) + endpoint `/auth/refresh` + revocación en logout. Opcional: restringir algoritmo a `HS256` explícito y `issuer/audience`.
- **Verificación**: borrar un usuario → su token deja de funcionar; refresh fluye sin re-login.

### 1.3 Headers de seguridad + CORS — `B`
- **Archivo**: `backend/src/server.js`.
- **Qué**: instalar `helmet`; CORS con origen explícito (Render URL + localhost dev), no `*`.
- **Verificación**: `curl -I` muestra `X-Content-Type-Options`, etc.

### 1.4 Mobile: lockout PIN + hash — `M`
- **Archivos**: `mobile/src/screens/LockScreen.js:53-64`, `mobile/src/utils/appLock.js:11-14`.
- **Qué**: hash del PIN (p.ej. HMAC-SHA256 con salt en SecureStore), máximo 5 intentos → delay exponencial (10s, 30s, 1min...) y aviso. No permitir PINs triviales ("0000", "1234", repetidos) en `Security.js:34-45`.
- **Verificación**: 5 intentos fallidos → bloqueo con contador.

### 1.5 Mobile: token sin fallback en claro — `M`
- **Archivos**: `mobile/src/context/AuthContext.js:46`, `mobile/src/api/client.js:18-20`.
- **Qué**: eliminar el fallback a `AsyncStorage` para el token (fallar silenciosamente si SecureStore falla, o cifrar manualmente). Mover `user` también a SecureStore si contiene datos personales.
- **Verificación**: desinstalar/limpiar SecureStore → cierre de sesión, no token en claro.

### 1.6 DB: RLS + CHECK constraints + índices — `B`
- **Archivo**: nueva migración `2024...18_security_hardening.js`.
- **Qué**:
  - `ENABLE ROW LEVEL SECURITY` en todas las tablas + policies `USING (user_id = auth.uid())` (para protección en profundidad vía PostgREST/anon key).
  - CHECK: `amount > 0`, `month BETWEEN 1 AND 12`, `payment_day/cut_day BETWEEN 1 AND 31`.
  - Índices en `user_id` de todas las tablas + `debt_payments.debt_id` y `savings_transactions.savings_id` (FK no auto-indexada en PG).
  - `categories.user_id NOT NULL` (migración con backfill si hay nulas).
- **Verificación**: `EXPLAIN` muestra index scan; intento de insert directo a PG sin RLS bypass → denied.

### 1.7 Logging de operaciones financieras — `B`
- **Archivo**: `backend/src/server.js` + middleware.
- **Qué**: logger de requests (morgan) + log estructurado en POST/PUT/DELETE de dinero (pago, cargo, depósito, retiro): userId, acción, monto, timestamp. Sin datos sensibles (no password ni hash).
- **Verificación**: se registran las operaciones con ids.

---

## FASE 2 — Refactor compartido

### 2.1 Backend: capa de amortización única — `B`
- **Archivos**: `backend/src/utils/` (nuevo `amortization.js`), `debts.js:54-75,128-142`, `reports.js:184-207`, `simulationEngine.js:125-172`.
- **Qué**: extraer una única función `amortize({ balance, rate, payment, months })` con las variantes (extra payments, increments) parametrizadas. Usarla en los 4 sitios. Unificar `MONTHS_ES` (`simulationEngine.js:7`) y `MONTHS_ES_SHORT` (`billingCycles.js:9`).
- **Verificación**: mismas salidas que hoy en calculator/projection/report/simulator (golden tests manuales).

### 2.2 Web: componentes CRUD compartidos — `W`
- **Archivos**: `frontend/src/components/` (nuevos): `Modal.jsx`, `ConfirmDialog.jsx`, `EmptyState.jsx`, `Spinner.jsx`, `CategorySelect.jsx`, `MonthYearPicker.jsx`, `FormField.jsx`, hook `useCrud.js` (fetch + create + update + delete + loading + error).
- **Refactor de**: `Expenses.jsx`, `Incomes.jsx`, `Debts.jsx`, `Savings.jsx`, `Budgets.jsx`, `Categories.jsx`, `DebtDetail.jsx`, `SavingsDetail.jsx` — reemplazar los ~6 modales copiados, selects duplicados, pickers mes/año duplicados y `MONTHS` duplicado (mover a `utils/formatters.js`).
- **Verificación**: `npm run build` y repaso manual de cada CRUD (crear/editar/borrar).

### 2.3 Web: setup de Chart.js único — `W`
- **Archivo**: `frontend/src/utils/charts.js` (nuevo): `ChartJS.register(...)` + `chartOptions` base + formato de tooltips.
- **Refactor de**: `Dashboard.jsx:29-40,123-157`, `DebtDetail.jsx:21,236-258`, `DebtPayoff.jsx:31`, `Reports.jsx:20-30`, `Projections.jsx:33`, `Simulator.jsx:31`, `Calculator.jsx:19,84-106`.
- **Verificación**: build + todas las gráficas siguen renderizando igual.

### 2.4 Mobile: componentes compartidos — `M`
- **Archivos**: `mobile/src/components/` (nuevos): `ScreenHeader.jsx`, `BottomSheet.jsx`, `ClaySelect.jsx`, `SegmentedControl.jsx`, `EmptyState.jsx`, `Spinner.jsx`, `useMonthNames` / utilidades en `formatters.js`.
- **Refactor de**: headers duplicados (16 screens), modales bottom-sheet (8), `Picker`/`Picker2` (`Expenses.js:278-308`, `Budgets.js:184-207`), segmented controls (6), `today()` duplicado, arrays de meses (5).
- **Verificación**: `npx expo export --platform android`.

### 2.5 Mobile: hook de datos y refetch consistente — `M`
- **Archivos**: `mobile/src/hooks/useFocusFetch.js` (nuevo), `Expenses.js:47`, `Incomes.js:34`, `Debts.js:65-68`, `Savings.js:42`, `Budgets.js:41`, `Dashboard.js:24`.
- **Qué**: hook basado en `useFocusEffect` + `useCallback` para refetch uniforme al volver a foco (arregla Egresos/Ingresos que no refetchean tras captura automática) y estados de carga/error estándar.
- **Verificación**: navegar y volver en todas las pantallas → datos frescos y spinner consistente.

### 2.6 Web: unificación del tema visual — `W`
- **Archivos**: `frontend/src/index.css`, `tailwind.config.js`, `Reports.jsx` (todo), páginas con estilos inline `var(--clay-*)` (`DebtPayoff.jsx`, `Projections.jsx`, `Simulator.jsx`).
- **Qué (incremental)**: 1) eliminar clases duplicadas (`.card` vs `.clay-card`, `input-field` vs `clay-input`, `btn-*` vs `clay-btn-*`) quedándose con una fuente de verdad (vars CSS + utilidades Tailwind); 2) migrar `Reports.jsx` a la paleta clay; 3) convertir los estilos inline a clases/utilities en las páginas nuevas; 4) eliminar CSS muerto (`claySlideUp`, `clayPulse`, `.text-gradient`) y la clase inexistente `hover:shadow-card-hover`.
- **Verificación**: build + revisión visual de las 18 páginas; no cambia nada funcional.

---

## FASE 3 — Funcionalidad y paridad

### 3.1 Paridad: Categorías en mobile — `M`
- **Archivos**: `mobile/src/screens/Categories.js` (nuevo), navegación en `MoreScreen.js`/`App.js`.
- **Qué**: port de `frontend/src/pages/Categories.jsx` (CRUD de categorías, tipos ingreso/gasto, colores) usando `ClayButton/ClayInput/ConfirmDialog/BottomSheet`.
- **Verificación**: CRUD completo en mobile, backend sin cambios (endpoint ya existe).

### 3.2 Paridad: DebtPayoff en mobile — `M`
- **Archivos**: `mobile/src/screens/DebtPayoff.js` (nuevo), `mobile/src/utils/payoff.js` (port de `computeProjection`), navegación en MoreScreen.
- **Qué**: port de `DebtPayoff.jsx` con el fix 0.3 aplicado (extra payments + increments + tabla de proyección). La tabla larga debe usar FlatList.
- **Verificación**: mismos números que la web con los mismos datos.

### 3.3 Paridad: Proyecciones editable en mobile — `M`
- **Archivos**: `mobile/src/screens/Projections.js` (hoy solo lectura), backend sin cambios.
- **Qué**: port del editor de web (crear/editar/borrar proyecciones, tipo borrador/permanente, comparativa) reusando `useFocusFetch`.
- **Verificación**: CRUD completo en mobile.

### 3.4 Paridad: Reminders + App Lock en web — `W` (declarar excepción)
- **Qué**: revisar si es viable. Notificaciones web (Push API / Web Notifications) solo tienen sentido con Service Worker + HTTPS; App Lock (PIN/biometría) no aplica a web. **Documentar como excepción justificada** en AGENTS.md con su motivo (límite de plataforma), en línea con la regla de paridad.

### 3.5 Búsqueda + filtros en Egresos/Ingresos — `W` + `M`
- **Archivos**: backend (`incomes.js:8-25`, `expenses.js:8-28`: añadir `q` a description/category, límites `limit/offset`); web `Incomes.jsx`/`Expenses.jsx` (input de búsqueda + filtros por tipo/categoría); mobile idem.
- **Por qué**: hoy las listas son planas y sin paginar.
- **Verificación**: filtrar por texto en ambas plataformas devuelve subconjunto correcto.

### 3.6 Paginación backend — `B`
- **Archivos**: `incomes.js`, `expenses.js`, `debts.js`, `savings.js` (GET listados).
- **Qué**: `?page&limit` (default 50) + `total` en respuesta. Compatible hacia atrás (sin `page` → devuelve todo, para no romper pantallas hasta que consuman la paginación).
- **Verificación**: respuesta con `data` + `pagination.total`.

### 3.7 Exportación CSV — `W` (+ opcional `M`)
- **Archivos**: web `Incomes.jsx`/`Expenses.jsx`/`Reports.jsx` (botón "Exportar CSV" con BOM UTF-8 para Excel es-PA); `utils/formatters.js` (`toCsv`, `downloadCsv`).
- **Por qué**: hoy solo hay export/import JSON de escenarios.
- **Verificación**: archivo abre en Excel con $ y ñ correctos.

### 3.8 Dashboard: rango de fechas + cache de queries — `W` + `M`
- **Archivos**: web `Dashboard.jsx:56-62` (5 llamadas en Promise.all sin cache), `Reports.jsx:46-66` (5 llamadas + re-fetch al cambiar año); mobile `Dashboard.js:36`.
- **Qué**: selector de rango (mes/trimestre/año) + cache en memoria/`localStorage` por rango para no refetch al navegar. Estados de error con botón "Reintentar" y no mostrar ceros en silencio.
- **Verificación**: volver a / tras navegar → sin flash de carga; fallo simulado muestra error con retry.

### 3.9 Notificaciones de pagos próximos en web — `W`
- **Qué**: recordatorio visual (badge/listado "Próximos pagos" en Dashboard) reusando `nextDueInfo` de `Debts.jsx:113-123` (con fix de día 29-31). Sin Push por ahora (ver 3.4).
- **Verificación**: deuda con día de pago hoy → aparece en el listado.

### 3.10 Auto-captura: consumir evento push (no polling) — `M`
- **Archivos**: `mobile/modules/notification-listener/index.js:71-73` (canal `onPaymentDetected` sin consumidor), `mobile/src/context/NotificationContext.js:20,49`.
- **Qué**: suscribirse al evento nativo y procesar el pago al instante; mantener polling solo como respaldo. Fijar la referencia del estado para evitar re-renders cada 5s (bug de perf). Añadir límite de items en SharedPreferences (módulo nativo).
- **Verificación**: recibir notificación → modal aparece <1s sin esperar el intervalo.

---

## FASE 4 — Diseño, UX y accesibilidad

### 4.1 Accesibilidad web (ARIA + focus + labels) — `W`
- **Archivos**: todas las páginas con modales y botones ícono.
- **Qué**: `aria-modal`, `role="dialog"`, focus trap y cierre con Escape en modales; `role="switch"` + `aria-checked` en toggles (`Projections.jsx:436-445`, `Simulator.jsx:366-373`); `htmlFor`/`id` en labels; `aria-label` en botones de editar/eliminar; reemplazar `confirm()` nativo por `ConfirmDialog.jsx` (2.2).
- **Verificación**: Lighthouse/axe sin errores de "form fields have labels" y "dialog".

### 4.2 Accesibilidad + haptics mobile — `M`
- **Archivos**: `ClayButton.js`, `ClayToggle.js`, botones ícono, `PinPad.js`.
- **Qué**: `accessibilityLabel`/`accessibilityRole`/`testID` en componentes compartidos; `expo-haptics` en acciones clave (guardar, borrar, dígito de PIN); `hitSlop` en íconos; `Pressable` con estados pressed.
- **Verificación**: TalkBack lee los controles; vibración en guardar/borrar.

### 4.3 Safe areas mobile — `M`
- **Archivos**: 16 headers con `paddingTop: 56`.
- **Qué**: reemplazar por `useSafeAreaInsets()` vía el nuevo `ScreenHeader` (2.4). Instalar `react-native-safe-area-context` si no está.
- **Verificación**: en emulador con notch grande el header no se corta.

### 4.4 Estados de carga/error/vacío uniformes — `W` + `M`
- **Qué**: usar `EmptyState`/`Spinner`/skeletons compartidos (2.2/2.4); nunca mostrar "No hay X" cuando el fetch falló; `ActivityIndicator` (no "Cargando..." texto) en mobile; loading real al cambiar de mes/año (web `Expenses.jsx:51-53`, `Incomes.jsx:57-59`); fix del spinner mal centrado (`Expenses.jsx:180-184`, etc.).
- **Verificación**: simular fallo de red → pantallas con error + retry.

### 4.5 Validación UX de formularios — `W` + `M`
- **Qué**: `min>0` y errores inline en montos (`Expenses.jsx:289`, `Incomes.jsx:259`, `Debts.jsx:310`, `Savings.jsx:271`, `Budgets.jsx:199`, `DebtDetail.jsx:546`, `SavingsDetail.jsx:327`); `end_date > start_date` en deudas; `payment_day/cut_day` 1-31 enteros (mobile `Debts.js:205-206`); botón "Guardar" deshabilitado mientras `await` (evita doble submit en los 6 CRUD); validación de email/contraseña en `Register.jsx`/`Register.js`.
- **Verificación**: enviar formularios inválidos → mensajes claros, no solo console.error.

### 4.6 Rendimiento frontend — `W`
- **Archivos**: `frontend/src/App.jsx:4-19`.
- **Qué**: `React.lazy` + `Suspense` por ruta (18 páginas; chart.js sale del bundle inicial). Cachear instancia de `Intl.NumberFormat` en `formatters.js:1-6`. `useMemo` para objetos de chart y `noPlanProjections` (`Projections.jsx:146-151`). `preconnect` para Google Fonts y mover el `@import` a `<link>`.
- **Verificación**: `npm run build` → bundle inicial cae (reporte `--report`); Lighthouse performance.

### 4.7 Rendimiento mobile — `M`
- **Qué**: convertir listas `.map()` a `FlatList` (`Expenses.js:151`, `Incomes.js:83`, `Debts.js:155`, `DebtDetail.js:219`, `Savings.js:116`, `SavingsDetail.js:209`, `PaymentsHistory.js:124`, `Reports.js:163/196`, `Projections.js:36`, `Simulator.js:329/356`); eliminar estilos inline recreados por render (estilos fuera del componente o `StyleSheet`); fix polling de 5s (3.10).
- **Verificación**: `npx expo export --platform android`; Profiler muestra menos re-renders.

### 4.8 Dark mode — `W` (primero) + `M`
- **Qué web**: CSS variables clay duplicadas en tema oscuro + `prefers-color-scheme` + toggle persistido en `localStorage`; `tailwind.config.js` con `darkMode: 'class'`. Migrar las 3 páginas de estilos inline a vars (2.6) para que hereden el tema.
- **Qué mobile**: `userInterfaceStyle: "automatic"` en `app.json:8`, segunda paleta en `theme/index.js` + `useColorScheme`.
- **Por qué**: bajo costo de prioridad, alta percepción de valor; se recomienda después de 2.6/4.3.
- **Verificación**: alternar tema en ambas plataformas, contraste OK.

---

## FASE 5 — Deuda técnica y limpieza

### 5.1 Web
- Eliminar dependencia muerta `date-fns` (`package.json:15`); funciones muertas `formatDateShort`, `getCurrentMonth` (`formatters.js:16,32`), `updateScenario` (`scenarios.js:52`); import sin uso `DocumentChartBarIcon` (`Reports.jsx:18`); `<a href="/savings">` por `Link` (`Projections.jsx:415`); validación de shape al importar escenarios (`scenarios.js:73-102`); favicon: crear `frontend/public/` con `vite.svg`.
- `AuthContext.jsx`: limpiar escenarios locales al logout; logout con estado limpio.

### 5.2 Mobile
- Eliminar deps sin uso `expo-device`, `expo-updates` (`package.json:13,18`); código muerto `clearAll` (`NotificationContext.js:81-84`), `lockNow` (`AppLockContext.js:46`), `isListening`/`addPaymentListener` (si 3.10 no los usa), `getCurrentYear` (`formatters.js:37`); `remaining_months` que se envía sin uso (`Debts.js:86`); `.gitignore` añadir `.expo/` y `.expo-shared/`.

### 5.3 Backend
- Quitar `const db = require('./db')` muerto (`server.js:4`); tabla muerta `business_payments` (migración 10): eliminar o documentar; `role` en JWT sin uso: quitar o implementar RBAC; sincronizar AGENTS.md (endpoint `/expenses/by-category` vs `/reports/expenses-by-category`); `seeds/` vacío: añadir seed de categorías por defecto o quitar el script; `.env.example` sin secrets reales como defaults.
- Middleware de error global + 404 handler (`server.js`): evitar try/catch repetido en los 8 routers.

### 5.4 Automatización
- **Tests**: añadir mínimo un script de test en backend con Node built-in `node:test` + `supertest` para: auth, cálculo de amortización, transacciones (0.1), ownership (0.2). En web/mobile: al menos `npm run build`/`expo export` ya existen como smoke test — documentarlos.
- **Lint**: opcional `eslint` en frontend/backend (flat config) para capturar imports muertos.
- **CI**: workflow GitHub Actions: build backend + web + `expo export` en cada PR (sin deploy).

---

## Orden de ejecución sugerido

| Sprint | Alcance |
|---|---|
| 1 | Fase 0 completa (integridad de datos) |
| 2 | Fase 1 (seguridad backend + mobile) |
| 3 | Fase 2 (refactor compartido B/W/M) |
| 4 | Fase 3 (paridad + búsqueda/paginación/export) |
| 5 | Fase 4 (UX/rendimiento/dark mode) |
| 6 | Fase 5 (limpieza + tests + CI) |

**Criterio de terminado por ítem**: build/expo export verdes + prueba manual del flujo en ambas plataformas cuando aplique + actualizar AGENTS.md si cambia contrato (endpoints, excepciones de paridad).
