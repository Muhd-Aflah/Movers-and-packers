# SwiftMove Phase 1.2 — Implementation Report

**Overall status: PARTIALLY COMPLETED**  
**Code changes:** Implemented and locally checked  
**Existing database inventory/migration:** NOT VERIFIED / NOT RUN  
**Deployment/live verification:** NOT VERIFIED  
**Ready for isolated staging tests:** Code paths are prepared; first run the migration dry-run against a verified isolated staging database and review its inventory before staging workflow acceptance.

## Summary

Implemented mover approval using the existing `User` identity and preserved the `mover` role. New movers are created pending, all five mover job APIs re-read current role/approval state from MongoDB, admins can review and decide pending accounts, and the frontend displays application status and rejection reason. Added a guarded dry-run-by-default legacy migration script and documentation.

No database was connected and no migration was executed. No production data was read or modified. No deployment, Razorpay Route, payment, pricing, or unrelated feature changes were made. Existing uncommitted user changes were preserved.

## Audit and database findings

- `Move.provider` is an ObjectId reference to `User`. No second mover identity is needed.
- Existing approved/in-progress/completed move records stay associated with their original User IDs. The migration only updates approval status; it does not touch Move or Payment collections.
- Existing mover count, assigned jobs by status, orphaned references, and unassigned jobs are **NOT VERIFIED** because no isolated staging database URI/inventory was provided. The migration script reports these counts when explicitly run against a verified staging database.
- Existing active assignments remain inaccessible through mover job APIs until the assigned mover is explicitly approved. No automatic reassignment or pending-mover assignment exception was implemented.

## Schema changes

`User` has optional fields:

- `moverApprovalStatus`: enum `pending|approved|rejected`; no schema default, so customers/admins are not subject to mover approval.
- `moverReviewedBy`: optional ObjectId ref `User`.
- `moverReviewedAt`: optional decision timestamp.
- `moverReviewReason`: optional trimmed string, max 500 characters; rejection API requires it.

Signup explicitly sets new mover status to `pending`. Legacy movers with missing status are treated as pending by mover authorization and admin pending list. The additive migration sets pending only for role-mover records whose approval/review fields are absent; reviewed statuses/metadata are not overwritten.

## Backend authorization and admin APIs

- All five provider routes require JWT role `mover` and a fresh User lookup verifying current role and `moverApprovalStatus: "approved"`. Pending, rejected, and status-missing movers receive `403 MOVER_NOT_APPROVED`. Deleted accounts receive `401`. Rejection/approval therefore applies immediately to existing JWT sessions.
- Added admin-only endpoints:
  - `GET /api/admin/movers?status=pending|approved|rejected` (default pending; legacy missing status appears pending)
  - `GET /api/admin/movers/:id`
  - `PUT /api/admin/movers/:id/approve`
  - `PUT /api/admin/movers/:id/reject` with required reason
- Only mover User records can be changed. IDs/reasons are validated. Decisions record reviewer/time/reason. Same-decision retries are idempotent; the opposite decision after review is `409` until an owner-approved reapplication/reversal policy exists. Responses select safe User fields only.

## Frontend changes

- Mover signup clearly says Mover Signup, stores the pending response, and directs the applicant to an application status page instead of job dashboard.
- Login sends pending/rejected movers to the status page and approved movers to the mover dashboard as before.
- The status page refreshes approval state from `/api/auth/profile`; it shows rejection reason when present and directs a newly approved account to the mover dashboard.
- Direct mover dashboard routing uses approval state as a presentation guard. Backend checks remain authoritative.
- Admin provider management now has pending/approved/rejected tabs, profile details, approval action, required rejection reason, confirmations, loading/empty/error states, and only shows decision controls in the pending tab. Success is shown only after the API responds.

## Migration

Added `Backend/scripts/migrateMoversToPending.js` and `npm run migrate:movers:pending`. Dry-run is the default and reports mover counts, approval state counts, assigned moves by status, provider references grouped by User role/orphan, and unassigned requested moves. Apply is restricted to role-mover documents with absent approval and review fields and writes only `moverApprovalStatus: "pending"`; Mongoose timestamps are disabled for this update. The CLI requires staging environment confirmation and explicit apply confirmation; production-looking URI strings are refused. It does not run during server startup.

