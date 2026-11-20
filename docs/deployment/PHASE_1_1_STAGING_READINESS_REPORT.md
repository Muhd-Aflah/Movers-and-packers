# SwiftMove Phase 1.1 â€” Staging Readiness Review

**Review date:** 2026-11-13  
**Scope:** Phase 1 reports, current tracked and untracked source changes, staging configuration surface, and official Geoapify, Razorpay Route, and MongoDB documentation.  
**Change boundary:** This review did not modify application source, configuration, database contents, or deploy anything. Only this report is being added. The worktree already contained substantial uncommitted Phase 1 and earlier changes; these have been preserved. No `.env` values were read. No credentials, database, Geoapify, Razorpay, Vercel, or Render integration was exercised.

## Executive decision

**Staging readiness is not complete.** The app has a coherent standard Razorpay checkout path with server-calculated order amounts, but staging payment and routing are not verified against external services. No Razorpay Route accounts, transfers, holds, refund/reversal, webhook, or reconciliation flow exists. Pricing is intentionally disabled until the owner supplies approved rates. The current mover role is self-selectable and immediately grants job APIs. Geoapify uses the first geocoding result without confidence review. CORS and proxy configuration do not yet identify the staging frontend and deployed proxy topology.

The repositoryâ€™s Phase 1 reports broadly reflect the current code, but their local mocked test results are not evidence of live MongoDB concurrency, external payment, geocoding/routing, or deployed behavior. This review made no test or live-service calls.

## Current architecture and workflow as observed

1. The React/Vite frontend calls an Express API using `VITE_API_URL`; the browser uses the public Razorpay key ID to open checkout.
2. The backend validates booking details, resolves addresses through Geoapify, calculates the configured price, and persists a pricing snapshot on a move. Missing pricing configuration returns no price.
3. The backend creates a Razorpay order from the saved move amount/currency. Payment verification validates the Razorpay signature, fetches order/payment state from Razorpay, and writes PaymentOrder, Payment, and Move state separately.
4. A mover with the `mover` role can list paid jobs, accept one atomically, and progress accepted â†’ in progress â†’ completed.
5. Admin routes are read-only for mover and payment records. There is no mover approval decision endpoint and no settlement or refund workflow.

## Findings

### CRITICAL

No current critical vulnerability was confirmed from the reviewed code. The issues below are staging blockers because they prevent the expected controlled workflows or leave authorization/financial state incomplete.

### HIGH

#### H1 â€” Any new user can activate mover capabilities at signup

