# SwiftMove Phase 1 Implementation Report

**Overall status: PARTIALLY COMPLETED**  
**Source changes:** Implemented and locally checked  
**Live integrations/deployment:** NOT VERIFIED  
**Staging readiness:** PARTIALLY COMPLETED; configure environment and validate sandbox services before using staging payment/pricing flows.

## Summary

Phase 1 hardened JWT configuration and auth input handling, added basic throttling to public auth/quote routes, serialized payment order creation and verification per move, prevented movers from claiming or progressing unpaid moves, grouped money summaries by currency, and removed misleading cancel/review controls. The project still fails closed for pricing until approved business rules are configured.

No real payment, production database, external credentials, deployment, or migration was used. No user source changes were reverted. No production rates were introduced and no fund transfer/release was implemented.

## Critical findings and fixes

| Finding | Status | Changes |
|---|---|---|
| Public signup could never grant admin, but accepted unbounded strings and used bcrypt's silently truncated input range | **COMPLETED** | Email/name bounds and validation; password limited to 72 UTF-8 bytes; explicit HS256 signing/verification; startup requires MONGO_URI and at least 32 bytes of JWT secret material |
| Public mover signup immediately grants mover capability | **PARTIALLY COMPLETED / POLICY OPEN** | Kept current `mover` role and did not introduce onboarding. Documented that unverified users can claim jobs and a recommended approval/invitation gate. Mover policy requires product decision. |
| Multiple create-order requests could create multiple payable Razorpay orders | **COMPLETED WITH LEASE LIMITATION** | Added conditional Mongo-backed per-Move lease, pending `created`/`attempted` order reuse, avoids replacing gateway-paid orders, and rejects concurrent requests. Lease duration is five minutes. |
| Two different captured order callbacks could create multiple Payment records for one move | **COMPLETED FOR NORMAL REQUEST CONCURRENCY** | Shared per-Move payment-operation lease serializes order creation and verification, rejects a different payment after the Move is paid, and keeps same callback retries idempotent. |
| Failed/not captured payments could be incorrectly marked paid | **TESTED** | Gateway order must be paid and payment captured with matching order ID, amount, currency, ownership, and saved Move price before local paid writes. Mocked test asserts an authorized-only payment makes no paid-state writes. |
| Movers could accept/unconditionally progress unpaid bookings | **COMPLETED** | Available jobs and acceptance require `paid: true`; status progression also checks paid state. |
| Customer/admin money displays used rupees and mixed-currency totals | **COMPLETED IN CURRENT VIEWS/APIS** | Added currency formatting helper, grouped customer summaries and backend dashboard/admin totals by currency, and labelled unknown currency instead of assuming INR. |
| Customer UI showed cancellation/review actions with no handlers | **COMPLETED** | Replaced inert controls with clear unavailable status text; no new cancel/review business flow was invented. |
| Public auth and quote endpoints had no throttling | **COMPLETED WITH SCALE LIMITATION** | Added process-local fixed-window limits and `TRUST_PROXY_HOPS` configuration. Counters are not shared between Render instances. |
| Standard Razorpay orders were treated as delayed mover settlement | **NOT IMPLEMENTED BY DESIGN** | Confirmed source has no transfer/Route settlement calls; `Payment.releaseStatus` is documented as a local legacy field, not proof of custody/release. |

## Security and payment integrity changes

- JWTs are signed as HS256 and verification only accepts HS256. Startup fails if Mongo URI or a sufficiently long JWT secret is missing.
- Auth endpoints reject invalid/oversized email and name values and passwords exceeding bcrypt's 72-byte input boundary.
- Public signup still restricts roles to `user` and `mover`; `admin` remains provisioned out of band.
- Login, signup, and quote requests are rate limited. `TRUST_PROXY_HOPS` defaults to direct mode; deployment must set it to the verified proxy topology. A shared store is needed for multiple instances.
- One per-Move payment-operation lease uses conditional database updates, so normal concurrent requests across backend processes cannot both create/verify payment activity for the same Move. The lease is renewed before persistence, released on request completion, and expires after five minutes following a crashed request.
- Payment verification remains server-side and validates signature, gateway order/payment, amount, currency, capture/order state, owner, and saved price. Same-callback retries do not create duplicate transactions.
- Payment state still spans separate MongoDB writes without a transaction. Database topology and transaction support were not verified, so this implementation does not depend on transactions.
- Existing `Provider` duplicate model registrations were not deleted or renamed. Both are unused by mounted flows, and changing model/collection mapping needs a migration decision.

## Settlement assessment

