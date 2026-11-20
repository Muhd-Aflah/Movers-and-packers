# SwiftMove Mover Approval Workflow

## Account lifecycle

1. An applicant submits the separate `/provider/signup` form, which calls `POST /api/auth/mover-application`. The account is created as `role: "mover"` with `moverApprovalStatus: "pending"`. Generic `POST /api/auth/signup` creates customers only and rejects attempts to choose a mover/admin role.
2. The applicant can log in, but is sent to the application status page. That page refreshes the user profile from the API and shows the current pending/rejected state and rejection reason when applicable.
3. Admins open **Dashboard → Manage Providers** and review the pending list. The available profile data is the current User profile (name, email, phone, creation date); the existing product does not collect identity/license documents in this phase.
4. An admin explicitly approves or rejects a pending mover. Rejection requires a reason. Backend records the admin User ID and decision time.
5. Approval permits access to all mover job APIs. Rejection and pending status deny access. Every mover route checks MongoDB’s current User role/status after validating the JWT, so an already-issued JWT does not preserve access after a decision.

## Status transitions and policy boundary

```text
new mover signup ──> pending ──admin approve──> approved
                              └─admin reject───> rejected
```

The API treats repeated same-decision requests as successful/idempotent. A conflicting decision on an already reviewed account returns `409`; it does not replace reviewer, timestamp or reason. Reapplication and reversal policy is not defined here and must be supplied by the owner before adding those transitions.

Existing mover accounts with missing approval state are denied mover job APIs and appear as pending in the admin list. The controlled migration sets those legacy accounts to `pending`; admins must then review each account individually. No mover is grandfathered or auto-approved.

## Existing jobs and history

`Move.provider` references the existing `User` ObjectId. The migration does not update that field or any status/payment/history. Accepted and in-progress jobs remain assigned but become inaccessible through mover job APIs while that mover is pending/rejected. Completed jobs remain in history. Requested unassigned jobs remain unassigned and are not visible to pending/rejected accounts. No automatic reassignment or exception view was added. If operations need an assigned-job continuity exception, define its exact allowed read fields and actions and approve it as a separate change.

## Admin endpoints

- `GET /api/admin/movers?status=pending|approved|rejected` (default `pending`)
- `GET /api/admin/movers/:id`
- `PUT /api/admin/movers/:id/approve`
- `PUT /api/admin/movers/:id/reject` with `{ "reason": "..." }`

All endpoints require a valid JWT with admin role. Only `User` documents with `role: "mover"` can be reviewed. Responses exclude password hashes and token material. Invalid IDs return `400`, non-mover/missing records `404`, unauthorized role `403`, missing/invalid rejection reason `400`, and a conflicting previously reviewed decision `409`.

## Owner actions

- Supply the criteria and documents admins must use for verification; this implementation only surfaces fields already present on User.
- Name the admin reviewers and review existing pending accounts individually after migration.
- Decide reapplication/reversal policy before requesting those capabilities.
- Decide separately how operations will handle already assigned active jobs for movers awaiting review. No bypass was added.
