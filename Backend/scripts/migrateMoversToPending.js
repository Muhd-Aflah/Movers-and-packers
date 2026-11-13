const mongoose = require("mongoose");
const User = require("../src/models/User.model");
const Move = require("../src/models/move.model");

const APPROVAL_STATUSES = new Set(["pending", "approved", "rejected"]);

const getMoverApprovalInventory = async ({ UserModel = User, MoveModel = Move } = {}) => {
  const movers = await UserModel.find({ role: "mover" })
    .select("_id moverApprovalStatus moverReviewedBy moverReviewedAt moverReviewReason")
    .lean();
  const moverIds = movers.map(({ _id }) => _id);
  const migrationCandidates = [];
  const inconsistentMovers = [];
  const existingApprovalStatusCounts = { approved: 0, rejected: 0, pending: 0 };

  for (const mover of movers) {
    const hasStatus = Object.prototype.hasOwnProperty.call(mover, "moverApprovalStatus") &&
      mover.moverApprovalStatus !== undefined;
    const hasReviewMetadata = ["moverReviewedBy", "moverReviewedAt", "moverReviewReason"]
      .some((field) => Object.prototype.hasOwnProperty.call(mover, field));

    if (!hasStatus && !hasReviewMetadata) {
      migrationCandidates.push(mover._id);
    } else if (hasStatus && APPROVAL_STATUSES.has(mover.moverApprovalStatus)) {
      existingApprovalStatusCounts[mover.moverApprovalStatus] += 1;
    } else {
      inconsistentMovers.push({
        id: String(mover._id),
        status: mover.moverApprovalStatus ?? "missing",
        hasReviewMetadata,
      });
    }
  }

  const assignedByStatus = moverIds.length
    ? await MoveModel.aggregate([
        { $match: { provider: { $in: moverIds } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ])
    : [];

  const referenceSummary = await MoveModel.aggregate([
    { $match: { provider: { $ne: null } } },
    {
      $lookup: {
        from: UserModel.collection.name,
        localField: "provider",
        foreignField: "_id",
        as: "assignedUser",
      },
    },
    { $unwind: { path: "$assignedUser", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ["$assignedUser.role", "ORPHAN"] },
        count: { $sum: 1 },
      },
    },
  ]);
  const unassignedRequestedMoves = await MoveModel.countDocuments({
    provider: null,
    status: "requested",
  });

  return {
    moverAccounts: movers.length,
    accountsToSetPending: migrationCandidates.length,
    existingApprovalStatusCounts,
    inconsistentMovers,
    assignedJobsByStatus: Object.fromEntries(
      assignedByStatus.map(({ _id, count }) => [_id || "unspecified", count]),
    ),
    assignedJobsTotal: assignedByStatus.reduce((total, entry) => total + entry.count, 0),
    providerReferenceJobsByUserRole: Object.fromEntries(
      referenceSummary.map(({ _id, count }) => [_id, count]),
    ),
    orphanedProviderReferences: referenceSummary.find(({ _id }) => _id === "ORPHAN")?.count || 0,
    unassignedRequestedMoves,
    migrationCandidateIds: migrationCandidates.map(String),
  };
};

const migrateMoversToPending = async ({ UserModel = User, MoveModel = Move, apply = false } = {}) => {
  const inventory = await getMoverApprovalInventory({ UserModel, MoveModel });
  if (inventory.inconsistentMovers.length) {
    const error = new Error("Mover approval fields are inconsistent; resolve them manually before migration");
    error.code = "MOVER_MIGRATION_REQUIRES_REVIEW";
    error.inventory = inventory;
    throw error;
  }
  if (!apply) return { ...inventory, applied: false, modifiedCount: 0 };

  const result = await UserModel.updateMany(
    {
      role: "mover",
      moverApprovalStatus: { $exists: false },
      moverReviewedBy: { $exists: false },
      moverReviewedAt: { $exists: false },
      moverReviewReason: { $exists: false },
    },
    { $set: { moverApprovalStatus: "pending" } },
    { runValidators: true, timestamps: false },
  );
  return {
    ...inventory,
    applied: true,
    modifiedCount: result.modifiedCount ?? result.nModified ?? 0,
  };
};

const assertSafeCliConfiguration = (args, env = process.env) => {
  const apply = args.includes("--apply");
  if (env.MOVER_MIGRATION_ENV !== "staging") {
    throw new Error("Set MOVER_MIGRATION_ENV=staging before running this migration");
  }
  if (env.MOVER_MIGRATION_CONFIRM_STAGING_DB !== "YES") {
    throw new Error("Set MOVER_MIGRATION_CONFIRM_STAGING_DB=YES only after verifying MONGO_URI points to isolated staging data");
  }
  if (!env.MONGO_URI) throw new Error("MONGO_URI must point to the explicitly selected staging database");
  if (/(^|[._/-])(prod|production)([._/-]|$)/i.test(env.MONGO_URI)) {
    throw new Error("Production-looking MongoDB URIs are refused");
  }
  if (apply && !args.includes("--confirm-pending-mover-review")) {
    throw new Error("Apply mode requires --confirm-pending-mover-review");
  }
  return { apply };
};

const runCli = async () => {
  let apply;
  try {
    ({ apply } = assertSafeCliConfiguration(process.argv.slice(2)));
    await mongoose.connect(process.env.MONGO_URI);
    const result = await migrateMoversToPending({ apply });
    const { migrationCandidateIds, ...summary } = result;
    console.log(JSON.stringify(summary, null, 2));
    if (migrationCandidateIds.length) {
      console.log(`Mover IDs requiring review state: ${migrationCandidateIds.join(", ")}`);
    }
  } catch (error) {
    console.error(error.message);
    if (error.inventory) console.error(JSON.stringify(error.inventory, null, 2));
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
};

if (require.main === module) runCli();

module.exports = {
  getMoverApprovalInventory,
  migrateMoversToPending,
  assertSafeCliConfiguration,
};
