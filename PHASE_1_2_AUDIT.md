# SwiftMove Phase 1.2 — Pre-Implementation Audit

**Audit stage:** Completed before Phase 1.2 source changes  
**Date:** 2026-11-13  
**Data boundary:** No `.env` values were read. No MongoDB URI was used, and no live or production database was contacted. The worktree contained extensive pre-existing uncommitted changes; they are preserved.

## Scope reviewed

Read the Phase 1 audit, implementation and security reports, the Phase 1.1 staging readiness report, the as-built SRS and database documentation, and the active User/auth/provider/admin/move code paths, frontend signup/login/dashboard/admin provider paths, package scripts and existing mocked tests. Git status was reviewed before changes.

## Current implementation findings

1. `User` is the authoritative identity model. Its `role` enum is `user|admin|mover`; public signup accepts `user` or `mover`, and creates a mover with immediately active `role: "mover"`. The signup and login responses return `_id`, name, email and role, but no approval state.
2. JWT contains `{ id, role }`, expires after one day, and backend `protect` verifies the signature but does not load the current User document. `allowRoles("mover")` trusts the role claim.
3. All five mounted mover APIs in `Backend/src/routes/provider.routes.js` use `protect` and role middleware only: current job, available moves, my jobs, accept move, and update status. The controller reads/mutates the existing `Move` collection.
4. `Move.provider` is an ObjectId with `ref: "User"`. Existing accepted, in-progress, completed and requested moves therefore retain the same mover user ID if approval status is added to `User`. No current provider route reassigns a job as part of authorization.
5. Admin routes use `protect` plus `allowRoles("admin")`. The existing providers API is a read-only `User.find({role:"mover"})`; the admin provider page lists those records and has no decision actions. This is the natural place to add approval review without creating another identity model.
6. The signup form supports `/provider/signup` and passes the mover role. Login/dashboard routing relies on role only. There is no pending/rejected status view.
7. `Backend/src/models/providerVerfication.js` is legacy and references the ambiguous legacy `Provider` model. It is not used by active mover routes. Reusing it would conflict with the requirement to avoid a second mover identity and would not fit the current `Move.provider -> User` relationship.
8. Existing tests use `node:test` and mocked Mongoose/controller methods. They do not connect to MongoDB. Backend scripts currently include `npm test`; frontend exposes a Vite build only.

## Files expected to change

- Backend schema/auth/access: `Backend/src/models/User.model.js`, `Backend/src/controllers/auth.controller.js`, `Backend/src/middleware/role.middleware.js` or a focused new mover-approval middleware, `Backend/src/routes/provider.routes.js`.
- Backend administration: `Backend/src/routes/admin.routes.js`, `Backend/src/controllers/admin.controller.js`; any new focused service/validation module only if needed.
- Migration: new controlled script under `Backend/scripts/`, with dry-run default and explicit apply confirmation; no server-startup execution.
- Frontend: `Frontend/src/pages/SignupPage.jsx`, `Frontend/src/pages/LoginPage.jsx` if response messaging requires it, `Frontend/src/pages/DashboardPage.jsx`/role redirect or router for pending/rejected page, `Frontend/src/pages/admin/AdminProvidersPage.jsx`, and `Frontend/src/services/admin.service.js`.
- Tests/docs: extend `Backend/test/phase1.test.js` or add focused approval tests; update API/database docs and create implementation report, workflow and migration guide.

## Database and compatibility assessment

The schema supports a safe additive migration: add optional approval metadata to existing `User` documents and explicitly set `moverApprovalStatus: "pending"` on new mover signup. The new schema must not default customers/admins into an approval requirement. The controlled migration will only set pending status on legacy mover users whose approval status and review audit fields are all absent; it will not change IDs, passwords, profile fields, jobs, payments, customer/admin documents, or any reviewed decision. `Move.provider` remains the same `User` ObjectId and all historical statuses remain untouched.

**Live record inventory is unavailable in this audit.** No safe staging database URI/inventory was provided. Therefore current counts of mover accounts, assigned accepted/in-progress/completed jobs, requested/unassigned jobs, inconsistent statuses, and orphaned `Move.provider` references are **NOT VERIFIED**. The migration dry-run will calculate these counts against an explicitly supplied staging database. Do not run it with an unknown or production URI.

The migration should report the inventory and refuse `--apply` when there are malformed/partially reviewed records needing human resolution. Dry-run is the default; writes require explicit `--apply` and an explicit staging confirmation. It must not run as part of API startup.

## Authorization and assigned-job policy

Add a backend middleware after JWT verification and before every mover controller. It should load the current user by JWT ID, require current `role === "mover"`, and require current `moverApprovalStatus === "approved"`. Thus approval/rejection takes effect immediately for old JWTs, and a stale JWT role cannot bypass a role change. Pending/rejected requests receive 403; missing/deleted identities receive 401 or 404 according to the auth middleware contract. The frontend remains navigation UX only.

No exception will be implemented for pending movers to view existing assignments. The approved requirement says pending movers cannot access mover job functionality and asks for any continuity exception to be proposed separately. Migration changes only the User approval fields, so existing assignments and historical records remain intact but are not reachable through mover job APIs until that user is explicitly approved. No job is automatically reassigned.

## Admin decision behavior

Admin APIs will list movers by status, fetch a specific mover’s safe profile/application fields, and approve/reject only documents with `role: "mover"`. Decisions are limited to pending → approved/rejected. Repeating the same decision should be idempotent and return the current record; attempting the opposite decision on an already reviewed record should return conflict until an owner-approved reapplication/reversal policy exists. Rejection requires a bounded non-empty reason. Approval/rejection records reviewer User ID and timestamp; customer, mover and self-review attempts are forbidden. Responses must exclude password/JWT/internal fields.

## Pre-implementation blockers and limits

- Database mover/job counts cannot be inspected without an explicitly designated isolated staging database. No migration will be executed in this implementation turn.
- Whether rejected movers may reapply or an admin may reverse a decision remains an owner policy question. The implementation will not invent that policy; reviewed decisions will be immutable through the normal approval endpoints.
- The audit and source reports describe mocked test coverage only; no database or deployment verification is available.

**Audit status:** Complete. **Implementation has not started at the time this audit artifact is created.**
