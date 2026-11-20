# SwiftMove Real-Time Events

## Connection and authorization

The frontend connects to the existing Express HTTP server through Socket.IO.
Set `VITE_SOCKET_URL` to the backend origin; when unset, the frontend uses
`VITE_API_URL`. The connection uses Socket.IO's default HTTP long-polling with
WebSocket upgrade and sends the existing JWT in the Socket.IO `auth` handshake
field.

The server verifies HS256 and reloads the account from MongoDB. Missing,
expired, disabled, or unauthorized accounts cannot connect; movers must be
approved. The server, not the client, assigns `user:<userId>` and `role:admin`
rooms. There are no client room-join handlers. The server disconnects the
socket when its JWT expires. Business events are server-to-client only.

Socket.IO uses the same strict `APP_ENV`/`CORS_ORIGINS` allowlist as Express.
Staging permits the approved Vercel staging origin and `https://localhost` for
Capacitor. Production currently permits only the approved production Vercel
origin. Production Android access needs an explicitly approved allowlist change;
this implementation does not widen it.

## Event contract

Business event payloads are intentionally small and contain no customer
profile, address, payment secret, order ID, or JWT:

```json
{
  "moveId": "<MongoDB ObjectId>",
  "status": "requested|accepted|in_progress|completed",
  "pricingVersion": 2,
  "at": "<ISO-8601 timestamp>"
}
```

Optional `status` and `pricingVersion` are omitted when they do not apply.
Clients must fetch the authoritative move, payment, or dashboard data through
the existing authenticated REST APIs after receiving an event.

| Event | Trigger and recipients |
| --- | --- |
| `booking:created` | New Move save; customer and admin rooms |
| `booking:updated` | Estimate submission/acceptance or verified payment completion; customer and admin rooms |
| `booking:status_changed` | Successful mover assignment or tracking/status write; customer, admin, and assigned mover rooms |
| `booking:cancelled` | Reserved name; no cancellation workflow exists, so it is not emitted |
| `estimate:created` | First admin estimate write; customer and admin rooms |
| `estimate:updated` | Versioned admin estimate revision; customer and admin rooms |
| `estimate:accepted` | Successful customer acceptance write; customer and admin rooms |
| `estimate:rejected` | Reserved name; customers have no rejection workflow, so it is not emitted |
| `payment:initiated` | PaymentOrder and completed intent persisted after Razorpay order creation; customer and admin rooms |
| `payment:success` | Shared captured-payment processor has verified Razorpay state and persisted paid records; customer and admin rooms |
| `payment:failed` | Reserved name; no persisted, verified failure workflow currently exists, so it is not emitted |
| `payment:refunded` | Reserved name; refund synchronization/workflow is not implemented, so it is not emitted |
| `notification:new` | A new recipient-scoped notification is persisted; delivered only to that recipient's user room |
| `notification:read` | A recipient's notification is marked read in MongoDB; delivered only to that recipient's user room |

The Socket.IO server does not accept client-emitted business events. Notification
read state changes through the authenticated REST `PATCH
/api/notifications/:id/read` endpoint. Notification records use a unique
`(recipient, eventKey)` index to prevent duplicate feed items on retried
operations. Payment capture processing already deduplicates gateway retries;
`payment:success` is published only on the newly credited processing path.

Notification events carry this recipient-only payload:

```json
{
  "id": "<notification ObjectId>",
  "type": "estimate:created",
  "title": "Estimate ready",
  "message": "An administrator prepared an estimate for your move.",
  "moveId": "<MongoDB ObjectId>",
  "at": "<ISO-8601 timestamp>",
  "readAt": null,
  "isRead": false
}
```

## Dashboard synchronization and Android lifecycle

Customer and admin dashboards subscribe to the event families relevant to their
views and refetch only the current paginated list, summary, or statistics they
display. The customer dashboard retains its 12-second move-summary/list polling
fallback and does not poll payment APIs. The admin views refetch their current
page on relevant events and after socket reconnection. Event bursts from a
single write are coalesced in the admin UI.

The Capacitor App lifecycle plugin disconnects the socket while Android is in
the background and reconnects it when the app returns to the foreground. A
reconnection triggers REST synchronization because Socket.IO does not preserve
events while a device is suspended or offline. The app does not claim background
delivery; Firebase Cloud Messaging can be added later for that requirement.

## Staging setup

Set the frontend build variable to the staging API origin:

```env
VITE_API_URL=https://movers-and-packers-1.onrender.com
VITE_SOCKET_URL=https://movers-and-packers-1.onrender.com
```

On the Render staging service, keep `APP_ENV=staging` and
`CORS_ORIGINS=https://swiftmove-staging.vercel.app` (include
`https://localhost` only for the staging Android WebView build). Use separate
production Vercel build values and do not enable an origin until it is included
in the approved production allowlist. Before starting a deployment with the new
notification model, verify the MongoDB service user can create the notification
collection and its unique indexes. Deploy/test staging before considering any
production origin change.
