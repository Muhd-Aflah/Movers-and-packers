# SwiftMove — Movers and Packers

SwiftMove is a React/Vite frontend and Express/MongoDB backend for moving and logistics workflows. The project is under development.

## Run locally

Copy `Frontend/.env.example` to `Frontend/.env` and `Backend/.env.example` to `Backend/.env`, then set environment-specific values. The backend requires a MongoDB URI and a JWT secret containing at least 32 random bytes. Never commit real environment values.

Distance pricing is inactive until `PRICING_CURRENCY`, `PRICING_BASE_CHARGE`, `PRICING_PER_KM`, `PRICING_MINIMUM_CHARGE`, `PRICING_SERVICE_CHARGES_JSON`, and any selected loading/unloading charges are configured with approved business rates. There are no production rate defaults. See [Backend/README.md](Backend/README.md) for details.

Razorpay order and verification state is server-authoritative. Mover job discovery only returns paid moves. Marketplace settlement/release, payment webhooks, refunds, and reconciliation are not implemented; the existing Razorpay integration does not release funds to movers.

Start the backend:

```powershell
cd Backend
npm install
npm run dev
```

Start the frontend in another terminal:

```powershell
cd Frontend
npm install
npm run dev
```

Vite serves the frontend at `http://localhost:5173`; the backend defaults to `http://localhost:5000`.

See [Backend/README.md](Backend/README.md) for mounted routes and backend configuration.

Run the backend mocked checks with `cd Backend; npm test`. Build the frontend with `cd Frontend; npm run build`.
