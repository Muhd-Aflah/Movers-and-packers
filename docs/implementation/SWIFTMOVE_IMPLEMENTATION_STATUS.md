> **Documentation status:** Point-in-time source snapshot. Later implementation details may differ; use [Backend/README.md](../../Backend/README.md) for current backend configuration and workflow notes, and verify source before relying on this document.

# SwiftMove Implementation Status (As Built)

This matrix reflects source evidence only. â€œCompleteâ€ means the repository contains a connected implementation for the described scope; it does not imply production deployment or end-to-end verification. File paths are relative to the repository root.

## Feature matrix

| Module | Status | Evidence | Remaining work / limits |
|---|---|---|---|
| Frontend routing/layout | Complete for declared routes | `Frontend/src/router/index.jsx`, `Frontend/src/components/layout/Layout.jsx` | Client route checks are presentation-only; runtime navigation not verified here |
| Customer signup/login | Partial | `Frontend/src/pages/SignupPage.jsx`, `Frontend/src/pages/LoginPage.jsx`, `Backend/src/controllers/auth.controller.js`, `Backend/src/models/User.model.js`, `Backend/src/middleware/rateLimit.middleware.js` | Auth requests are rate-limited per process and inputs bounded; no email verification, password reset, account lockout; mover role remains self-selectable |
| JWT/API authentication | Partial | `Backend/src/middleware/auth.middleware.js`, `Backend/src/middleware/role.middleware.js`, `Frontend/src/utils/auth.js`, `Backend/server.js` | HS256 explicitly verified; startup requires >=32-byte JWT secret; one-day JWT/localStorage; no refresh/revocation; production deployment config not verified |
| Customer profile | Complete for name/phone | `Frontend/src/pages/ProfilePage.jsx`, `Backend/src/controllers/user.controller.js`, `Backend/src/routes/user.routes.js` | No address book, email update, account deletion; runtime not verified |
| Customer booking | Partial | `Frontend/src/pages/BookingPage.jsx`, `Frontend/src/services/booking.service.js`, `Backend/src/controllers/move.controller.js`, `Backend/src/models/move.model.js` | Requires pricing config; server reprices; no cancellation; weight not priced; no quote persistence/expiry |
| Road distance | Partial (integration implemented; external operation unverified) | `Backend/src/services/pricing.service.js` | Requires Geoapify key/quota; first geocoding result used without confidence threshold; no live API check |
| Pricing | Partial / disabled pending rates | `Backend/src/services/pricing.service.js`, `Backend/src/controllers/pricing.controller.js`, `Backend/src/routes/pricing.routes.js`, `Backend/README.md` | No business rates/defaults. Quotes and bookings intentionally return no price until required config and approved rules exist |
| Quote persistence | Missing | Quote controller returns transient result; `Move` persists a fresh price snapshot | No Quote collection/ID/expiry or quote-to-move reference |
| Payment order creation | Partial | `Backend/src/controllers/payment.controller.js`, `Backend/src/models/paymentOrder.model.js`, `Backend/src/models/move.model.js` | Per-move lease and pending-order reuse; requires valid Razorpay credentials and priced Move; live gateway unverified; external order can be orphaned after local persistence failure |
| Payment verification | Partial | `Backend/src/controllers/payment.controller.js`, `Backend/src/models/payment.model.js`, `Backend/src/models/move.model.js` | HMAC/gateway checks, per-move lock, and same-callback retry implemented; no webhook/reconciliation/refunds; cross-document transactions not used |
| Customer move/payment dashboard | Partial | `Frontend/src/dashboards/UserDashboard.jsx`, `Backend/src/controllers/dashboard.controller.js`, `Frontend/src/dashboards/MyOrders.jsx`, `Frontend/src/dashboards/BalanceDashboard.jsx` | Payment summaries now grouped/formatted by stored currency; no active cancel/review flow |
| Customer status tracking | Partial | `Frontend/src/components/moves/MoveStatusTimeline.jsx`, `Frontend/src/components/moves/MyMoveCard.jsx`, Move status enum/controller | Current main dashboard list does not show the timeline; cancellation/review are explicitly unavailable; no notifications |
| Mover registration | Partial | `Frontend/src/pages/SignupPage.jsx`, `Backend/src/controllers/auth.controller.js` | Signup grants mover role immediately; no company/license capture or approval gate |
| Mover job discovery | Complete for current Move model | `Frontend/src/components/provider/AvailableMoves.jsx`, `Backend/src/controllers/provider.controller.js` | Only paid, priced, positive, unassigned moves shown; no filters/pagination; API runtime unverified |
| Mover acceptance | Complete for atomic claim | `Backend/src/controllers/provider.controller.js` uses conditional `findOneAndUpdate` | No rejection/unassign/reassignment flow |
| Mover job progression | Complete for two transitions | `Frontend/src/components/provider/ProviderJobs.jsx`, `Backend/src/controllers/provider.controller.js` | Only accepted -> in progress -> completed; no proof-of-delivery or customer confirmation |
| Mover earnings/payouts | Missing | `Frontend/src/dashboards/ProviderDashboard.jsx` says earnings later; no backend routes/models | No settlement, commission, payout, or earnings data |
| Admin dashboard | Partial | `Frontend/src/dashboards/AdminDashboard.jsx`, `Backend/src/controllers/admin.controller.js` | Read-only; revenue grouped by currency; support tickets hardcoded zero |
| Admin customer/mover/move/payment management | Partial | `Frontend/src/pages/admin/*`, `Backend/src/controllers/admin.controller.js`, `Backend/src/routes/admin.routes.js` | List-only; no edits, suspensions, deletion, mutations, pagination, exports, or audit history |
| Provider verification | Missing active workflow | `Backend/src/models/providerVerfication.js`; admin provider listing only | Schema exists but no mounted routes/controllers/UI action; not enforced for movers |
| Customer reviews | Missing active workflow | `Backend/src/models/Review.model.js`, `Frontend/src/components/moves/MyMoveCard.jsx`, `Backend/src/routes/review.routes.js` | Review UI button inert; route is unmounted and returns static response; model disconnected |
| Legacy service/order request flow | Placeholder / unmounted | `Backend/src/routes/service.routes.js`, `serviceRequest.routes.js`, `quote.routes.js`; `ServiceRequest.model.js`, `order.model.js` | Not available through server; placeholder success does not persist data |
| Service pages/marketing pages | Present, mostly static | `Frontend/src/pages/*`, `Frontend/src/sections/*` | Static claims/content not backed by operational inventory or metrics |
| Address book | Missing | Booking stores address on Move only | No saved/reusable address CRUD |
| Reports/analytics | Missing or configuration-only | Admin stats route; analytics env references in `Frontend/src/constants/config.js` | Revenue is grouped by currency; no report exports or analytics integration |
| Tests and automated quality gates | Partial | `Backend/test/phase1.test.js`, Backend `test` script | 13 Node built-in mocked/controller tests; no lint script, live HTTP/Mongo tests, or frontend test suite |

