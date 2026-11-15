# SwiftMove Backend

Express API backed by MongoDB and Mongoose. The backend package is CommonJS.

## Run locally

```powershell
cd Backend
npm install
npm run dev
```

Copy `.env.example` to `.env` and fill in local service credentials. The backend
requires `MONGO_URI`, a `JWT_SECRET` containing at least 32 random bytes, a
valid environment-specific `APP_ENV`/`CORS_ORIGINS` pair, and
`RAZORPAY_WEBHOOK_SECRET` to start. `npm test` runs the Node built-in mocked
test suite.

The API listens on `PORT` (default `5000`). Configure the following variables in
the backend environment. Keep secret values out of source control.

| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing and verification key |
| `RAZORPAY_KEY_ID` | Razorpay server key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay server secret |
| `RAZORPAY_WEBHOOK_SECRET` | Secret configured for the Razorpay `payment.captured` webhook |
| `GEOAPIFY_API_KEY` | Server-side geocoding and road-routing API key |
| `APP_ENV` | Explicit deployment profile: `development`, `staging`, or `production` |
| `CORS_ORIGINS` | Comma-separated exact frontend origin allowlist for the selected deployment profile |
| `PRICING_CURRENCY` | Currency code for configured prices |
| `PRICING_VEHICLES_JSON` | Vehicle map containing base fare, per-km rate, and a separately approved minimum fare for each vehicle |
| `PRICING_PACKING_MATERIAL_RATES_JSON` | Backend material rates by material unit; required for full-service quotes |
| `PRICING_PACKING_PER_WORKER` | Packing labour rate per worker; required for full-service quotes |
| `PRICING_LOADING_PER_WORKER` | Loading labour rate per worker |
| `PRICING_UNLOADING_PER_WORKER` | Unloading labour rate per worker |
| `PRICING_TAX_STATUS` | Explicitly `disabled` or `enabled`; GST remains disabled until tax treatment is verified |
| `PRICING_TAX_RATE` | Required only when tax is explicitly enabled |
| `PORT` | Optional HTTP port |
| `TRUST_PROXY_HOPS` | Trusted reverse proxy hop count; use `0` for direct local development and set to the verified Render proxy topology in deployment |

The vehicle fares/minimums and labour rates in `.env.example` are the proposed
staging values provided by the business. Packing material rates remain unset
until each material's price unit is defined. Customer inventory and material
quantities are non-negative whole numbers (maximum 10,000); a configured
material charge is quantity times its backend rate. The application has no canonical
physical unit for a “quantity” (for example, roll, metre, or piece), so material
rates must not be configured until the business defines those units. Missing
configuration returns `PRICING_NOT_CONFIGURED`, never a zero-priced quote. The
frontend does not infer material quantities from inventory counts. Tolls are
excluded and the response labels them accordingly. The Geoapify key belongs
only in the backend environment; it is never sent to the browser.

For Render staging, configure the vehicle fares/minimums, labour rates, currency,
and disabled tax status from `.env.example`. Leave material rates unset until
the business defines their units and prices. Full-service bookings then enter
admin review. The admin estimate is payable only after the customer accepts its
current version. Transport-only quotes do not require packing configuration.
The additive Move schema fields require no backfill; existing saved move prices
remain stored as before.

CORS is isolated by `APP_ENV`. Development accepts explicitly configured HTTP
localhost origins only. Staging accepts only the approved staging Vercel origin
(`https://swiftmove-staging.vercel.app`), while production accepts only the
approved production Vercel origin
(`https://swiftmove-movers-and-packers.vercel.app`). Set `APP_ENV=staging` on
the staging backend even when `NODE_ENV=production`; set the matching exact
`CORS_ORIGINS` value. Startup rejects missing, wildcard, malformed, or
cross-environment origins. Credentials are enabled for the exact allowlist and
the CORS middleware handles OPTIONS preflight.

Socket.IO shares the same HTTP server and `APP_ENV`/`CORS_ORIGINS` allowlist.
Its handshake requires the existing HS256 JWT and reloads the current User
role/active state from MongoDB; pending movers are refused. The server assigns
a private `user:<id>` room and assigns the `role:admin` room only to current
admins. Clients cannot request rooms. Event payloads contain move identifiers
and status/version metadata only; clients refetch authoritative records through
the protected REST API. The server disconnects sockets at token expiry. There
is no socket secret or separate backend port.

