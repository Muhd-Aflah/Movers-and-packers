# SwiftMove Phase 1 Audit Report

**Audit stage:** Initial inspection, before Phase 1 code changes  
**Scope:** Current repository implementation, including prior uncommitted pricing/payment work  
**Data handling:** No environment-file values or production secrets were read. No database or production service was contacted.

## Executive summary

The repository contains a working-shaped MERN workflow for authentication, move booking, server-side Geoapify pricing architecture, Razorpay order verification, mover job assignment, and read-only admin/customer dashboards. Pricing has deliberately not been enabled with invented rates; quote and booking creation currently fail closed until business rates and currency are configured.

Highest risks found in source inspection are (1) concurrent payment-order creation can create multiple orders for one move, (2) payment recovery depends on a browser callback because no webhook/reconciliation exists, and (3) public signup allows immediate self-registration as a mover without an approval gate. The current standard Razorpay order integration does not implement marketplace transfers or delayed mover settlement. Several admin/customer screens overstate functionality (read-only management, inactive cancellation/review controls), and currency is inconsistently presented.

The worktree already contained extensive uncommitted application changes from previous work. These changes are user work and must be preserved; the Phase 1 implementation will modify only files necessary for the fixes and add requested documentation/config examples.

## Findings before fixes

| ID | Severity | Finding | Evidence / impact |
|---|---|---|---|
| A1 | High | Concurrent `create-order` calls can both observe no pending PaymentOrder, create separate Razorpay orders, and persist both. A paid check alone does not prevent the race. | `Backend/src/controllers/payment.controller.js`; repeated clicks, retries, or multiple browser tabs may expose multiple payable orders. |
| A2 | High | Payment state has no Razorpay webhook or scheduled reconciliation. Completion depends on the checkout callback returning to the backend. | `Backend/src/routes/payment.routes.js`, `Backend/src/controllers/payment.controller.js`; interrupted callbacks may leave successful gateway payments without complete local state. |
| A3 | High | Mover signup is public and immediately grants `role: mover`; mover endpoints trust that role. Provider verification schema is disconnected. | `Backend/src/controllers/auth.controller.js`, `Backend/src/routes/provider.routes.js`, `Backend/src/models/providerVerfication.js`; unverified accounts can view/claim jobs. Recommended safe policy: public signup creates customer role only; movers submit an application/documents, an admin approves and activates mover permission, and every mover API checks that approved state. A trusted invitation/admin provisioning path is an alternative. This policy was documented, not silently introduced. |
| A4 | High | Settlement/release is not implemented. `Payment.releaseStatus: held` is only a local field and does not prove Razorpay funds are held or released. | `Backend/src/models/payment.model.js`; current Razorpay use is order creation/payment fetch. No Route linked accounts/transfers/settlement calls exist. |
| A5 | Medium | Quote flow uses first Geoapify geocoding result without evaluating confidence or asking the customer to select an ambiguous result. | `Backend/src/services/pricing.service.js`; configured pricing may use a plausible but wrong location. |
| A6 | Medium | Pricing is intentionally disabled until approved rules are configured. No production rates are present, so quote and move creation cannot complete in the current configuration. | `Backend/src/services/pricing.service.js`, backend README; this is fail-closed and must not be bypassed with defaults. |
| A7 | Medium | Signup/login/quote endpoints have no rate limiting and authentication form payload lengths are not bounded in the controllers. | `Backend/server.js`, `Backend/src/controllers/auth.controller.js`, pricing route; public abuse may consume CPU/API quota. |
| A8 | Medium | Payment/order amount presentation hardcodes INR in dashboards while pricing stores currency per move; admin revenue sums currencies without grouping. | `Frontend/src/dashboards/BalanceDashboard.jsx`, admin pages, `Backend/src/controllers/admin.controller.js`; displayed totals may be mislabeled or mathematically invalid for multiple currencies. |
| A9 | Medium | No cancellation/refund/dispute handling; no mover rejection/reassignment; no customer review implementation. | Move status schema, payment controller, provider controller; existing UI controls may imply missing actions. |
| A10 | Medium | PaymentOrder, Payment, and Move writes are separate operations. Retry paths can recover some partial failures, but no cross-document transaction or reconciliation closes every failure mode. | `Backend/src/controllers/payment.controller.js`; partial state can require support intervention. |
| A11 | Low | Two legacy files register model name `Provider` with different schemas, risking `OverwriteModelError` if both are imported. | `Backend/src/models/Service.model.js`, `Backend/src/models/ServiceProvider.model.js`; neither is currently imported by the active controllers. |
| A12 | Low | Several route modules are unmounted placeholders; some operational list APIs have no pagination. | `Backend/server.js`, `Backend/src/routes/*`, admin/provider/move controllers. |
| A13 | Low | Customer `MyMoveCard` contains cancel/review buttons without handlers; current dashboard renders `MyOrders` instead. | `Frontend/src/components/moves/MyMoveCard.jsx`, `Frontend/src/dashboards/UserDashboard.jsx`. |