## Operational state and blockers

### Pricing must remain disabled until business configuration is supplied

No arbitrary rates are committed. Backend quote and booking creation require `PRICING_CURRENCY`, `PRICING_BASE_CHARGE`, `PRICING_PER_KM`, `PRICING_MINIMUM_CHARGE`, a selected service entry in `PRICING_SERVICE_CHARGES_JSON`, and any selected loading/unloading rates. With absent config the API fails closed and does not create a quote or Move. Business rule details and currency must be approved before these environment values are activated.

### Runtime verification not performed

This repository assessment did not connect to MongoDB, Geoapify, Razorpay, or a deployment; no secrets/environment-file values were inspected. Therefore connection strings, account credentials, API quotas, live CORS settings, deployed build, route behavior through the browser, gateway capture behavior, and production data/index state remain unverified.

## Known issues and risks by severity

### High

- **Unverified movers can operate.** Public `/provider/signup` maps directly to `role: mover`; mover endpoints authorize solely on that role. Provider verification model is unused. Evidence: `Backend/src/controllers/auth.controller.js`, `Backend/src/routes/provider.routes.js`, `Backend/src/models/providerVerfication.js`.
- **Payment completion is not reconciled.** No webhook/reconciliation handles an interrupted browser callback. A created PaymentOrder can remain pending even if gateway payment succeeds. Evidence: `Backend/src/controllers/payment.controller.js`, `Backend/src/routes/payment.routes.js`.
- **Cross-record payment updates are not transactional.** PaymentOrder, Payment, and Move are written separately; support/reconciliation may be required after partial failure. Evidence: `Backend/src/controllers/payment.controller.js`.
- **The only route/runtime quote flow is unavailable until real pricing config exists.** This is intentional fail-closed behavior, not an enabled production pricing system. Evidence: `Backend/src/services/pricing.service.js`.