**Dry-run result:** Not run against a database; counts are **NOT VERIFIED**. Mocked dry-run test confirmed zero writes. Apply result: **NOT RUN**.

See [MOVER_MIGRATION_GUIDE.md](MOVER_MIGRATION_GUIDE.md) for execution steps and [MOVER_APPROVAL_WORKFLOW.md](MOVER_APPROVAL_WORKFLOW.md) for status and assignment behavior.

## Verification performed

| Check | Result |
|---|---|
| Backend `npm.cmd test` | **PASS** — 24 tests, 24 passed, 0 failed. Includes pending signup, current DB status enforcement, all five provider routes, customer/admin role denial, admin decision/audit/idempotency/non-mover/rejection validation, migration mocked dry-run/apply filter and CLI guards. |
| Backend JavaScript syntax (`node --check` for `src`, `scripts`, `test`) | **PASS** |
| Frontend `npm.cmd run build` | **PASS** — Vite transformed 1,642 modules and built production assets. |
| Live MongoDB migration dry-run | **NOT RUN** — no safe staging database supplied. |
| HTTP/browser E2E, deployment, Razorpay/Geoapify | **NOT RUN** |

These checks do not establish live database referential integrity or a deployed UI/API flow. The migration tests use mock models and synthetic records only.

## Files changed for Phase 1.2

**Backend:** `Backend/src/models/User.model.js`, `Backend/src/controllers/auth.controller.js`, `Backend/src/middleware/role.middleware.js`, `Backend/src/routes/provider.routes.js`, `Backend/src/controllers/admin.controller.js`, `Backend/src/routes/admin.routes.js`, `Backend/scripts/migrateMoversToPending.js`, `Backend/test/moverApproval.test.js`, `Backend/package.json`, `Backend/README.md`.

**Frontend:** `Frontend/src/services/auth.service.js`, `Frontend/src/pages/SignupPage.jsx`, `Frontend/src/pages/LoginPage.jsx`, `Frontend/src/components/auth/ProtectedRoute.jsx`, `Frontend/src/router/index.jsx`, `Frontend/src/router/DashboardRedirect.jsx`, `Frontend/src/pages/MoverApplicationPage.jsx`, `Frontend/src/services/admin.service.js`, `Frontend/src/pages/admin/AdminProvidersPage.jsx`.

**Documentation:** `PHASE_1_2_AUDIT.md`, `PHASE_1_2_IMPLEMENTATION_REPORT.md`, `MOVER_APPROVAL_WORKFLOW.md`, `MOVER_MIGRATION_GUIDE.md`, `docs/SWIFTMOVE_API_DOCUMENTATION.md`, `docs/SWIFTMOVE_DATABASE_DOCUMENTATION.md`, `docs/SWIFTMOVE_CURRENT_STATE_SRS.md`, `SECURITY_CHECKLIST.md`.

The existing Phase 1.1 readiness report and other pre-existing modified files were left in place.

## Remaining risks and owner actions

1. Provide/identify an isolated staging MongoDB database; verify its endpoint and backup, run the dry-run, review all counts, and only then authorize/apply the migration.
2. Individually review all pending legacy movers through admin UI. No automatic approvals or grandfathering are performed.
3. Decide the required verification documents/criteria. Current app profile only has name/email/phone; this phase does not collect licenses, identity documents, or bank details.
4. Define rejected mover reapplication and admin reversal policy before enabling those transitions.
5. Decide how dispatch/customer support will handle existing accepted/in-progress jobs attached to pending movers. Current APIs correctly deny those movers; no continuity exception or reassignment was implemented.
6. Test an approved/rejected decision in the isolated staging database, then verify old JWTs, Move assignments, IDs, and historical statuses.

**Phase 1.2 staging status:** The application code is ready for controlled staging validation after owner-supplied staging DB and migration review. Phase 1.2 is not marked fully staging-verified because database inventory, actual migration, and deployed browser/API checks remain unverified.