- **Location:** [auth.controller.js](../../Backend/src/controllers/auth.controller.js#L37), [User.model.js](../../Backend/src/models/User.model.js#L24), [provider.routes.js](../../Backend/src/routes/provider.routes.js#L16), [SignupPage.jsx](../../Frontend/src/pages/SignupPage.jsx#L11)
- **Problem / cause:** Public signup accepts `role: "mover"`, creates that role immediately, and provider routes authorize solely by the JWT role. There is no application status, verification state, or admin approval mutation endpoint. Adminâ€™s provider list counts every mover as an active provider.
- **Impact:** A self-registered mover can see customer contact details for paid unassigned jobs and attempt to claim them. Staging cannot exercise a trusted mover-onboarding/approval flow.
- **Recommended solution:** Add an explicit mover approval state and an admin-only approve/reject workflow; enforce approval in middleware on every provider API, independently of frontend role routing. Keep customer account creation/login compatible. New mover signups should be pending. For existing records, first inventory existing mover accounts and make an owner-approved migration decision: grandfather verified accounts as approved and place unverified accounts into review. Do not make the new schemaâ€™s default silently block every existing mover or silently approve accounts without an explicit policy. Preserve existing account IDs, login, and assigned jobs. Record approver, timestamp, and decision reason. This is a recommendation only; no implementation was made.
- **Related files:** `Backend/src/models/User.model.js`, `Backend/src/controllers/auth.controller.js`, `Backend/src/routes/provider.routes.js`, `Backend/src/middleware/role.middleware.js` or a new approval middleware, `Backend/src/routes/admin.routes.js`, `Backend/src/controllers/admin.controller.js`, `Frontend/src/pages/SignupPage.jsx`, `Frontend/src/pages/admin/AdminProvidersPage.jsx`, plus a staged migration/backfill plan.

#### H2 â€” Payment success depends on browser return; no webhook/reconciliation exists

- **Location:** [payment.routes.js](../../Backend/src/routes/payment.routes.js#L7), [payment.controller.js](../../Backend/src/controllers/payment.controller.js#L59), [payment.controller.js](../../Backend/src/controllers/payment.controller.js#L218), [PaymentOrder model](../../Backend/src/models/paymentOrder.model.js#L1)
- **Problem / cause:** The only payment finalization path is authenticated `/verify`, called after browser checkout. There is no Razorpay webhook route, signature verification for webhook payloads, event deduplication, or scheduled reconciliation process. The controller also calls Razorpay and then persists PaymentOrder, Payment, and Move separately; the external call cannot be covered by a MongoDB transaction.
- **Impact:** A captured payment with a closed browser, failed network response, or backend interruption can remain locally unconfirmed and invisible to movers. Some partial writes can require manual repair. A retry can help in covered cases, but there is no independent source of eventual correction.
- **Recommended solution:** Before inviting staging customers, implement signed payment/order webhook handling and an idempotent reconciliation path that fetches gateway state and repairs local records. Persist the gateway event ID and processing result for deduplication. Preserve the existing callback as a fast path, not the sole authority. Use a MongoDB transaction for the related local state updates only if the staging/production Mongo topology supports it; design idempotent recovery for the gateway/Mongo boundary.
- **Related files:** payment controller/routes, PaymentOrder/Payment models, Move model, `server.js` raw-body handling for webhook signature validation, background job/worker setup, and operational runbook/alerts.

#### H3 â€” No actual mover settlement exists; local `releaseStatus` is not a funds status

- **Location:** [Payment model](../../Backend/src/models/payment.model.js#L56), [payment.controller.js](../../Backend/src/controllers/payment.controller.js#L59), [provider.controller.js](../../Backend/src/controllers/provider.controller.js#L75)
- **Problem / cause:** Payment has a `releaseStatus` field whose default is `held`, but there are no Route transfer calls, linked-account IDs, settlement-hold calls, settlement webhooks, refunds, or reconciliation. No code marks it released, and the model comment correctly says it does not reflect actual funds custody.
- **Impact:** The app cannot pay movers or demonstrate settlement. Any user-facing/admin interpretation of `held` as a Razorpay hold would be false. Job completion currently changes only the Move status and does not create a payable transfer.
- **Recommended solution:** Keep Route disabled until Razorpay eligibility/account activation, mover onboarding/KYC, currency, fee/commission split, when-to-transfer, hold duration/release conditions, failed-transfer operations, refund/reversal policy, and accounting/reconciliation ownership are confirmed. Then create a separate durable transfer/settlement ledger keyed to Razorpay IDs and state; update it only from verified API responses/webhooks/reconciliation. Do not infer settlement from job completion or update `releaseStatus` to simulate a payout.
- **Related files:** payment models/controllers/routes, `Backend/server.js`, mover account model/onboarding, admin settlement visibility, job completion path, webhook/background worker configuration, and finance/support operations documentation.

#### H4 â€” No accepted staging configuration for CORS, proxy depth, and isolated service credentials

- **Location:** [server.js](../../Backend/server.js#L10), [server.js](../../Backend/server.js#L41), [Frontend config](../../Frontend/src/constants/config.js#L32), [Backend env example](../../Backend/.env.example#L1), [Frontend env example](../../Frontend/.env.example#L1)
- **Problem / cause:** Backend CORS origins are hard-coded to production Vercel, localhost, and the current Render backend origin; no staging frontend origin is included or environment-configured. `TRUST_PROXY_HOPS` defaults to `0`, which may not reflect Renderâ€™s actual proxy path. The repo contains no deployment manifest/CI definition that proves staging runtime variables, build settings, or health checks are configured.
- **Impact:** Staging browser requests may fail CORS. If proxy depth is wrong, clients can share one rate-limit identity or forwarding headers can be trusted too broadly. The required isolation and test-mode nature of the staging services cannot be verified from source.
- **Recommended solution:** Set the exact staging frontend origin in a controlled CORS allowlist/configuration and verify preflight and authenticated requests. Determine trusted proxy hops from the actual hosting topology and set `TRUST_PROXY_HOPS` accordingly. Provision a separate non-production Mongo database, staging-only Razorpay test keys, staging Geoapify key, backend environment secrets, and frontend build-time Vite values. Add a deployment health check and document the exact runtime/build commands. Never use production data or keys in this test.
- **Related files:** `Backend/server.js`, backend deployment settings, frontend Vercel project/environment settings, `Backend/.env.example`, `Frontend/.env.example`, and deployment/runbook docs.

### MEDIUM

#### M1 â€” Geoapify returns one candidate and the app routes it without checking confidence

- **Location:** [pricing.service.js](../../Backend/src/services/pricing.service.js#L100)
- **Problem / cause:** Geocoding requests set `limit=1`, then accept `features[0]` when coordinates exist. The code saves the formatted result but does not inspect `rank.confidence`, street/building confidence, match type, or whether multiple candidates are plausible. The free-form search does not constrain the search to a service country/area.
- **Impact:** A valid-looking but wrong city/street/building can produce a route distance and price for the wrong journey. This is especially risky for common street names, misspellings, or incomplete addresses.
- **Recommended solution:** Request several candidates, apply country and geographic service-area filters once the owner confirms service regions, compare normalized input/query components, and use documented confidence fields. Automatically accept only a product-approved precision level; show multiple plausible candidates and require explicit customer selection for medium confidence; reject unresolved, city-only, or low-confidence results. Save the chosen provider place IDs/coordinates and resolved labels into the quote/move snapshot. Thresholds must be selected from representative SwiftMove addresses, not copied blindly from examples. Keep the current fail-closed behavior for no route/provider errors.
- **Related files:** `Backend/src/services/pricing.service.js`, pricing controller/routes, `Move` pricing snapshot schema, booking address inputs and quote UI.

#### M2 â€” Process-local IP rate limiting is not fleet-wide and depends on proxy configuration

- **Location:** [rateLimit.middleware.js](../../Backend/src/middleware/rateLimit.middleware.js#L1), [auth.routes.js](../../Backend/src/routes/auth.routes.js#L8), [pricing.routes.js](../../Backend/src/routes/pricing.routes.js#L1), [server.js](../../Backend/server.js#L41)
- **Problem / cause:** Limits use an in-process `Map` keyed by `req.ip`, with no shared store and no identity-level login throttling. Each server instance has independent buckets; the 10,000-entry capacity responds with 503 when it cannot evict live buckets. Client IP derivation relies on Express `trust proxy` being set correctly.
- **Impact:** Horizontal scaling multiplies effective limits; restarts reset them; a deployment proxy misconfiguration can cause legitimate users to share limits or allow spoofable forwarded IP behavior. A login-targeted attack distributed across source IPs is not constrained per account.
- **Recommended solution:** For a single controlled staging instance, configure and exercise the proxy identity behavior and monitor 429/503 outcomes. Before multi-instance or public use, use a shared rate-limit store with bounded expiry and a considered account/email key for login attempts while avoiding user lockout abuse. Set alerting on limiter capacity/evictions.
- **Related files:** rate limiter, auth/pricing routes, deployment proxy settings, and staging monitoring.

#### M3 â€” Multi-document payment state has no database transaction or unique per-move payment invariant

- **Location:** [payment.controller.js](../../Backend/src/controllers/payment.controller.js#L218), [Payment model](../../Backend/src/models/payment.model.js#L7), [PaymentOrder model](../../Backend/src/models/paymentOrder.model.js#L7), [Move model](../../Backend/src/models/move.model.js#L73)
- **Problem / cause:** A conditional single-document Move lock serializes normal order creation/verification, but writes to PaymentOrder, Payment, and Move are separate. `razorpayPaymentId` and `razorpayOrderId` are unique; there is no unique constraint for a successful payment per Move. The five-minute lock is a lease and does not solve a process pause/network timeout longer than its expiry or remote success followed by local persistence failure.
- **Impact:** Local status may temporarily diverge after partial failure or lock expiry; duplicate legacy payments/orders could complicate recovery. Mocked controller tests do not prove cross-process Mongo behavior.
- **Recommended solution:** Inspect staging DB topology and indexes before migration. If adding a transaction for local updates, use a replica set or sharded deployment; MongoDB standalone does not support multi-document transactions. Keep gateway calls outside the transaction and make the reconciliation operation idempotent. Audit existing duplicate rows before adding a unique partial index for one successful payment per Move. Use explicit idempotency/business-operation IDs when supported by each Razorpay endpoint.
- **Related files:** PaymentOrder/Payment/Move schemas, payment controller, migration scripts, MongoDB deployment/backup config, webhook and reconciliation service.

#### M4 â€” No refund/cancellation/dispute process exists, despite payment schema states

- **Location:** [Payment model](../../Backend/src/models/payment.model.js#L49), [payment.routes.js](../../Backend/src/routes/payment.routes.js#L1), [move.model.js](../../Backend/src/models/move.model.js#L51)
- **Problem / cause:** Payment enum includes `refunded`, and Move includes `cancelled`, but there are no routes/controllers that issue refunds, reverse a Route transfer, enforce eligibility, or reconcile refund outcomes. The customer-facing cancellation/review controls were removed in Phase 1, so no active button was seen in the reviewed flow.
- **Impact:** A staging tester cannot safely complete cancellation/refund cases; adding a refund manually in Razorpay would leave the local payment/move ledger wrong. A Route transfer reversal is separate from the customer refund.
- **Recommended solution:** Document these cases as out of scope for the current staging acceptance run. Before offering cancellation/refunds, define who can authorize them, full/partial policy, state transitions, idempotency, fee treatment, transfer reversal behavior, gateway balance limitations, customer communications, and reconciliation.
- **Related files:** payment controller/routes/models, move state machine, admin support view, and finance/support runbook.

#### M5 â€” No database-backed evidence that required indexes exist in the target deployment

- **Location:** [User.model.js](../../Backend/src/models/User.model.js#L14), [PaymentOrder model](../../Backend/src/models/paymentOrder.model.js#L35), [Payment model](../../Backend/src/models/payment.model.js#L42)
- **Problem / cause:** Mongoose schemas declare unique/index fields, but no staging database has been inspected to verify index creation. `unique: true` creates/requests a MongoDB index; it is not a Mongoose validation rule. Current payment model also declares both `unique` and `index` for `razorpayPaymentId`; the generated index inventory should be confirmed to avoid redundant/duplicate index assumptions. No index migration or production-like data audit is present in the reviewed repo.
- **Impact:** Duplicate-key behavior can differ from expectation if indexes were never built; creating a unique index against duplicate existing data can fail deployment. Unindexed list/lookups can degrade as staging data grows.
- **Recommended solution:** In the isolated staging DB, inspect `listIndexes()` and duplicate counts before creating indexes. Confirm unique user email, unique gateway order ID and payment ID, and query indexes for Move owner/provider/status, Payment user/date and Move reference, and PaymentOrder move/status. Add only required indexes through a controlled migration after resolving duplicates. Do not enable automatic index builds against production without a reviewed migration plan.
- **Related files:** Mongoose models, DB bootstrap/deployment settings, controlled index migration/runbook.

#### M6 â€” The project does not define a real end-to-end staging acceptance surface

- **Location:** `Backend/package.json`, `Frontend/package.json`, `Backend/README.md`, `Frontend/vercel.json`
- **Problem / cause:** Backend exposes `start`, `dev`, and mocked `test`; frontend exposes Vite `dev` and `build`. No lint script, browser E2E harness, CI workflow, Render manifest, or Vercel staging environment contract was found. The `/` response is a basic text response, not a dependency/readiness health check.
- **Impact:** Existing checks can validate local syntax/build/controller behavior but cannot establish browser-to-backend CORS, live test-mode checkout, Mongo persistence/indexes, callback recovery, or job workflow in deployment.
- **Recommended solution:** Establish a staging-only smoke/E2E checklist and health check before release. Keep integration evidence separate from mocked unit-test evidence. Add automated integration coverage only after a deterministic test database and provider sandbox fixtures are available.
- **Related files:** package scripts, deployment configuration, backend health endpoint, CI/staging runbook.

### LOW

#### L1 â€” Authentication tokens remain long-lived browser localStorage bearer tokens

- **Location:** [auth.js](../../Frontend/src/utils/auth.js#L1), [auth.middleware.js](../../Backend/src/middleware/auth.middleware.js#L1)
- **Problem / cause:** JWT is stored in browser local storage and expires after one day; no refresh, revocation, or CSP/security-header configuration was identified in the reviewed files.
- **Impact:** A successful script injection can exfiltrate a bearer token until it expires. This is a residual security risk, not a blocker unique to staging if test accounts and data are isolated.
- **Recommended solution:** Keep staging accounts/data synthetic; before production, adopt a reviewed token/session lifecycle and CSP/security-header policy consistent with the appâ€™s deployment architecture.
- **Related files:** auth utility, login/signup flows, API client, `server.js`, frontend hosting headers.

#### L2 â€” Existing legacy model-name collision remains in inactive code

- **Location:** `Backend/src/models/Service.model.js`, `Backend/src/models/ServiceProvider.model.js`
- **Problem / cause:** Both legacy modules register the Mongoose model name `Provider` with different schemas. They are not imported by the active provider controllers found in this review.
- **Impact:** Importing both during a future feature/migration can throw `OverwriteModelError` or produce unintended collection mapping.
- **Recommended solution:** Keep them out of active imports and resolve the legacy schema/collection ownership before reusing or migrating either model.
- **Related files:** both legacy model files and any future service/provider migration.

## Authentication, approval gate, and rate-limit review

- Auth signs HS256 one-day JWTs and verifies only HS256; startup requires a 32-byte-minimum JWT secret and Mongo URI. Signup rejects malformed/oversized values and cannot grant `admin`. Passwords over bcryptâ€™s 72-byte input limit are rejected. These are useful controls, but do not amount to mover approval.
- The current signup page deliberately sends the mover role when a provider chooses that path. `allowRoles("mover")` on provider routes checks role only. Approval must therefore be enforced server-side on all five mover endpoints; frontend hiding alone is insufficient.
- A backward-compatible rollout should keep existing user IDs, credentials, and accepted jobs intact. Before applying status checks, inventory current mover accounts; owner decides which are grandfathered approved and which need review. New applicants should be pending from their creation. Add an admin-only decision route and ensure status changes are auditable. Keep existing pending/assigned jobs accessible only under the chosen migration policy. Revoke/refresh stale role claims or use authoritative DB status in the approval middleware so changing approval is effective without waiting for an old JWT to expire.
- The current fixed-window rate limiter handles only signup, login, and quote routes. It is process-local, IP-only, and dependent on `req.ip` proxy correctness. It is adequate only as a limited single-instance staging guard, not a fleet-wide abuse control.

## Razorpay Route and current payment architecture

### What current code does

- The backend creates a standard Razorpay order from the persisted move price/currency; no client amount is accepted as authority.
- Verification checks the HMAC, fetches gateway order/payment, and checks order/payment IDs, captured state, amount, currency and ownership before writing local paid state.
- There is no current Route `account_id` association for a mover, linked account or stakeholder onboarding, transfer creation, transfer state storage, settlement hold/release, refund, reversal, Route webhook, or settlement reconciliation. `releaseStatus: "held"` is only a local legacy marker.

### External requirements to confirm before implementation

1. **Eligibility and operating model:** Obtain written confirmation that SwiftMoveâ€™s Razorpay merchant account is eligible and activated for Route, and confirm the applicable country/currency/transaction constraints, fees, settlement schedules, test-mode support, and legal/compliance requirements with Razorpay. Official Route docs describe linked-account onboarding and transfer modes, but the exact account/product activation is account-specific.
2. **Linked accounts:** Determine whether each mover is an individual or business and what legal name, email/phone, profile/address, PAN/GST or other KYC details, bank settlement destination, stakeholder details, and consent/privacy handling apply. Razorpayâ€™s standard route path is create linked account â†’ create stakeholder â†’ request/update product configuration; composite onboarding can create account plus settlement destination in one call. Account creation is not the same as activation; handle `product.route.under_review`, `product.route.needs_clarification`, and `product.route.activated` events. Store gateway account ID and activation status against the correct mover only after verified responses/events.
3. **Transfer allocation:** Choose whether to attach transfers during order creation or create transfers against the captured payment. Define the mover share, platform fee/commission, rounding, tax treatment, eligible destination, one-vs-many mover allocation, and rule for when the assigned mover becomes the payee. Validate that transfer allocations do not exceed captured payment and meet gateway minimums. Current documented Route transfer API fields are in minor units, and the transfer documentation says INR-only for Route transactions; confirm applicability for the live merchant/account before building around it.
4. **Settlement holds:** Define the actual business condition for release, maximum hold period, fallback/exception owner, and what happens if work is disputed or incomplete. Route exposes transfer-level `on_hold` and optional Unix `on_hold_until`; omitting an end timestamp puts a transfer on hold indefinitely, while `on_hold: false` releases settlement. A local DB field is not proof of the hold. Obtain Route API/webhook state before displaying â€œheldâ€ or â€œreleased.â€
5. **Refunds and reversals:** Separate customer refunds from Route transfer reversals in both workflow and ledger. Razorpay documents refund-with-`reverse_all` and a separate transfer reversal endpoint. Define full/partial refund rules, whether reversals are possible after settlement, what to do when the linked account lacks recoverable balance, and how failed/reversed states affect customer/job state. Never infer a worker payout can be recalled from their bank account.
6. **Webhooks and reconciliation:** Configure separate staging webhook URL/secret in Razorpay test mode and select required payment, Route, product-activation, transfer, failure/reversal, and settlement events. Validate webhook signatures using the exact raw request bytes; store/deduplicate provider event IDs; handle retries and out-of-order notifications. Reconcile API transfer state and settlement reports to the internal ledger on a scheduled/manual support cadence. Alert on mismatched amounts, missing transfer, unresolved status, failed transfer, refund/reversal, and delayed settlement.
7. **Explicit non-goal now:** Do not implement or test a real transfer, hold/release, linked account, refund, or live settlement until Route eligibility/account setup and owner-approved business settlement process are confirmed. No fake settlement status should be shown.

Official docs reviewed: [Route overview and API flow](https://razorpay.com/docs/api/payments/route), [Create a Linked Account](https://razorpay.com/docs/api/payments/route/create-linked-account), [Create Transfers from Orders](https://razorpay.com/docs/api/payments/route/create-transfers-orders), [Create Transfers from Payments](https://razorpay.com/docs/api/payments/route/create-transfers-payments), [Modify Settlement Hold](https://razorpay.com/docs/api/payments/route/modify-settlement-hold), [Refund and reverse transfer](https://razorpay.com/docs/api/payments/route/refund-payments-and-reverse-transfer), [Reverse a Transfer](https://razorpay.com/docs/api/payments/route/reverse-a-transfer), [Route webhook events](https://razorpay.com/docs/webhooks/route), and [transfers for settlement](https://razorpay.com/docs/api/payments/route/fetch-transfers-for-a-settlement).

## Geoapify confidence and safe address disambiguation

Geoapify documents `rank.confidence` plus street, city, and building-level confidence and says confidence should be evaluated according to the precision needed. Its docs recommend a country filter where service addresses belong to a known country and support structured address inputs as well as multiple candidates. The current code requests one candidate and calculates road distance directly from its coordinates.

Recommended flow: collect structured address components where practical; apply the owner-confirmed country/service area; request several results; reject zero results; rank candidates by country/city/postcode and confidence; auto-accept only a threshold validated against representative addresses; return a disambiguation response for ambiguous street/building matches; make the customer explicitly select and confirm the resolved pickup/dropoff before quote/booking; then price and save the selected coordinates/place ID and resolved address server-side. Any provider error, invalid confidence data, unresolved route, or customer-unconfirmed candidate must fail closed with no amount. Geoapify confidence is a ranking signal, not a guarantee of physical access or rooftop accuracy.

Source: [Geoapify Geocoding API confidence and filters](https://apidocs.geoapify.com/docs/geocoding/).

## Environment variables and deployment configuration

### Backend variables read by code

| Variable | Purpose / staging requirement |
|---|---|
| `MONGO_URI` | Required at startup; use a dedicated staging database with synthetic data and known topology. |
| `JWT_SECRET` | Required at startup; at least 32 bytes of high-entropy, unique staging secret material. Never reuse production. |
| `PORT` | Optional; host-provided listening port or default `5000`. |
| `TRUST_PROXY_HOPS` | Defaults to `0`; set only after confirming the staging hostâ€™s trusted proxy chain. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Needed for backend order creation/verification; staging test-mode pair only. Secret remains backend-only. |
| `GEOAPIFY_API_KEY` | Needed for geocoding and road route calls; staging key with correct API scope, quota, and restrictions. |
| `PRICING_CURRENCY`, `PRICING_BASE_CHARGE`, `PRICING_PER_KM`, `PRICING_MINIMUM_CHARGE`, `PRICING_SERVICE_CHARGES_JSON` | Currently intentionally unset. Configure only after owner supplies actual business pricing rules and currency. No production price can be calculated until then. |
| `PRICING_LOADING_CHARGE`, `PRICING_UNLOADING_CHARGE` | Required only when a booking requests those options; values must be owner-approved. |

### Frontend variables / hosting settings

- `VITE_API_URL`: staging API base URL, injected at frontend build time.
- `VITE_RAZORPAY_KEY_ID`: public Razorpay test key ID matching backend test credentials; the key secret must never be in Vite variables.
- Optional `VITE_GA_ID`, `VITE_HOTJAR_ID`, `VITE_ENABLE_ANALYTICS`, `VITE_ENABLE_CHAT`, `VITE_ENABLE_DEMO` are referenced by frontend config, but `.env.example` says integrations are not wired. Keep disabled/unset in the controlled staging build unless owner confirms.
- Add the exact staging frontend origin to backend CORS config. Ensure Vercel preview URLs are either individually allowlisted or deliberately excluded; do not use wildcard CORS with credentials.
- Configure staging build command `npm run build` in `Frontend`, output directory `dist`; keep SPA rewrite for client-side routes. Configure backend start command `npm start` in `Backend`, Node 18+, and host health check/port settings. Repo has no checked-in Render/Vercel environment manifest beyond frontend SPA rewrite.
- If webhooks are implemented, configure a public HTTPS staging webhook endpoint and a separate Razorpay test-mode webhook secret. Current source has no `RAZORPAY_WEBHOOK_SECRET`; adding the variable alone does not implement webhook processing.
- If Razorpay Route is later approved, keep any credentials server-side and define storage for linked account IDs; Route does not have an environment variable in current code because it is not implemented.

### Owner configuration/decisions needed

1. Confirm staging frontend/backend URLs, hosting account/project names, proxy depth, and who provisions isolated staging services.
2. Provide approved pricing rules and currency: base booking charge, per-kilometre rate, minimum, each service fee, optional loading/unloading fees, rounding precision, tax/fee inclusion, and any approved service-area/vehicle/weight factors. Until then quote and booking creation intentionally fail closed.
3. Confirm Geoapify covered country/service regions and acceptable address precision/selection policy.
4. Decide mover eligibility policy: documents/verification requirements, review owner, treatment of existing mover accounts, whether legacy active movers are grandfathered, and rejection/reapplication process.
5. Confirm Razorpay merchant Route eligibility and activation with Razorpay; legal merchant/platform model; approved linked-account KYC fields and consent; currency; mover share/platform commission; transfer trigger and maximum hold; transfer failure recovery; refunds/reversals and dispute policy; reconciliation owner and cadence.
6. Confirm whether staging MongoDB is a replica set/sharded cluster (needed only for multi-document transactions), how indexes are deployed, and provide synthetic test fixtures/admin provisioning procedure.
7. Provide staging Razorpay test credentials, Geoapify staging key, Mongo staging URI, and webhook test secret if/when webhook code is implemented. Secret values should be entered directly in hosting secret storage, never sent in chat or written to this report.

## MongoDB transaction and index requirements

- The current order lock uses an atomic conditional update of one Move document; MongoDB single-document atomicity supports that coordination without a multi-document transaction.
- Payment settlement creates/updates multiple documents (PaymentOrder, Payment, Move). MongoDB transactions could make these local writes atomic, but MongoDB states transactions require a replica set or sharded cluster; a standalone deployment cannot run them. Do not assume a local standalone is representative of staging. Transactions cannot include Razorpay network effects, so gateway calls still need idempotency, reconciliation and compensating recovery.
- Before staging, confirm actual index definitions via database inspection. Schema declarations alone do not prove existing deployment index state. Verify unique `User.email`, `PaymentOrder.razorpayOrderId`, `Payment.razorpayPaymentId`; review duplicate Payment records per Move before adding any unique partial constraint. Review duplicate legacy PaymentOrders per Move, index size, and query patterns. Check indexes supporting customer/provider Move queries and payment/order history. Plan indexes as reviewed migrations; do not blindly build against live data.
- Keep database indexes on immutable gateway IDs and use unique constraints as the final duplicate defense. Consider a unique partial index enforcing at most one successful paid Payment per Move only after cleaning/auditing legacy rows and proving intended semantics.
- MongoDB sources: [Transactions and deployment requirements](https://www.mongodb.com/docs/manual/data-modeling/enforce-consistency/transactions/) and [Transactions manual](https://www.mongodb.com/docs/manual/core/transactions/).

## Exact staging blockers

1. **No mover approval gate or explicit legacy-account migration decision.** A mover role directly enables job APIs.
2. **No authorized pricing rules/currency.** Quotes and booking creation cannot complete; do not add sample prices to get around this.
3. **No verified staging environment configuration.** Staging CORS origin, proxy depth, isolated MongoDB, deployment secrets, health probe, and test Razorpay key pairing have not been provided or exercised.
4. **No live test-mode Razorpay checkout evidence.** Current tests are mocked; no deployed sandbox order/payment has been exercised.
5. **No payment webhook/reconciliation implementation.** Controlled payment can be attempted via browser callback but does not provide reliable recovery evidence; it should not be accepted as payment-integrity sign-off.
6. **No Geoapify confidence/disambiguation handling or provider test evidence.** Current first-result routing can compute distance for the wrong plausible location.
7. **No Razorpay Route eligibility/account activation or settlement business process.** Settlement, hold/release, refunds, reversals, and reconciliation cannot be tested, and must remain disabled.
8. **MongoDB index/topology unverified.** Existing indexes, duplicate records, and transaction support are not established.
9. **No end-to-end deployed workflow evidence.** Mocked unit tests and frontend build do not cover browser â†’ API â†’ Mongo â†’ Razorpay sandbox â†’ mover lifecycle.

## Recommended implementation order

1. **Owner decisions first:** pricing, service regions/address precision, mover approval/legacy account policy, staging URLs/hosting/proxy topology, settlement operating model, refund policy, and sandbox test operators.
2. **Staging foundation:** provision isolated test-mode services and secrets; configure CORS, proxy trust, health check, staging-only database, backup/reset procedure, and observability. Inspect database indexes and duplicate counts before changes.
3. **Mover approval:** add status model, migration/backfill plan, admin decision API/UI, audit fields, and server-side approval middleware. Verify existing accounts and assigned jobs remain functional under approved mapping; new movers cannot access jobs while pending.
4. **Address integrity and pricing:** implement candidate confidence/disambiguation and country/service-area filtering. Configure only owner-approved pricing in staging and test breakdown/route failures. Store exact quote snapshot and ensure booking recalculates server-side.
5. **Payment recovery:** implement signed raw-body webhooks, event idempotency, reconciliation and local write recovery; add verified indexes and transactions only with supported topology. Keep gateway operations outside database transactions.
6. **Staging acceptance run:** run the checklist below using test credentials and synthetic users/moves only. Record exact build, API, database, Razorpay sandbox, and Geoapify evidence.
7. **Settlement only after separate approval:** confirm Route activation and KYC; design and implement linked account, transfer/hold, webhook, refund/reversal and reconciliation lifecycle; test only in Razorpay test mode first. This is not included in Phase 1.1 implementation.

## Staging test checklist

### Environment and security

- [ ] Backend starts with all required staging variables and fails safely with missing/invalid `MONGO_URI` or `JWT_SECRET`.
- [ ] Staging uses a separate MongoDB database, synthetic users/addresses, unique JWT secret, Razorpay test-mode credentials, and a restricted staging Geoapify key.
- [ ] Browser preflight and authenticated API requests succeed only from the exact staging origin; production origin behavior is unchanged and no wildcard is used.
- [ ] Verify actual Express client IP under the deployed proxy; spoofed `X-Forwarded-For` cannot bypass or collapse limiter identity.
- [ ] Rate-limit signup, login, and quote routes; check 429/Retry-After, memory-cap response, restart behavior, and all replicas if scaling.
- [ ] Confirm passwords, JWTs, API secrets, full payment payloads, and bank/KYC details are not written to frontend bundles or logs.

### Authentication and mover approval

- [ ] Create customer signup/login; reject malformed fields, overlong values, and passwords above bcryptâ€™s accepted byte length.
- [ ] Confirm public registration cannot grant admin; valid admin is provisioned through the approved separate process.
- [ ] Verify legacy mover migration mapping and account login/assigned jobs against a staging snapshot/fixture.
- [ ] New mover registration is pending; pending/rejected mover cannot list, accept, or progress jobs through direct API calls.
- [ ] Admin approval/rejection requires admin auth, records actor/time/reason, and takes effect for existing tokens according to policy.
- [ ] Approved mover can use the provider APIs; customer/admin cannot. Concurrent accept requests result in exactly one provider assignment.

### Geoapify and booking/pricing

- [ ] Valid address with high-confidence unique result resolves to correct display text and road route distance.
- [ ] Ambiguous, low-confidence, city-only, wrong-country, no-result, and typo cases require correction/selection or fail with no price.
- [ ] Geoapify timeout, quota/rate-limit response, invalid API key and routing failure return clear unavailable errors and no misleading quote.
- [ ] Customer confirms selected pickup/dropoff; quote shows server breakdown and currency from approved rules.
- [ ] Missing any applicable price config blocks quote and booking; no fallback/sample amount is generated.
- [ ] Tamper frontend amount, currency, distance, service, or loading flags; backend recomputes and persists only its own validated quote.
- [ ] Booking owner, address snapshot, selected coordinates/place IDs, price, currency and breakdown are consistent.

### Razorpay standard checkout and payment integrity

- [ ] Staging checkout opens with the matching Razorpay test key and order ID from backend.
- [ ] Order amount/currency exactly match the persisted backend-priced Move in minor units; client cannot choose a cheaper amount.
- [ ] Successful sandbox payment becomes paid only after server verification of signature, gateway order/payment IDs, amount, currency and captured state.
- [ ] Invalid signature, wrong order, wrong amount/currency, uncaptured/failed payment, other userâ€™s move, and already-paid move do not mark move paid.
- [ ] Double-click/concurrent order creation and repeated callback do not create duplicate payable orders or Payment records.
- [ ] Simulate browser close after payment, backend restart/network timeout, webhook retry/out-of-order events once implemented; reconciliation reaches the correct terminal state without a second charge.
- [ ] Reconcile Mongo Payment/PaymentOrder/Move to Razorpay sandbox dashboard and document any manual recovery steps.

### Mover job lifecycle

- [ ] Unpaid or unpriced moves never appear to movers and cannot be accepted or progressed by direct API call.
- [ ] Approved mover accepts a paid move once; concurrent mover claims yield one assignment.
- [ ] Only assigned mover can progress accepted â†’ in_progress â†’ completed; invalid jumps/repeats and other-mover calls fail.
- [ ] Customer/admin dashboards reflect the same assignment and status after refresh; job completion does not claim a settlement occurred.

### Settlement and refund (blocked until separately implemented/approved)

- [ ] **Do not mark this section passed in Phase 1.1:** no live/sandbox Route flow is configured in source now.
- [ ] After Route eligibility and account activation: create/test linked account and verify KYC/product activation events; only active eligible mover account may receive test transfer.
- [ ] Verify transfer allocations, minor units, fees, status progression, hold-until/release, transfer failure, duplicate event handling, and settlement reconciliation against Razorpay test dashboard/report.
- [ ] Verify full and partial customer refund plus corresponding transfer reversal rules and insufficient linked balance recovery, with no duplicate refund/transfer on retries.
- [ ] Test job completion and settlement as distinct events; verify operator approval/recovery path and customer/mover-visible wording matches actual gateway state.

## Review boundary and evidence limits

- Git status showed 60 modified tracked files and numerous untracked Phase 1/source/docs additions before this report was added. No changes were reverted or staged by this review.
- The three requested Phase 1 reports were read and compared against active source. Source claims that were confirmed include startup JWT/Mongo checks, in-memory IP rate limits, immediate mover signup, first-result Geoapify logic, server-side price calculation, payment lock and callback-based verification, read-only admin provider list, no Route implementation, and no live integration evidence.
- Official technical docs reviewed: Geoapify geocoding confidence and filtering, Razorpay Route account/transfer/hold/refund/reversal/webhook/reconciliation docs, and MongoDB transaction requirements. Documentation describes APIs, not SwiftMove account eligibility or deployed behavior.
- The readiness status remains **NOT VERIFIED** until the relevant controlled staging integrations are deployed and exercised with sandbox credentials, synthetic data, and recorded evidence. No staging deployment or payment was performed in this review.