### Medium

- Currency display and dashboard/admin revenue are grouped by stored currency. Legacy records without currency are labeled unknown; totals should still be reviewed against actual data. Evidence: `Frontend/src/utils/currency.js`, `Backend/src/controllers/dashboard.controller.js`, `Backend/src/controllers/admin.controller.js`.
- Public signup permits mover role with no verification, and admin has no way to verify provider despite a schema.
- Current contact/about marketing counters and capabilities are static presentation; their truth is not validated by server data. Evidence: `Frontend/src/pages/ContactPage.jsx`.
- First Geoapify geocoding result is accepted if coordinates exist; there is no confidence threshold or customer disambiguation. Wrong but plausible matches could yield an incorrect route after rates are configured. Evidence: `Backend/src/services/pricing.service.js`.
- Payment order creation and verification now use per-Move database leases and retry reuse; a five-minute lease can expire during an unusually long external call, and a local persistence failure after Razorpay order creation can leave an orphan gateway order. Evidence: `Backend/src/controllers/payment.controller.js`, `Backend/src/models/move.model.js`.
- No pagination on customer, mover, or admin list queries. Evidence: `Backend/src/controllers/admin.controller.js`, `move.controller.js`, `provider.controller.js`.

### Low / maintenance

- Two legacy model files register `mongoose.model("Provider")` with different schema definitions. Importing both can conflict. Evidence: `Backend/src/models/Service.model.js`, `Backend/src/models/ServiceProvider.model.js`.
- Unmounted route handlers return success-like placeholders; unused validation modules may appear to provide validation but are not connected to current operations. Evidence: `Backend/src/routes/*`, `Backend/src/validations/*`.
- Customer cancellation/review controls in the standalone `MyMoveCard` are inert. Evidence: `Frontend/src/components/moves/MyMoveCard.jsx`.
- Rate limiting is in-memory per process and depends on correct `TRUST_PROXY_HOPS`; multiple Render instances do not share counters. Evidence: `Backend/src/middleware/rateLimit.middleware.js`, `Backend/server.js`.
- `apiRequest` always sets JSON content type and uses localStorage token; no CSRF strategy is present. Evidence: `Frontend/src/services/api.js`, `Frontend/src/utils/auth.js`.
- A Node built-in mocked test suite now covers key auth, pricing, ownership, transition, payment, and limiter paths. It does not verify live HTTP wiring, Mongo behavior, external service credentials, or a full browser flow.

## Suggested development sequence (not yet implemented)

1. Obtain and document approved currency, base, distance, minimum, service, loading, unloading, and any weight-based rules; configure them only in backend secrets/config.
2. Decide mover onboarding/verification policy and enforce approval in authorization checks before assigning jobs.
3. Add Razorpay webhook/reconciliation and decide how to handle transaction consistency after confirming MongoDB topology.
4. Implement or remove disconnected placeholder routes/models.
5. Add pagination and expand tests to live HTTP/API tests in an isolated environment.
6. Run browser/database/gateway tests in configured staging and verify deployment configuration.

These are recommendations inferred from current gaps; they are not approved product requirements.
