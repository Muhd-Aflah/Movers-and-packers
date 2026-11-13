# SwiftMove Mover Approval Migration Guide

## Purpose and scope

`Backend/scripts/migrateMoversToPending.js` marks pre-existing `User` documents with `role: "mover"` and no approval/review fields as pending. It changes no account identity, role, password, profile, Move, payment or history fields. `Move.provider` references `User`, so assignments remain attached to the same user ID. No migration runs during server startup.

The script also inventories assigned move counts by status, assigned references by referenced User role (including orphaned references), and unassigned requested moves. It reports all counts before apply. If it finds incomplete/unknown approval metadata, it exits without applying so an operator can resolve the records deliberately.

## Safety checks

- Never run this script with a production MongoDB URI or production data.
- First provision or identify an isolated staging database containing a safe copy/synthetic fixture. Verify the MongoDB host and database name out of band before setting the confirmation variable.
- The script requires `MOVER_MIGRATION_ENV=staging`, `MOVER_MIGRATION_CONFIRM_STAGING_DB=YES`, and `MONGO_URI`. It refuses URIs containing a production-like token. These string guards are an extra safeguard, not proof that the endpoint is staging; operator verification remains required.
- Dry-run is the default. `--apply` and `--confirm-pending-mover-review` are both required to write.
- Do not rely on dry-run numbers in this report; no database was connected or inventoried during implementation.

## Dry-run

In PowerShell, set the staging URI through the approved local secret mechanism; do not commit it or paste it in tickets/chat:

```powershell
$env:MOVER_MIGRATION_ENV = "staging"
$env:MOVER_MIGRATION_CONFIRM_STAGING_DB = "YES"
$env:MONGO_URI = "<verified isolated staging MongoDB URI>"
cd Backend
npm run migrate:movers:pending -- --dry-run
```

Review `moverAccounts`, `accountsToSetPending`, `existingApprovalStatusCounts`, `assignedJobsByStatus`, `assignedJobsTotal`, `providerReferenceJobsByUserRole`, `orphanedProviderReferences`, and `unassignedRequestedMoves`. Resolve inconsistent mover metadata and orphaned references before apply; the script refuses inconsistent approval metadata but does not mutate or repair job references.

## Apply

After reviewing and recording the staging dry-run result, and only after an explicitly authorized staging change window:

```powershell
npm run migrate:movers:pending -- --apply --confirm-pending-mover-review
```

The update filter is restricted to mover role and absent approval/review fields. It writes only `moverApprovalStatus: "pending"`. The summary includes the pre-update inventory and `modifiedCount`. Re-running is safe: already-pending accounts no longer match, and accounts with an approval decision or review metadata are not overwritten.

## Validation after apply

1. Run a dry-run again; expected `accountsToSetPending` is zero unless new legacy mover accounts appeared since apply.
2. Confirm customer/admin counts and sample IDs are unchanged.
3. Confirm mover IDs, credentials/profile fields, and Move provider IDs/statuses are unchanged.
4. Confirm each pending mover is denied all five mover APIs with `403` and remains visible in admin pending review.
5. Approve/reject staging fixtures individually through admin UI/API; verify reviewer/time/reason and immediate authorization changes.
6. Do not infer the actual production inventory from staging or this mocked test suite. Production migration requires a separately reviewed future change and must not be run by this script as currently guarded.

## Rollback

There is no automatic rollback. The migration only sets the pending status, but reversing it to approved would violate the no-auto-approval requirement. Correct mistakes through an explicitly reviewed admin decision after policy approval; restore data from the isolated staging backup only if the staging run itself must be discarded.