## Security review

- Passwords are hashed using bcryptjs in a `User` pre-save hook. Login compares the hash.
- JWTs include user ID/role and expire after one day. Backend middleware verifies signatures; role middleware protects mover/admin APIs. Admin cannot be selected through public signup.
- Profile reads/updates compare the requested user ID to the verified JWT identity. Move/payment ownership filters use `req.user.id`.
- Frontend route protection decodes localStorage JWT for navigation only. It is not a security boundary; backend authorization remains authoritative.
- JWTs are stored in `localStorage`, so script injection/XSS could expose them. No CSP/security headers or XSS-specific controls were found in source configuration.
- CORS uses an explicit origin allowlist. No rate limiter was found. Environment secret values were not inspected.

## Pricing and payment review

- Geoapify is called server-side with `GEOAPIFY_API_KEY`; frontend does not contain a Geoapify key path.
- Quote and move creation use backend pricing; move creation recalculates and persists the snapshot; Razorpay order amount is derived from the stored move. Client-supplied price is not used.
- Pricing config has no defaults and missing values return an unavailable error. Weight is validated/stored but not included in the formula.
- Payment verification checks the HMAC signature using timing-safe comparison, fetches Razorpay order and payment, and checks order/payment IDs, amount, currency, capture state, move owner, and saved price.
- Payment records have a unique Razorpay payment ID. Retry handling is present, but concurrent order creation remains a defect and recovery is browser-callback based.
- Razorpay's official Route product describes linked accounts, transfers, and settlement holds; none are configured or called by this repository. Standard order/payment calls alone do not implement mover escrow or completion-based release. Account eligibility and activation must be confirmed with Razorpay before settlement work.

## Audit method and boundaries

Inspected repository structure, existing README files and as-built docs, mounted route registrations, controller/middleware/model interactions, frontend service calls and role dashboards, package scripts, environment variable names, and ignored/unmounted legacy code. No `.env` values were read. No app code or schema was modified before this report was written. No live MongoDB, Geoapify, Razorpay, Vercel, or Render integration was exercised. The original product SRS was not present in the repository, but current-state audit documents were present.

## Planned Phase 1 implementation

1. Harden startup/JWT configuration and bound/validate public auth inputs without changing role policy.
2. Add a database-coordinated lock for per-move Razorpay order creation; retain server-authoritative amount/currency and existing verification semantics.
3. Make payment record recovery explicit/idempotent and prevent silent partial-state claims. Do not implement a release/payout without an approved Razorpay Route/business setup.
4. Improve location ambiguity handling and API error behavior without inventing pricing or business rules.
5. Remove misleading active UI controls or label unavailable payment/settlement behavior without redesigning the UI; make currency displays derive from stored currency.
6. Add a safe `.env.example`, security checklist, implementation report; run available syntax/build/static checks. Use mocked tests only if a suitable test harness exists; do not initiate real payments or use production data.
