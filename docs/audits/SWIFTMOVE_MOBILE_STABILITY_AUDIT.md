# SwiftMove Mobile Stability Audit

Date: 2026-11-20
Scope: Local repository audit before implementation

## Git safety

`git status --short` showed an extensively modified working tree before this task. Relevant user-owned changes include `Frontend/src/components/layout/Header.jsx`, `PortalLayout.jsx`, `Frontend/src/tailwind.css`, dashboard files, package manifests/lockfiles, and other files. These were inspected and are treated as protected. Existing Android signing files were not read for their credential contents or modified. No branch, deployment, or external service settings were changed.

## Findings

| Issue | Root cause | Evidence | Affected files | Proposed fix |
|---|---|---|---|---|
| Dark mode | The current working-tree change removed global dark compatibility rules for legacy utility classes. Several existing dashboard and page components still use light-only classes such as `bg-white`, `bg-gray-50`, and `text-gray-900`, leaving light panels/text inside a dark app. The theme itself is class based and stored, but when no stored value exists it always initializes to light instead of the system preference. | `Frontend/tailwind.config.js` uses `darkMode: "class"`. `Frontend/src/store/appContext.jsx` reads `swiftmove-theme`, defaults to light, applies `.dark` before React renders, and persists subsequent state. The diff in `Frontend/src/tailwind.css` removes the legacy `.dark` compatibility block. Examples still lacking dark variants include `ProviderDashboard.jsx`, `AdminDashboard.jsx`, and public informational pages. | `Frontend/src/store/appContext.jsx`; `Frontend/src/tailwind.css` (already modified by user; avoid overwriting); legacy UI screens listed above | Respect OS theme only when no saved choice exists. Add a separately imported dark compatibility stylesheet for the legacy neutral utility classes, avoiding edits to the user-modified global stylesheet and preserving explicit `.dark:*` variants. |
| Receipt download | The current receipt action opens a popup and invokes browser printing. Android Capacitor uses a WebView with no installed filesystem/share/print plugin, where `window.open()`/`window.print()` is not a reliable downloadable-PDF mechanism. The authenticated backend receipt route returns JSON, not a PDF or downloadable file. | `PaymentReceiptButton.jsx` opens `about:blank`, writes HTML, and calls `print()`. `payment.service.js` uses the JSON API helper. `payment.routes.js` protects `GET /:paymentId/receipt`; `getPaymentReceipt` verifies payment ownership/paid state and returns receipt JSON. Android dependencies list only Capacitor App/Core and the manifest has Internet permission; there is no download plugin setup. | `Frontend/src/components/payments/PaymentReceiptButton.jsx`; `Frontend/src/services/payment.service.js`; `Frontend/src/services/api.js`; `Backend/src/routes/payment.routes.js`; `Backend/src/controllers/payment.controller.js`; Android plugin config | Preserve the existing ownership/eligibility checks and JSON response; generate a valid PDF client-side and save/share through the existing Capacitor-supported platform mechanism if available, while retaining a desktop blob download. First check current installed modules and Capacitor 8 compatibility; avoid weakening authorization or exposing receipt data in URLs. |
| API performance | The client applies one fixed 10-second abort timeout to every endpoint, regardless of endpoint or operation. The backend has no request-duration instrumentation, so the repository cannot distinguish app processing, database, gateway, or Render cold-start delay. Staging latency could not be measured from this environment. | `Frontend/src/constants/config.js` defines `timeout: 10000`; `services/api.js` applies it to every request, and if a caller supplies `options.signal`, the timeout controller is not the signal passed to `fetch`. Backend middleware has no timing logs. Dashboard reads are already parallel and paginated; payment history has supporting indexes, and dashboard/model query paths include relevant indexes. Staging health request failed to connect from this execution environment (441 ms connection failure), so no response-time numbers are available. | `Frontend/src/services/api.js`; `Frontend/src/constants/config.js`; `Backend/server.js`; `Backend/src/controllers/dashboard.controller.js`; relevant models | Fix composed abort/timeout behavior and provide endpoint-appropriate bounded timeouts without retrying non-idempotent operations. Add privacy-safe server request timing/status logging. Keep already indexed and parallel dashboard queries intact; use measured staging/local evidence before changing query patterns or adding indexes. |

## Architecture trace

- Frontend entry: `src/main.jsx` mounts `AppProvider`, `SocketProvider`, and `AppRouter`.
- Theme: Tailwind class strategy; app context sets `html.dark`, sets `colorScheme`, and stores `swiftmove-theme` in local storage.
- API: centralized `fetch` service at `src/services/api.js`; bearer token is read from local storage; all requests currently use the same 10-second timeout. No global retries are present.
- Receipt: customer payment history exposes an eligibility flag; the receipt endpoint requires JWT plus the `user` role and scopes payment, move, payment order, and customer lookups to the authenticated user. The frontend creates an HTML document in a popup and invokes print.
- Backend: Express CORS and JSON parsing precede mounted routes; payment receipt route is protected; MongoDB is connected before the server listens. Dashboard query fan-out already uses `Promise.all` and bounded pagination. Existing models define indexes for common dashboard/history sorts and filters.
- Android: Capacitor 8 project, package `com.swiftmove.app`, `BridgeActivity`, Internet permission, no Filesystem/Share plugin dependency or custom download listener. Gradle wrapper / AGP values are project-owned and left unchanged.

## Measurement limits

The staging backend could not be contacted from this environment. No authenticated staging transactions, receipt downloads, browser console, Render logs, or Android Logcat were available here. Thus no live before/after endpoint latency values can be reported. The implementation should emit safe server timing evidence for future staging verification; local builds/tests can establish compatibility but cannot prove Render cold-start or database latency.

## Implementation and verification addendum

Implemented after the audit:

- Theme preference now remains `system` until the user chooses light or dark. The initial HTML class is still applied before React renders; saved explicit choices persist and system changes are observed only while the preference is `system`.
- Dark compatibility rules now live in a new standalone stylesheet, leaving the pre-existing user edit to `tailwind.css` intact. Legacy neutral surfaces/text/borders/inputs and common status colors are covered, while explicit dark utility classes retain priority.
- Android receipt output uses a small Capacitor bridge to Android's built-in `PrintManager`. The authenticated receipt JSON endpoint and its ownership checks remain unchanged. Desktop keeps the existing browser print flow; both print dialogs can save a PDF using a filename based on the stable receipt reference. No plugin/package dependency or storage permission was added.
- API request cancellation now composes the caller's abort signal with the existing bounded timeout and keeps the timeout active through response-body parsing. HTTP statuses remain attached to errors; no retries or timeout increases were added.
- Backend logs one JSON timing record per completed routed request with method, route template, status, and elapsed milliseconds. No request headers, query values, body, or identity are logged.

Verification performed:

- Frontend production build: passed (existing Vite chunk-size warning remains).
- Frontend automated tests: 32 passed.
- Backend automated tests: 148 passed.
- Backend syntax checks for server and request timing middleware: passed.
- Android debug build: not completed. The initial wrapper attempt could not write to `C:\.gradle`; using a writable temp Gradle home then failed because the sandbox cannot connect to `services.gradle.org` to download the configured Gradle 8.14.3 distribution.
- Staging health request: not reachable from this environment. No live latency numbers or Android device/Logcat confirmation are available.