Configure frontend `VITE_SOCKET_URL` to the backend HTTPS URL, such as
`https://movers-and-packers-1.onrender.com` for staging. When unset, the
frontend uses `VITE_API_URL`. Socket.IO starts with HTTP long-polling and
upgrades to WebSocket when available; HTTPS deployments use WSS for the
upgraded connection. Staging CORS permits the staging Vercel origin and
`https://localhost` for the Capacitor WebView. Production CORS remains
restricted to its currently approved Vercel origin; production Android sockets
require a separately approved origin change.

Notifications are stored in the `Notification` collection with a unique
`(recipient, eventKey)` index. The backend waits for `Notification.init()`
before listening so this deduplication index is ready before event writes. Run
the service database user with permission to create the new collection/index,
or provision the schema and index through the team's database change process
before deployment. Existing tracking-event notifications remain readable as
read-only historical entries. Authenticated notification routes include
customer, approved mover, and admin feeds plus
`PATCH /api/notifications/:id/read`; each read update is constrained to the
authenticated recipient.

Login, signup, and public quote requests have process-local rate limits. When the
backend is behind Render's proxy, configure `TRUST_PROXY_HOPS` correctly so
requests are limited by the client address. These limits are per backend process;
multi-instance deployments need a shared rate-limit store for fleet-wide limits.

Razorpay order creation first persists a `PaymentOrderIntent` containing the
customer, move, quote/acceptance versions, amount, currency, and a gateway
receipt reference. Only then does the backend contact Razorpay. If the call's
outcome is uncertain, the intent remains unresolved and blocks another order
and estimate revisions. If the gateway order ID was saved, a later request can
rebuild the local `PaymentOrder` from that ID after fetching it from Razorpay.
If the gateway succeeded but the response/ID could not be saved, the intent is
not silently released; a later signed capture can be associated using the
server-created intent ID in the fetched order notes. If no capture arrives,
support must investigate the intent in the Razorpay Dashboard. SwiftMove does
not assume that a custom receipt provides an order lookup, or that Razorpay
orders can be cancelled or expired.

Captured payments use a durable `PaymentProcessing` record with a lease and
unique payment ID. The same guarded processor handles checkout verification,
webhooks, and the recovery worker. Interrupted records are retried after their
lease expires. Payment order status, the payment record, and move credit remain
separate MongoDB writes; this workflow does not claim multi-document atomicity.
The worker makes retries durable, but a MongoDB outage that prevents persisting
the initial processing/event record still relies on Razorpay webhook retries
and operator investigation. The app does not assume that the deployed MongoDB
supports transactions; no transaction is used.

The new `PaymentOrderIntent`, `PaymentProcessing`, and stateful
`PaymentWebhookEvent` collections declare unique indexes for `(move,
pricingVersion)`, receipt, Razorpay payment ID, and webhook event ID. These
constraints are part of the concurrency safety model. Mongoose auto-indexing is
enabled by its current default, but startup does not wait for all indexes to
finish building. Before enabling staging payments, verify the unique indexes
exist in the staging database and grant the app's database user the required
index-creation permission if auto-indexing is used. Do not run index creation
against production as part of staging setup. Existing duplicate keys can
prevent a unique index from being built.

The `payment.captured` webhook uses raw-body signature verification, a required
event ID, and an atomic leased event claim. Processing failures remain retryable
and are not marked processed. Configure the webhook with
`RAZORPAY_WEBHOOK_SECRET`. Captured payments that do not match a saved accepted
quote are persisted in `PaymentReconciliation` and are never credited
automatically. Admins can inspect records at
`GET /api/admin/payments/reconciliation` and write audited review actions at
`POST /api/admin/payments/reconciliation/:id/review`. An admin cannot credit a
move from the reconciliation UI. A manual resolution entry is an audited
operator report only; it does not verify or execute a refund, credit a move, or
release a payment-order intent. Uncertain order intents are listed at
`GET /api/admin/payments/reconciliation/order-intents`; adding a review note
does not release the intent. For an intent with no saved gateway order ID or
local payment-order link, an admin may explicitly attest that Razorpay was
checked and no order exists. That action requires a reason, an external
evidence reference, and a confirmation; it is audited and permits a later
order request to reuse the same intent with a fresh receipt. Intents with a
gateway order ID or local payment-order link cannot be released this way. This
manual attestation is an operator assertion, not an API-verified cancellation
or proof from Razorpay. The `Payment.releaseStatus` field is a legacy
application value and does not prove funds are held or transferred.

