const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const User = require("../src/models/User.model");
const Move = require("../src/models/move.model");
const authController = require("../src/controllers/auth.controller");
const adminController = require("../src/controllers/admin.controller");
const allowRoles = require("../src/middleware/role.middleware");

const SECRET = "phase-1-2-test-secret-material-is-at-least-32-bytes";

const response = () => ({
  statusCode: 200,
  body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

const query = (value) => {
  const result = {
    select() { return result; },
    populate() { return result; },
    sort() { return result; },
    lean() { return Promise.resolve(value); },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
  };
  return result;
};

test("signup creates pending movers and leaves customer approval state unset", async (t) => {
  process.env.JWT_SECRET = SECRET;
  const created = [];
  t.mock.method(User, "findOne", async () => null);
  t.mock.method(User, "create", async (record) => {
    created.push(record);
    return { ...record, _id: new mongoose.Types.ObjectId() };
  });

  const moverResponse = response();
  await authController.signup({ body: { name: "Mover", email: "mover@example.com", password: "safe", role: "mover" } }, moverResponse);
  assert.equal(moverResponse.statusCode, 201);
  assert.equal(moverResponse.body.user.role, "mover");
  assert.equal(moverResponse.body.user.moverApprovalStatus, "pending");
  assert.equal(created[0].moverApprovalStatus, "pending");

  const customerResponse = response();
  await authController.signup({ body: { name: "Customer", email: "customer@example.com", password: "safe", role: "user" } }, customerResponse);
  assert.equal(customerResponse.statusCode, 201);
  assert.equal(customerResponse.body.user.role, "user");
  assert.equal(Object.hasOwn(created[1], "moverApprovalStatus"), false);
});

test("approved mover middleware reads current database status and blocks stale JWTs", async (t) => {
  const moverId = new mongoose.Types.ObjectId();
  let status = "pending";
  t.mock.method(User, "findById", () => ({ select: async () => ({ role: "mover", moverApprovalStatus: status }) }));
  const req = { user: { id: moverId.toString(), role: "mover" } };

  for (const blockedStatus of ["pending", "rejected", undefined]) {
    status = blockedStatus;
    const res = response();
    let next = false;
    await allowRoles.requireApprovedMover(req, res, () => { next = true; });
    assert.equal(res.statusCode, 403);
    assert.equal(next, false);
    assert.equal(res.body.status, blockedStatus || "pending");
  }

  status = "approved";
  const res = response();
  let next = false;
  await allowRoles.requireApprovedMover(req, res, () => { next = true; });
  assert.equal(next, true);
  assert.equal(res.statusCode, 200);
});

test("every mounted mover route requires approval middleware", () => {
  const router = require("../src/routes/provider.routes");
  const allowRoles = require("../src/middleware/role.middleware");
  const routes = router.stack.filter((layer) => layer.route).map((layer) => layer.route);
  assert.equal(routes.length, 5);
  for (const route of routes) {
    assert.ok(route.stack.some((layer) => layer.handle === allowRoles.requireApprovedMover), `${route.path} must check current approval`);
  }
});

test("customers and admins cannot pass mover-role authorization", () => {
  const moverOnly = allowRoles("mover");
  for (const role of ["user", "admin"]) {
    const res = response();
    let next = false;
    moverOnly({ user: { id: new mongoose.Types.ObjectId().toString(), role } }, res, () => { next = true; });
    assert.equal(res.statusCode, 403);
    assert.equal(next, false);
  }
});

test("approval records admin and timestamp; same-decision retry is idempotent", async (t) => {
  const moverId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();
  const existing = { _id: moverId, role: "mover", moverApprovalStatus: "pending" };
  let update;
  t.mock.method(User, "findOne", () => query(existing));
  t.mock.method(User, "findOneAndUpdate", (_filter, updateDoc) => {
    update = updateDoc.$set;
    return query({ ...existing, ...update });
  });
  const res = response();
  await adminController.approveMover({ params: { id: moverId.toString() }, body: {}, user: { id: adminId.toString(), role: "admin" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(update.moverApprovalStatus, "approved");
  assert.equal(String(update.moverReviewedBy), adminId.toString());
  assert.ok(update.moverReviewedAt instanceof Date);
  assert.equal(res.body.mover.moverApprovalStatus, "approved");

  let updateCalls = 0;
  t.mock.method(User, "findOne", () => query({ ...existing, moverApprovalStatus: "approved" }));
  t.mock.method(User, "findOneAndUpdate", () => { updateCalls += 1; return query(null); });
  const retry = response();
  await adminController.approveMover({ params: { id: moverId.toString() }, body: {}, user: { id: adminId.toString() } }, retry);
  assert.equal(retry.statusCode, 200);
  assert.equal(updateCalls, 0);
});

test("rejection requires a reason and reviewed decisions cannot be reversed", async (t) => {
  const moverId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();
  let findCalls = 0;
  t.mock.method(User, "findOne", () => { findCalls += 1; return query({ _id: moverId, role: "mover", moverApprovalStatus: "approved" }); });
  const missingReason = response();
  await adminController.rejectMover({ params: { id: moverId.toString() }, body: { reason: "   " }, user: { id: adminId.toString() } }, missingReason);
  assert.equal(missingReason.statusCode, 400);
  assert.equal(findCalls, 0);

  const conflictingDecision = response();
  await adminController.rejectMover({ params: { id: moverId.toString() }, body: { reason: "Not verified" }, user: { id: adminId.toString() } }, conflictingDecision);
  assert.equal(conflictingDecision.statusCode, 409);
});

test("invalid mover IDs and self-review are rejected", async () => {
  const adminId = new mongoose.Types.ObjectId();
  const invalid = response();
  await adminController.approveMover({ params: { id: "bad-id" }, body: {}, user: { id: adminId.toString() } }, invalid);
  assert.equal(invalid.statusCode, 400);
  const self = response();
  await adminController.approveMover({ params: { id: adminId.toString() }, body: {}, user: { id: adminId.toString() } }, self);
  assert.equal(self.statusCode, 403);
});

test("admin approval cannot target a customer account", async (t) => {
  const customerId = new mongoose.Types.ObjectId();
  t.mock.method(User, "findOne", () => query(null));
  const res = response();
  await adminController.approveMover({
    params: { id: customerId.toString() },
    body: {},
    user: { id: new mongoose.Types.ObjectId().toString(), role: "admin" },
  }, res);
  assert.equal(res.statusCode, 404);
});

test("migration dry-run only reports movers and never writes; apply leaves jobs and reviewed accounts alone", async () => {
  const migration = require("../scripts/migrateMoversToPending");
  const legacyMover = { _id: new mongoose.Types.ObjectId() };
  const reviewedMover = { _id: new mongoose.Types.ObjectId(), moverApprovalStatus: "approved", moverReviewedBy: new mongoose.Types.ObjectId() };
  const customer = { _id: new mongoose.Types.ObjectId(), role: "user" };
  let docs = [legacyMover, reviewedMover];
  let updateFilter;
  let updateCount = 0;
  const UserModel = {
    collection: { name: "users" },
    find(filter) {
      assert.deepEqual(filter, { role: "mover" });
      return { select: () => ({ lean: async () => docs }) };
    },
    async updateMany(filter, update, options) {
      updateCount += 1;
      updateFilter = filter;
      assert.deepEqual(update, { $set: { moverApprovalStatus: "pending" } });
      assert.deepEqual(options, { runValidators: true, timestamps: false });
      docs = docs.map((doc) => doc._id === legacyMover._id ? { ...doc, ...update.$set } : doc);
      return { modifiedCount: 1 };
    },
  };
  const MoveModel = {
    async aggregate(pipeline) {
      if (pipeline.some((stage) => stage.$lookup)) return [{ _id: "mover", count: 3 }, { _id: "ORPHAN", count: 1 }];
      return [{ _id: "accepted", count: 1 }, { _id: "completed", count: 2 }];
    },
    async countDocuments(filter) { assert.deepEqual(filter, { provider: null, status: "requested" }); return 4; },
  };

  const dryRun = await migration.migrateMoversToPending({ UserModel, MoveModel });
  assert.equal(dryRun.accountsToSetPending, 1);
  assert.equal(dryRun.assignedJobsTotal, 3);
  assert.equal(dryRun.assignedJobsByStatus.completed, 2);
  assert.equal(dryRun.orphanedProviderReferences, 1);
  assert.equal(dryRun.unassignedRequestedMoves, 4);
  assert.equal(dryRun.applied, false);
  assert.equal(updateCount, 0);
  assert.equal(customer.role, "user");

  const applied = await migration.migrateMoversToPending({ UserModel, MoveModel, apply: true });
  assert.equal(applied.modifiedCount, 1);
  assert.equal(updateCount, 1);
  assert.deepEqual(updateFilter, {
    role: "mover",
    moverApprovalStatus: { $exists: false },
    moverReviewedBy: { $exists: false },
    moverReviewedAt: { $exists: false },
    moverReviewReason: { $exists: false },
  });
  assert.equal(docs[0].moverApprovalStatus, "pending");
  assert.equal(docs[1].moverApprovalStatus, "approved");
});

test("migration refuses inconsistent approval metadata and unsafe CLI configuration", async () => {
  const migration = require("../scripts/migrateMoversToPending");
  const UserModel = {
    collection: { name: "users" },
    find: () => ({ select: () => ({ lean: async () => [
      { _id: new mongoose.Types.ObjectId(), moverReviewedAt: new Date() },
      { _id: new mongoose.Types.ObjectId(), moverReviewReason: "" },
    ] }) }),
  };
  const MoveModel = { aggregate: async () => [], countDocuments: async () => 0 };
  await assert.rejects(
    migration.migrateMoversToPending({ UserModel, MoveModel, apply: true }),
    { code: "MOVER_MIGRATION_REQUIRES_REVIEW" },
  );
  assert.throws(() => migration.assertSafeCliConfiguration([], {}), /MOVER_MIGRATION_ENV=staging/);
  assert.throws(() => migration.assertSafeCliConfiguration([], {
    MOVER_MIGRATION_ENV: "staging",
    MOVER_MIGRATION_CONFIRM_STAGING_DB: "YES",
    MONGO_URI: "mongodb://host/prod-swiftmove",
  }), /Production-looking/);
  assert.throws(() => migration.assertSafeCliConfiguration(["--apply"], {
    MOVER_MIGRATION_ENV: "staging",
    MOVER_MIGRATION_CONFIRM_STAGING_DB: "YES",
    MONGO_URI: "mongodb://host/swiftmove-staging",
  }), /--confirm-pending-mover-review/);
  assert.deepEqual(migration.assertSafeCliConfiguration(["--apply", "--confirm-pending-mover-review"], {
    MOVER_MIGRATION_ENV: "staging",
    MOVER_MIGRATION_CONFIRM_STAGING_DB: "YES",
    MONGO_URI: "mongodb://host/swiftmove-staging",
  }), { apply: true });
});

test("admin mover API routes retain authentication and admin-role guards", () => {
  const router = require("../src/routes/admin.routes");
  const approvalRoutes = router.stack
    .filter((layer) => layer.route && layer.route.path.startsWith("/movers"))
    .map((layer) => layer.route);
  assert.deepEqual(approvalRoutes.map(({ path }) => path), ["/movers", "/movers/:id", "/movers/:id/approve", "/movers/:id/reject"]);
  for (const route of approvalRoutes) {
    assert.ok(route.stack.length >= 3);
    assert.equal(route.stack[0].name, "protect");
    assert.equal(route.stack[1].name, "<anonymous>");
  }
});
