# SwiftMove API Documentation (As Built)

Base URL is configured by the deployment and frontend `VITE_API_URL`. Local backend default is `http://localhost:5000`. All JSON requests use `Content-Type: application/json`. Protected endpoints use `Authorization: Bearer <JWT>`.

The inventory below is derived from `Backend/server.js`, route modules, and controller logic. Responses are JSON except `GET /`, which is plain text. There is no OpenAPI file. Dynamic IDs are MongoDB ObjectIds. Unless noted, controller failures may return a generic message and status described below.

## Mounted routes

| Method | Path | Authentication / authorization | Controller |
|---|---|---|---|
| GET | `/` | Public | inline in `server.js` |
| POST | `/api/auth/signup` | Public | `auth.controller.signup` |
| POST | `/api/auth/login` | Public | `auth.controller.login` |
| GET | `/api/auth/profile` | Valid JWT | `auth.controller.profile` |
| GET | `/api/users/:id` | Valid JWT; path ID must equal caller ID | `user.controller.getUserById` |
| PUT | `/api/users/:id` | Valid JWT; path ID must equal caller ID | `user.controller.updateUser` |
| POST | `/api/pricing/quote` | Public | `pricing.controller.createQuote` |
| POST | `/api/moves` | JWT role `user` | `move.controller.createMove` |
| GET | `/api/moves/my` | JWT role `user` | `move.controller.getMyMoves` |
| GET | `/api/moves/:id` | JWT role `user`; move must belong to caller | `move.controller.getMyMove` |
| GET | `/api/dashboard/user` | Valid JWT (no role allowlist) | `dashboard.controller.getUserDashboard` |
| POST | `/api/payments/create-order` | Valid JWT; caller must own move | `payment.controller.createOrder` |
| POST | `/api/payments/verify` | Valid JWT; caller must own PaymentOrder | `payment.controller.verifyPayment` |
| GET | `/api/payments/my` | Valid JWT; returns caller's records | `payment.controller.getMyPayments` |
| GET | `/api/provider/current-job` | JWT role `mover` and current DB approval `approved` | `provider.controller.getCurrentJob` |
| GET | `/api/provider/available-moves` | JWT role `mover` and current DB approval `approved` | `provider.controller.getAvailableMoves` |
| GET | `/api/provider/my-jobs` | JWT role `mover` and current DB approval `approved` | `provider.controller.getMyJobs` |
| PUT | `/api/provider/moves/:id/accept` | JWT role `mover` and current DB approval `approved` | `provider.controller.acceptMove` |
| PUT | `/api/provider/moves/:id/status` | JWT role `mover`, current DB approval `approved`; move must be assigned to caller | `provider.controller.updateMoveStatus` |
| GET | `/api/admin/check` | JWT role `admin` | Inline in `admin.routes.js` |
| GET | `/api/admin/dashboard/stats` | JWT role `admin` | `admin.controller.getAdminDashboardStats` |
| GET | `/api/admin/users` | JWT role `admin` | `admin.controller.getAllUsers` |
| GET | `/api/admin/moves` | JWT role `admin` | `admin.controller.getAllMoves` |
| GET | `/api/admin/providers` | JWT role `admin` | `admin.controller.getAllProviders` (legacy read-only list) |
| GET | `/api/admin/movers?status=pending\|approved\|rejected` | JWT role `admin`; `status` defaults to `pending` | `admin.controller.getMoversByApprovalStatus` |
| GET | `/api/admin/movers/:id` | JWT role `admin`; valid mover ObjectId | `admin.controller.getMoverApplication` |
| PUT | `/api/admin/movers/:id/approve` | JWT role `admin`; pending mover only | `admin.controller.approveMover` |
| PUT | `/api/admin/movers/:id/reject` | JWT role `admin`; pending mover, required `reason` (1–500 chars) | `admin.controller.rejectMover` |
| GET | `/api/admin/payments` | JWT role `admin` | `admin.controller.getAllPayments` |

Unmatched paths return `404 { "message": "Route not found" }`.

## Authentication and user APIs

### `POST /api/auth/signup`

Request:

```json
{ "name": "string", "email": "string", "password": "string", "role": "user | mover" }
```

`role` is optional; values other than `user` or `mover` are silently treated as `user`. `admin` cannot be self-created. New mover accounts start `moverApprovalStatus: "pending"`; customer/admin accounts do not require an approval state. The backend normalizes email to lowercase and hashes the password. The signed token is HS256 with a one-day expiry; startup requires a JWT secret of at least 32 bytes.

Success `201`:

For a customer: `{ "token": "JWT", "user": { "_id": "ObjectId", "name": "string", "email": "string", "role": "user" } }`. For a mover, the user object also contains `moverApprovalStatus` and (only after rejection) `moverReviewReason`.

Invalid/oversized inputs return `400`; duplicate email returns `400`; the process-local per-IP limit returns `429`; other failures return `500 { "message": "Signup failed" }`.

