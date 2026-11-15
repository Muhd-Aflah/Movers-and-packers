# SwiftMove Frontend

React and Vite frontend for SwiftMove.

## Development

From this directory, install the dependencies and run `npm run dev`. Create a local
`.env` file with the backend URL:

```text
VITE_API_URL=http://localhost:5000
```

The payment-order endpoint returns Razorpay's public key ID alongside its
server-created order details, so checkout configuration stays aligned with the
backend gateway credentials.

The Geoapify key and all pricing rates belong on the backend. The browser requests
a quote from `/api/pricing/quote`; the backend resolves the addresses and calculates
road distance and the price breakdown. Booking creation recalculates the price on
the backend, and payment orders use that saved amount.

Pricing is intentionally unavailable until the business pricing rules and currency
are configured on the backend. The frontend does not contain fallback rates or
estimate prices from address text.

Build the frontend with `npm run build`.
