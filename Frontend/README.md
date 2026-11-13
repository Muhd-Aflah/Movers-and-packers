# SwiftMove Frontend

React and Vite frontend for SwiftMove.

## Development

From this directory, install the dependencies and run `npm run dev`. Create a local
`.env` file with the backend URL and Razorpay's public checkout key:

```text
VITE_API_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

The Geoapify key and all pricing rates belong on the backend. The browser requests
a quote from `/api/pricing/quote`; the backend resolves the addresses and calculates
road distance and the price breakdown. Booking creation recalculates the price on
the backend, and payment orders use that saved amount.

Pricing is intentionally unavailable until the business pricing rules and currency
are configured on the backend. The frontend does not contain fallback rates or
estimate prices from address text.

Build the frontend with `npm run build`.