### `POST /api/auth/login`

Request: `{ "email": "string", "password": "string" }`. Success `200` returns the same token/user fields as signup. Missing/invalid/oversized credentials return `400`; invalid credentials `401`; rate limit `429`; unexpected errors `500`.

### `GET /api/auth/profile`

Requires JWT. Reads the current account from MongoDB and returns `{ "success": true, "user": { "_id", "name", "email", "role", "phone", "moverApprovalStatus?", "moverReviewReason?" } }`. A missing account returns `404`.

### `GET /api/users/:id`

Requires JWT and own path ID. Success returns the Mongoose User document excluding `password`. Mismatch returns `403`, missing user `404`; invalid ID/database failures are handled as `500`.

### `PUT /api/users/:id`

Requires JWT and own path ID. Body may contain `name` and/or `phone`; other fields are ignored. Name cannot be blank. Success returns updated User excluding password. Mismatch `403`, blank name `400`, missing user `404`, other error `500`.

## Pricing and move APIs

### `POST /api/pricing/quote`

Public. Body:

```json
{
  "pickup": "address string",
  "dropoff": "address string",
  "service": "warehousing|freight|packaging|delivery|custom",
  "weight": 1,
  "loadingRequired": false,
  "unloadingRequired": false
}
```

The weight value must be positive. Loading/unloading default to false when omitted. Success response shape (placeholders only, not a sample quote):

```json
{
  "pricingAvailable": true,
  "pickupResolved": "formatted address",
  "dropoffResolved": "formatted address",
  "distanceKm": "<number>",
  "currency": "configured ISO currency code",
  "breakdown": {
    "baseBookingCharge": "<number>",
    "pricePerKilometre": "<number>",
    "distanceCharge": "<number>",
    "serviceCharge": "<number>",
    "loadingCharge": "<number>",
    "unloadingCharge": "<number>",
    "subtotal": "<number>",
    "minimumBookingCharge": "<number>",
    "minimumAdjustment": "<number>",
    "total": "<number>"
  },
  "total": "<number>"
}
```

Error response includes `pricingAvailable: false`, `code`, and `message`; configuration errors may include `details.missing`. Common statuses: `400 INVALID_BOOKING_DETAILS`, `422 LOCATION_NOT_FOUND` or `ROUTE_NOT_FOUND`, `429` quote rate limit, `502 DISTANCE_PROVIDER_ERROR`, `503 PRICING_NOT_CONFIGURED` or `DISTANCE_PROVIDER_NOT_CONFIGURED`. With unset pricing variables no price is generated. The first Geoapify result is used without confidence checking.

### `POST /api/moves`

Requires `user` JWT. Body combines quote fields with `moveDate` (date string). Server recalculates route and price; any client amount is ignored. Success `201` returns the created Move document including `price`, `pricingStatus: "priced"`, and pricing snapshot. Invalid date returns `400`; quote/routing errors use pricing statuses above; unexpected persistence failure returns `500`.

### `GET /api/moves/my`

Requires `user` JWT. Returns an array of the caller's Move documents sorted newest first. Database failure returns `500`.

### `GET /api/moves/:id`

Requires `user` JWT. Returns only the caller's Move document, with `user` populated to `name email phone`; otherwise `404`. Invalid ObjectId currently returns `400`.

## Customer dashboard

### `GET /api/dashboard/user`

Requires any valid JWT. Returns:

```json
{
  "stats": { "totalMoves": "<count>", "paidMoves": "<count>", "totalSpentByCurrency": [{ "currency": "<configured code>", "amount": "<number>" }] },
  "orders": [],
  "payments": []
}
```

`orders` are actually Move documents. Paid totals are grouped in `stats.totalSpentByCurrency`; legacy records without a currency use `UNKNOWN`. Failure returns `500`.

## Payment APIs

### `POST /api/payments/create-order`

Requires JWT. Body is `{ "moveId": "ObjectId" }`; amount, currency, and user are never accepted from the client. It requires an owned, unpaid, priced Move with positive amount and configured Razorpay credentials. Success `201` (or `200` if a matching pending gateway order is reused):

```text
{ "order_id": "Razorpay order ID", "amount": "<minor-unit integer>", "currency": "<configured code>" }
```

`amount` is in currency minor units. A database lock serializes order creation for one move; a simultaneous request receives `409` and can retry. A matching `created` or `attempted` gateway order is reused. If the gateway reports an order paid, another order is not created. Missing payment credentials returns `503`; invalid move ID `400`; move not found `404`; paid move, lock busy, gateway-paid-awaiting-verification, or invalid pricing returns `409`; Razorpay errors return `502`.

### `POST /api/payments/verify`

Requires JWT. Body:

```json
{
  "razorpay_order_id": "string",
  "razorpay_payment_id": "string",
  "razorpay_signature": "hex HMAC"
}
```