Refunds are not synchronized or automated. If an operator refunds a payment in
Razorpay, they must verify the refund in the Razorpay Dashboard, retain its
external reference, record the outcome in the admin reconciliation page, and
update customer/support records through the approved manual process. SwiftMove
continues to show the local payment record separately and labels refund state
as unsynchronized. Do not treat the app's `paid` value as proof that no refund
occurred.

The current integration uses Razorpay standard orders/payments only. Mover
settlement requires an approved Razorpay Route marketplace setup, linked-account
onboarding, settlement-hold/transfer integration, and corresponding webhook and
reconciliation handling. Nothing in this backend releases funds. Confirm Route
eligibility, account activation, supported currency, fees, and business terms
with Razorpay before designing that phase.

## Mounted API routes

All protected endpoints require `Authorization: Bearer <token>`.

| Method | Path | Access |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Public; creates a customer (`user`) account only |
| `POST` | `/api/auth/mover-application` | Public; creates a pending mover account through the separate application flow |
| `POST` | `/api/auth/login` | Public |
| `GET` | `/api/auth/profile` | Authenticated |
| `GET`, `PUT` | `/api/users/:id` | Authenticated; own profile only |
| `POST` | `/api/moves` | User |
| `GET` | `/api/moves/my` | User |
| `GET` | `/api/moves/:id` | User; own move only |
| `POST` | `/api/moves/:id/accept-pricing` | User; own pending manual estimate only |
| `POST` | `/api/pricing/quote` | Public; returns final quote or non-payable manual-review transport baseline |
| `GET` | `/api/dashboard/user` | Authenticated |
| `POST` | `/api/payments/create-order` | Authenticated; body contains owned `moveId` |
| `POST` | `/api/payments/verify` | Authenticated |
| `POST` | `/api/payments/webhook` | Public endpoint; requires a valid Razorpay signature and event ID |
| `GET` | `/api/notifications/customer` | Customer; recent persisted and legacy move notifications |
| `GET` | `/api/notifications/mover` | Approved mover; recent persisted and legacy move notifications |
| `GET` | `/api/notifications/admin` | Admin; recent persisted notifications |
| `PATCH` | `/api/notifications/:id/read` | Authenticated recipient; mark own notification read |
| `GET` | `/api/payments/my` | Authenticated |
| `GET` | `/api/provider/current-job` | Approved mover |
| `GET` | `/api/provider/available-moves` | Approved mover; only paid, priced, unassigned moves |
| `GET` | `/api/provider/my-jobs` | Approved mover |
| `PUT` | `/api/provider/moves/:id/accept` | Approved mover |
| `PUT` | `/api/provider/moves/:id/status` | Approved mover |
| `GET` | `/api/admin/check` | Admin |
| `GET` | `/api/admin/dashboard/stats` | Admin |
| `GET` | `/api/admin/moves/manual-estimates` | Admin; manual review and customer acceptance queue |
| `PUT` | `/api/admin/moves/:id/packing-estimate` | Admin; server-calculates and audits a versioned estimate |
| `GET` | `/api/admin/users`, `/moves`, `/providers`, `/payments` | Admin |
| `GET` | `/api/admin/payments/reconciliation` | Admin; paginated captured-payment review records |
| `POST` | `/api/admin/payments/reconciliation/:id/review` | Admin; audited note, failed review, or reported manual outcome; no automatic credit/refund |
| `GET` | `/api/admin/payments/reconciliation/order-intents` | Admin; unresolved order creation intents |
| `POST` | `/api/admin/payments/reconciliation/order-intents/:id/review` | Admin; audited note or explicit verified-absence attestation for an intent with no gateway/local order IDs |
| `GET` | `/api/admin/movers?status=pending\|approved\|rejected` | Admin; pending is the default |
| `GET` | `/api/admin/movers/:id` | Admin; safe mover application profile |
| `PUT` | `/api/admin/movers/:id/approve` | Admin; pending mover only |
| `PUT` | `/api/admin/movers/:id/reject` | Admin; pending mover and required reason |

