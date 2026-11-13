# SwiftMove Phase 1 Security Checklist

Status meanings: **IMPLEMENTED** is present in source; **TESTED** was exercised by a local mocked test; **PARTIAL** means controls exist with a known gap; **NOT VERIFIED** requires deployed service/account evidence; **NOT IMPLEMENTED** is absent.

## Authentication and authorization

- [x] **IMPLEMENTED / TESTED** Passwords hashed by bcryptjs pre-save hook; login compares hashes.
- [x] **IMPLEMENTED / TESTED** Public signup only grants `user` or `mover`; `admin` cannot be granted in public registration.
- [x] **IMPLEMENTED / TESTED** JWT expires after one day; HS256 signature algorithm is explicitly verified.
- [x] **IMPLEMENTED** Backend startup rejects missing `MONGO_URI` or JWT secret shorter than 32 bytes.
- [x] **IMPLEMENTED / TESTED** Role middleware denies customer/mover roles on admin-only APIs.
- [x] **IMPLEMENTED / TESTED** Profile/move/payment access is constrained to authenticated owner where implemented.
- [x] **IMPLEMENTED / TESTED** Mover role remains publicly available, but new mover accounts start pending; all five mover APIs reload current User role/approval status from MongoDB and require `approved`. Missing legacy status is fail-closed, and old JWTs do not retain mover access after rejection.
- [x] **IMPLEMENTED / TESTED** Admin-only mover listing/profile/approve/reject APIs expose safe profile fields, require a rejection reason, record reviewer/time/reason, and make same-decision retries idempotent. Conflicting decisions return `409`; reapplication/reversal is not implemented pending owner policy.
- [ ] **NOT VERIFIED** Existing mover records have not been inventoried or migrated. Use the guarded dry-run/apply script only with a verified isolated staging database; no database was connected in this phase.
- [ ] **PARTIAL** JWT is stored in browser `localStorage`; XSS can expose bearer tokens. No CSP/security-header policy, refresh/revocation, or server-side session invalidation was found.
- [ ] **NOT IMPLEMENTED** Email verification, password reset, MFA, account lockout, and login audit trail.
- [x] **IMPLEMENTED / TESTED** Signup/login have bounded name/email/password inputs; passwords above 72 UTF-8 bytes are rejected to avoid bcrypt truncation ambiguity.

## Abuse controls and API configuration

- [x] **IMPLEMENTED / TESTED** Process-local fixed-window limits on signup, login, and public pricing quote endpoints.
- [ ] **PARTIAL** Limits are not shared across Render instances. Use a shared rate-limit store if deploying multiple instances or if fleet-wide enforcement is required.
- [ ] **NOT VERIFIED** Set `TRUST_PROXY_HOPS` to the actual trusted reverse-proxy depth. Incorrect values can collapse clients to one IP or trust spoofed forwarding headers. Local example uses direct mode (`0`).
- [x] **IMPLEMENTED** CORS allows configured origins only; no wildcard origin is used.
- [ ] **PARTIAL** No general request validation framework, API pagination, security headers/CSP, request body-specific size limits, or API-wide rate limiting.
- [x] **IMPLEMENTED** Server errors return generic response text; controllers generally avoid returning stacks. Some controllers still write errors to server logs.

## Pricing and address integrity

- [x] **IMPLEMENTED / TESTED** Pricing and routing execute on the backend; frontend-supplied amount is ignored.
- [x] **IMPLEMENTED / TESTED** Missing rates do not produce an amount; invalid/unresolved Geoapify results return errors.
- [x] **IMPLEMENTED** Booking creation recalculates price and stores a pricing snapshot; Razorpay amount uses saved Move price.
- [ ] **PARTIAL** Geoapify first result is accepted without confidence threshold or user disambiguation. Current display shows resolved address after quote; product should require review/selection for ambiguous results before enabling live pricing.
- [ ] **NOT VERIFIED** Geoapify key scope/quota, deployment secret storage, and network operation.
- [ ] **NOT CONFIGURED** Approved business currency and rates. Do not enable price variables until owners provide the rules; no example prices are included in `.env.example`.

## Payment integrity and settlement

- [x] **IMPLEMENTED / TESTED** Order amount/currency come from persisted move; order creation requires ownership and priced/unpaid move.
- [x] **IMPLEMENTED / TESTED** Per-move database lease serializes concurrent order creation and payment verification; repeated pending order request reuses the same Razorpay order.
- [x] **IMPLEMENTED / TESTED** HMAC signature validation uses timing-safe comparison; server fetches order/payment and validates IDs, amount, currency, capture state, and order state.
- [x] **IMPLEMENTED / TESTED** Duplicate callback retry is idempotent; uncaptured payment does not mark PaymentOrder or Move paid; second payment for an already paid move is rejected.
- [x] **IMPLEMENTED** Movers only discover paid jobs; service progression requires payment.
- [ ] **PARTIAL** PaymentOrder, Payment, and Move are not committed in a MongoDB transaction. No replica-set/transaction capability was verified; explicit recovery/retry exists, but partial states can need support intervention.
- [ ] **PARTIAL** Five-minute locks can expire if an external call is unusually long. A Razorpay order may be orphaned if remote creation succeeds and local persistence fails.
- [ ] **NOT IMPLEMENTED** Razorpay webhook, capture reconciliation, refund/cancellation/dispute handling, or support workflow.
- [ ] **NOT IMPLEMENTED** Marketplace transfer/release. `Payment.releaseStatus` is only an app field and does not indicate actual funds custody/transfer. Do not set it to released or tell movers funds were paid out.
- [ ] **NOT VERIFIED** Razorpay Route eligibility/activation, linked-account onboarding/KYC, currency support, settlement holds, fee/commission terms, and webhook configuration. Confirm account/product availability and the legally approved flow with Razorpay before implementation.

## Database and operational safety

- [x] **IMPLEMENTED** Existing `PaymentOrder` and `Payment` records are separate; payment ID is unique; the shared per-Move payment lock is internal/select-hidden.
- [ ] **PARTIAL** `Payment.order` is not unique and there is no unique successful Payment per Move constraint. Controller locks enforce intended behavior during ordinary requests; DB-wide constraints/data state were not inspected.
- [ ] **KNOWN LEGACY ISSUE** `Service.model.js` and `ServiceProvider.model.js` both register `Provider` with differing schemas. Neither is loaded by active controllers. Do not import both; resolve model/collection mapping before future migration.
- [ ] **NOT VERIFIED** MongoDB backup/restore, production indexes, replica-set topology, and monitoring.
- [ ] **NOT IMPLEMENTED** Audit logs for admin/payment actions, operational alerting, and structured redacted logging policy.

## Manual configuration before staging

1. Set backend `MONGO_URI`, a generated high-entropy `JWT_SECRET` (at least 32 random bytes), `TRUST_PROXY_HOPS`, Razorpay server credentials, and Geoapify server key in deployment secret storage.
2. Keep all pricing variables unset until approved rates/currency and service/load/unload rules are supplied. Configure only in backend secret/config storage.
3. Confirm Razorpay test-mode credentials and capture behavior, then execute sandbox tests without production data.
4. If marketplace settlement is required, obtain Razorpay Route activation and linked-account requirements before designing or representing funds as held/released.
5. Configure a shared rate-limit store before running multiple backend instances.
6. Run and review the mover migration dry-run against isolated staging, apply it only after reviewing mover/job counts, then individually approve movers through the admin workflow. Existing active assignments remain attached but are inaccessible through mover APIs until approval.

No real credentials are stored in this checklist or either `.env.example`.