Success: `{ "success": true, "payment": { "_id": "ObjectId", "paymentStatus": "paid" } }`. Incomplete callback `400`; invalid signature `400`; order not owned/found `404`; payment not captured or state conflict/payment lock busy `409`; missing credentials `503`; gateway errors `502`. The controller checks gateway order/payment details as well as the signature and uses the same per-move database lease as order creation. Repeating a successfully verified callback is idempotent.

### `GET /api/payments/my`

Requires JWT. Returns an array of the caller's Payment records with `move` populated and newest first. Failure returns `500`.

## Mover APIs

All require JWT role `mover` and an authoritative database lookup confirming `moverApprovalStatus: "approved"`. Pending/rejected/legacy status-missing accounts receive `403` with `code: "MOVER_NOT_APPROVED"` and a status value. A missing account returns `401`. The database check runs on every mover API request, so an admin decision takes effect with an already-issued JWT.

| Method / path | Parameters/body | Success response | Notable errors |
|---|---|---|---|
| `GET /api/provider/current-job` | None | One active assigned Move or `null`; user populated | `500` |
| `GET /api/provider/available-moves` | None | Array of requested, paid, unassigned, priced moves with user populated | `500` |
| `GET /api/provider/my-jobs` | None | Array of moves assigned to caller, newest first | `500` |
| `PUT /api/provider/moves/:id/accept` | No body required | `{ "message": "Move accepted successfully", "move": Move }` | `409` if no longer available; `500` unexpected |
| `PUT /api/provider/moves/:id/status` | `{ "status": "in_progress|completed" }` | `{ "message": "Move status updated successfully", "move": Move }` | `400` invalid/disallowed transition; `403` not assigned; `404` missing; `409` unpaid move or concurrent change; `500` unexpected |

Transitions supported: `accepted -> in_progress -> completed`. No rejection or cancellation API exists.

## Administrator APIs

All require JWT role `admin`.

| Method / path | Success response |
|---|---|
| `GET /api/admin/check` | `{ "message": "Admin route working" }` |
| `GET /api/admin/dashboard/stats` | Counts: `totalUsers`, `totalProviders`, `totalMoves`, `activeMoves`, `todaysBookings`, `revenueByCurrency: [{currency, amount}]`, `supportTickets` (always zero) |
| `GET /api/admin/users` | User array excluding passwords |
| `GET /api/admin/moves` | Move array with user/provider names and emails populated |
| `GET /api/admin/providers` | Legacy read-only list of mover records, excluding password |
| `GET /api/admin/movers?status=pending\|approved\|rejected` | Safe mover profiles for the selected status; legacy status-missing movers are listed as pending |
| `GET /api/admin/movers/:id` | One safe mover application profile; invalid ID `400`, non-mover/missing ID `404` |
| `PUT /api/admin/movers/:id/approve` | Approve a pending mover and record reviewer/timestamp; repeated same decision is idempotent, conflicting reviewed decision `409` |
| `PUT /api/admin/movers/:id/reject` | Reject a pending mover with JSON `{ "reason": "..." }`; reason required, trimmed, max 500 chars; stores reviewer/timestamp/reason |
| `GET /api/admin/payments` | Payment array with user and selected move fields populated |

Existing admin list endpoints remain read-only. Approval decisions are limited to pending → approved/rejected; an already reviewed decision cannot be reversed through these endpoints because reapplication/reversal policy is not defined. Admin responses never include password hashes or tokens. List routes have no pagination. Data errors return `500`.

## Unmounted or placeholder routes

These route modules are present under `Backend/src/routes`, but `server.js` does not mount them. Their endpoints are not reachable through the Express app as written:

| Module | Local route | Code behavior | Status |
|---|---|---|---|
| `quote.routes.js` | `POST /` (would be `/api/quote/` if mounted) | Checks name/phone/pickup/drop/moveDate then returns a success message without saving | Placeholder, unmounted |
| `service.routes.js` | `GET /` | Returns a static “Services list working” message | Placeholder, unmounted |
| `serviceRequest.routes.js` | `POST /` | Returns static success without persistence; imports middleware but does not use it | Placeholder, unmounted |
| `review.routes.js` | `POST /review` | Returns static “Review submitted”; imports middleware but does not use it | Placeholder, unmounted |

Controllers and schemas for ServiceRequest, Service, Review, Client, ServiceProvider, and provider verification do not participate in mounted API flows. See the database document.

## General implementation limits

- Signup, login, and quote APIs have process-local fixed-window rate limits. `TRUST_PROXY_HOPS` controls Express client IP resolution and defaults to zero. Limits are not shared among backend instances; fleet-wide enforcement needs a shared store.
- No pagination, API versioning, OpenAPI schema, request correlation ID, or public API health endpoint beyond `GET /` was found.
- JSON parsing errors may flow to generic Express error middleware. The middleware returns `Server Error` for 5xx and logs error stacks; log redaction was not verified.
- API runtime responses and gateway edge cases were not exercised for this documentation pass.