The current code uses standard Razorpay order/payment operations only. It has no mover linked accounts, transfer API, settlement hold, transfer reversal, settlement webhook, or payout reconciliation. Razorpay documents Route for linked accounts, marketplace/on-demand transfers, and settlement holds ([Route overview](https://razorpay.com/route/), [Route transfer settlement status API](https://razorpay.com/docs/api/payments/route/fetch-transfers-for-a-settlement/?preferred-country=IN)). Route activation/eligibility is account- and business-dependent; it must be confirmed with Razorpay.

Before implementing settlement, the business must confirm the platform's approved marketplace model, mover onboarding/KYC, supported currency, commission/fee rules, service-completion evidence, release policy, refund/reversal handling, and webhook/reconciliation requirements. This phase does not mark funds as transferred or released.

## Database changes

- Added one internal `paymentOrderLock` field on `Move`, hidden from normal field selection and shared by order creation and verification through a renewable short-lived lease.
- Did not add indexes, create collections, run migrations, delete records, or change legacy collection names.
- Updated customer/admin dashboard APIs to return totals grouped by currency.
- No live database was accessed; existing data/index state and lease behavior on the deployed MongoDB topology remain unverified.

## Tests and verification performed

| Check | Result |
|---|---|
| `npm.cmd test` in `Backend` | **PASS** — 13 tests, 13 passed, 0 failed |
| Backend JavaScript syntax (`node --check` across backend JS excluding `node_modules`) | **PASS** |
| `npm.cmd run build` in `Frontend` | **PASS** — Vite transformed 1,641 modules and built production assets |
| `git diff --check` | **PASS** — no whitespace errors; Git emitted only line-ending conversion warnings |
| Authentication/API checks | Controller/middleware tests cover signup role restriction, input limit, HS256/expiry rejection, admin role rejection, and owner-constrained move lookup |
| Pricing checks | Tests cover invalid service, missing pricing config (no route call), and unresolved geocoding (no routing request) |
| Payment checks | Fake Razorpay tests cover persisted amount in minor units, pending order reuse, simulated concurrent order serialization, repeated callback idempotency, and uncaptured payment rejection |
| Mover checks | Tests cover rejection of invalid transition and successful assigned-mover transition |

These are unit/controller tests with mocked gateway and database methods. They are not live HTTP, MongoDB concurrency, Geoapify, Razorpay sandbox, or browser end-to-end tests. No production data or real payments were used. No prior test suite existed in the package.

## Files changed in Phase 1

### Backend

- `Backend/server.js`
- `Backend/package.json`
- `Backend/src/controllers/auth.controller.js`
- `Backend/src/controllers/admin.controller.js`
- `Backend/src/controllers/dashboard.controller.js`
- `Backend/src/controllers/payment.controller.js`
- `Backend/src/controllers/provider.controller.js`
- `Backend/src/middleware/auth.middleware.js`
- `Backend/src/middleware/rateLimit.middleware.js` (new)
- `Backend/src/models/move.model.js`
- `Backend/src/models/payment.model.js` (clarifying comment only)
- `Backend/src/routes/auth.routes.js`
- `Backend/src/routes/pricing.routes.js`
- `Backend/test/phase1.test.js` (new)
- `Backend/.env.example` (new)
- `Backend/README.md`

### Frontend

- `Frontend/src/utils/currency.js` (new)
- `Frontend/src/dashboards/AdminDashboard.jsx`
- `Frontend/src/dashboards/BalanceDashboard.jsx`
- `Frontend/src/dashboards/DashboardCards.jsx`
- `Frontend/src/dashboards/MyOrders.jsx`
- `Frontend/src/pages/admin/AdminOrdersPage.jsx`
- `Frontend/src/pages/admin/AdminPaymentsPage.jsx`
- `Frontend/src/components/moves/MyMoveCard.jsx`
- `Frontend/.env.example` (new)

### Documentation

- `PHASE_1_AUDIT_REPORT.md`
- `PHASE_1_IMPLEMENTATION_REPORT.md`
- `SECURITY_CHECKLIST.md`
- `README.md`
- `docs/SWIFTMOVE_CURRENT_STATE_SRS.md`
- `docs/SWIFTMOVE_API_DOCUMENTATION.md`
- `docs/SWIFTMOVE_DATABASE_DOCUMENTATION.md`
- `docs/SWIFTMOVE_IMPLEMENTATION_STATUS.md`

The repository already had other modified/untracked application files before this phase. Those pre-existing changes were preserved and are not all listed above.

## Remaining risks and manual actions

1. Configure `MONGO_URI`, a unique random JWT secret of at least 32 bytes, Razorpay sandbox keys, Geoapify server key, and verified `TRUST_PROXY_HOPS` in secret storage. `.env.example` contains blank placeholders only.
2. Keep pricing variables unset until approved business rates and currency are supplied; then test in staging only.
3. Confirm Razorpay sandbox capture configuration. The verification code requires captured payments.
4. Resolve mover onboarding/verification policy before exposing mover signup publicly.
5. Configure shared rate-limit storage before horizontally scaling the backend.
6. Add Razorpay webhook/reconciliation and explicitly approved marketplace settlement before representing a mover payout or held funds.
7. Review legacy database records for duplicate PaymentOrders or multiple payments per Move; no live data inspection was performed.
8. Decide whether ambiguous Geoapify matches should be rejected or presented for customer selection. Current first-result behavior remains a documented risk.

## Staging deployment decision

**PARTIALLY COMPLETED.** Code-level checks pass, but staging payment/pricing is **NOT VERIFIED**. A staging deployment can proceed only after environment values and proxy configuration are set, and must use sandbox Razorpay credentials and a non-production MongoDB database. Pricing remains unavailable until actual business rules are supplied. Production readiness is **NOT VERIFIED**.