Protected APIs recheck the current account, active flag, and role in MongoDB on
every request; admins also get a current-role check at admin middleware.
Demoted, disabled, or deleted accounts lose access immediately. Legacy user
documents without `isActive` are treated as active; set `isActive: false` to
disable them.
New mover accounts start in `pending`. Every mover API rechecks the current
User approval state in MongoDB, so approval changes take effect for already
issued JWTs. Existing mover records without an approval state are denied mover
job access and appear in the pending admin list until reviewed. Use the
controlled migration guide to mark them pending before staging acceptance.

Other route files in `src/routes` are not mounted because their handlers are
placeholders or do not have a completed persistence workflow.

## List pagination and indexes

Mounted list endpoints accept one-based `page` and `limit` query parameters.
The default is `page=1&limit=10`; the maximum limit is 50. Non-positive,
non-integer, duplicate, unsafe, and over-limit values return HTTP 400. Results
use stable creation-time ordering with `_id` as the tie-breaker. Existing array
responses stay arrays and include a JSON `X-Pagination` response header with
`page`, `limit`, `total`, `totalPages`, `hasNextPage`, and `hasPrevPage`. CORS
exposes this header. The reconciliation endpoints retain their existing
`items`, `total`, `page`, and `limit` fields and add a `pagination` object. The
user dashboard keeps its `orders` and `payments` arrays and adds separate
`ordersPagination` and `paymentsPagination` metadata; its totals are computed
from database counts and a currency aggregation rather than loading all history.
The maximum offset is 1,000,000; use cursor pagination if the dataset grows past
that point.

Pagination is supported on customer move history and payment history; user
dashboard history; mover available moves and assigned jobs; admin users, moves,
providers, mover applications, payments, manual estimates, payment
reconciliations, and unresolved order intents. Existing mover status and
reconciliation search filters remain in effect.

The following schema indexes correspond to those query patterns:

| Index | Query supported |
| --- | --- |
| `Move { user: 1, createdAt: -1, _id: -1 }` | Customer move history and dashboard orders |
| `Move { user: 1, paid: 1 }` | Dashboard paid-move count |
| `Move { createdAt: -1, _id: -1 }` | Admin move list |
| `Move { provider: 1, createdAt: -1, _id: -1 }` | Mover assigned jobs and current-job lookup |
| `Move { status: 1, provider: 1, paid: 1, pricingStatus: 1, createdAt: -1, _id: -1 }` | Paid, priced, unassigned mover queue |
| `Move { serviceMode: 1, pricingStatus: 1, createdAt: 1, _id: 1 }` | Oldest-first manual estimate queue |
| `Move { moveDate: 1 }` | Scheduled-date dashboard count |
| `User { createdAt: -1, _id: -1 }` | Admin user list |
| `User { role: 1, createdAt: -1, _id: -1 }` | Admin provider/mover list |
| `User { role: 1, moverApprovalStatus: 1, createdAt: -1, _id: -1 }` | Admin mover status filter |
| `Payment { user: 1, createdAt: -1, _id: -1 }` | Customer payment history and dashboard |
| `Payment { createdAt: -1, _id: -1 }` | Admin payment list |
| `Payment { paymentStatus: 1, currency: 1 }` | Admin paid-revenue aggregation |
| `Payment { user: 1, paymentStatus: 1, currency: 1 }` | Customer paid-spend aggregation |
| `PaymentReconciliation { status: 1, receivedAt: 1, _id: 1 }` | Status-filtered reconciliation review |
| `PaymentReconciliation { receivedAt: 1, _id: 1 }` | Reconciliation `status=all` view |
| `PaymentOrderIntent { status: 1, requestedAt: 1, _id: 1 }` | Oldest-first unresolved order-intent review |

These are model declarations only; this work did not connect to or change any
database. Before staging use, inspect index definitions and build the new
non-unique indexes in the staging database using the team's normal change
process. Keep all existing payment-ID, order-ID, webhook-event, receipt, and
move/version unique indexes. The code no longer declares standalone `user`
and reconciliation `status` indexes where the new compound index covers their
prefix; pre-existing database indexes are not automatically removed by this
change and should be reviewed separately before any index drop is considered.

Array responses remain compatible for existing callers, but callers must read
`X-Pagination` and request subsequent pages to retrieve complete histories.
The current frontend does not yet request subsequent pages, so its list views
display only the first page until frontend pagination is implemented.
