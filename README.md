# SwiftMove — Movers and Packers

SwiftMove is a moving and logistics application with a React/Vite frontend and an Express/MongoDB backend. The repository is under active development; deployment and external service behavior must be verified in the target environment.

## Get started

Install dependencies in each application folder and configure local environment values using the provided examples. Keep real credentials in local or deployment secret storage; never commit them.

Start the backend in one terminal:

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

The backend defaults to `http://localhost:5000`; Vite defaults to `http://localhost:5173`. See [Backend README](Backend/README.md) for current backend configuration, pricing, payment, and API workflow notes, and [Frontend README](Frontend/README.md) for frontend setup.

## Operational notes

- Pricing is computed by the backend and remains unavailable unless the required business-approved pricing configuration is set. Do not add sample or production rates without approval.
- Payment processing, webhooks, reconciliation, and mover approval have operational requirements described in the backend guide and security checklist. A local implementation does not establish live service or deployment readiness.
- The [Security Checklist](SECURITY_CHECKLIST.md) is the quick reference for implemented controls, known gaps, and staging actions.

## Documentation

Use the [documentation index](docs/README.md) to find architecture, implementation, workflow, migration, audit, and deployment records. Audit and implementation reports are retained as historical records; check their status notes and the current backend guide before relying on older findings.
