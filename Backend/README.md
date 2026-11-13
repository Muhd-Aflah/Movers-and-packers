# SwiftMove Backend

Express API backed by MongoDB and Mongoose. The backend package is CommonJS.

## Run locally

```powershell
cd Backend
npm install
npm run dev
```

Copy `.env.example` to `.env` and fill in local service credentials. The backend
requires `MONGO_URI` and a `JWT_SECRET` containing at least 32 random bytes to
start. `npm test` runs the Node built-in mocked test suite.

The API listens on `PORT` (default `5000`). Configure the following variables in
the backend environment. Keep secret values out of source control.

| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing and verification key |
| `RAZORPAY_KEY_ID` | Razorpay server key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay server secret |
| `GEOAPIFY_API_KEY` | Server-side geocoding and road-routing API key |
| `PRICING_CURRENCY` | Currency code for configured prices |
| `PRICING_BASE_CHARGE` | Base booking charge |
| `PRICING_PER_KM` | Charge per road kilometre |
| `PRICING_MINIMUM_CHARGE` | Minimum booking charge |
| `PRICING_SERVICE_CHARGES_JSON` | JSON map of service type to additional charge |
| `PRICING_LOADING_CHARGE` | Optional loading charge; needed when selected |
| `PRICING_UNLOADING_CHARGE` | Optional unloading charge; needed when selected |
| `PORT` | Optional HTTP port |
| `TRUST_PROXY_HOPS` | Trusted reverse proxy hop count; use `0` for direct local development and set to the verified Render proxy topology in deployment |

Pricing variables intentionally have no defaults. Until the business rates and
currency are configured, quote and booking-price requests return
`PRICING_NOT_CONFIGURED` and do not generate an amount. The Geoapify key belongs
only in the backend environment; it is never sent to the browser.

Login, signup, and public quote requests have process-local rate limits. When the
backend is behind Render's proxy, configure `TRUST_PROXY_HOPS` correctly so
requests are limited by the client address. These limits are per backend process;
multi-instance deployments need a shared rate-limit store for fleet-wide limits.

Razorpay order creation and payment verification use the saved Move amount. A
database lock serializes order creation and payment verification per move, and a
paid move is only exposed to movers after payment verification. There is no
Razorpay webhook, reconciliation, refund, or mover settlement workflow. The
`Payment.releaseStatus` field is a legacy application value and does not prove
that money is on hold or has been transferred.

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
| `POST` | `/api/auth/signup` | Public; creates user or mover account |
| `POST` | `/api/auth/login` | Public |
| `GET` | `/api/auth/profile` | Authenticated |
| `GET`, `PUT` | `/api/users/:id` | Authenticated; own profile only |
| `POST` | `/api/moves` | User |
| `GET` | `/api/moves/my` | User |
| `GET` | `/api/moves/:id` | User; own move only |
| `POST` | `/api/pricing/quote` | Public quote; returns no amount until pricing is configured |
| `GET` | `/api/dashboard/user` | Authenticated |
| `POST` | `/api/payments/create-order` | Authenticated; body contains owned `moveId` |
| `POST` | `/api/payments/verify` | Authenticated |
| `GET` | `/api/payments/my` | Authenticated |
| `GET` | `/api/provider/current-job` | Approved mover |
| `GET` | `/api/provider/available-moves` | Approved mover; only paid, priced, unassigned moves |
| `GET` | `/api/provider/my-jobs` | Approved mover |
| `PUT` | `/api/provider/moves/:id/accept` | Approved mover |
| `PUT` | `/api/provider/moves/:id/status` | Approved mover |
| `GET` | `/api/admin/check` | Admin |
| `GET` | `/api/admin/dashboard/stats` | Admin |
| `GET` | `/api/admin/users`, `/moves`, `/providers`, `/payments` | Admin |
| `GET` | `/api/admin/movers?status=pending\|approved\|rejected` | Admin; pending is the default |
| `GET` | `/api/admin/movers/:id` | Admin; safe mover application profile |
| `PUT` | `/api/admin/movers/:id/approve` | Admin; pending mover only |
| `PUT` | `/api/admin/movers/:id/reject` | Admin; pending mover and required reason |

New mover accounts start in `pending`. Every mover API rechecks the current
User approval state in MongoDB, so approval changes take effect for already
issued JWTs. Existing mover records without an approval state are denied mover
job access and appear in the pending admin list until reviewed. Use the
controlled migration guide to mark them pending before staging acceptance.

Other route files in `src/routes` are not mounted because their handlers are
placeholders or do not have a completed persistence workflow.
