const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../src/models/User.model");
const { protect } = require("../src/middleware/auth.middleware");
const allowRoles = require("../src/middleware/role.middleware");

const SECRET = "unit-test-current-account-secret-material-32-bytes";
const makeResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

const invoke = async (t, currentUser, tokenRole = currentUser?.role || "user", throwLookup = false) => {
  process.env.JWT_SECRET = SECRET;
  const id = currentUser?._id || new mongoose.Types.ObjectId();
  t.mock.method(User, "findById", (requestedId) => {
    assert.equal(String(requestedId), String(id));
    return { select: async () => {
      if (throwLookup) throw new Error("private database diagnostic");
      return currentUser;
    } };
  });
  const token = jwt.sign({ id: String(id), role: tokenRole }, SECRET, { algorithm: "HS256", expiresIn: "1h" });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = makeResponse();
  let nextCalled = false;
  await protect(req, res, () => { nextCalled = true; });
  return { req, res, nextCalled, id };
};

test("disabled customer with a valid old JWT is rejected", async (t) => {
  const current = { _id: new mongoose.Types.ObjectId(), role: "user", isActive: false };
  const { res, nextCalled } = await invoke(t, current);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Account is disabled");
  assert.equal(nextCalled, false);
});

test("disabled approved mover with a valid old JWT is rejected before provider routes", async (t) => {
  const current = { _id: new mongoose.Types.ObjectId(), role: "mover", moverApprovalStatus: "approved", isActive: false };
  const { res, nextCalled } = await invoke(t, current);
  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test("demoted admin token uses the current customer role and cannot pass admin middleware", async (t) => {
  const current = { _id: new mongoose.Types.ObjectId(), role: "user", isActive: true };
  const { req, res, nextCalled } = await invoke(t, current, "admin");
  assert.equal(nextCalled, true);
  assert.equal(req.user.role, "user");
  const adminResponse = makeResponse();
  allowRoles("admin")(req, adminResponse, () => assert.fail("demoted account must not enter admin route"));
  assert.equal(adminResponse.statusCode, 403);
});

test("deleted account with a valid old JWT is rejected", async (t) => {
  const { res, nextCalled } = await invoke(t, null, "user");
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Account no longer exists");
  assert.equal(nextCalled, false);
});

test("legacy account without isActive remains active deliberately", async (t) => {
  const current = { _id: new mongoose.Types.ObjectId(), role: "user" };
  const { req, res, nextCalled } = await invoke(t, current);
  assert.equal(res.statusCode, 200);
  assert.equal(nextCalled, true);
  assert.equal(req.user.role, "user");
});

test("pending and rejected movers fail current approval checks", async (t) => {
  process.env.JWT_SECRET = SECRET;
  const id = new mongoose.Types.ObjectId();
  let current = { _id: id, role: "mover", isActive: true, moverApprovalStatus: "pending" };
  t.mock.method(User, "findById", () => ({ select: async () => current }));
  const token = jwt.sign({ id: String(id), role: "mover" }, SECRET, { algorithm: "HS256", expiresIn: "1h" });
  const req = { headers: { authorization: `Bearer ${token}` } };
  for (const status of ["pending", "rejected"]) {
    current = { ...current, moverApprovalStatus: status };
    const protectedResponse = makeResponse();
    let nextCalled = false;
    await protect(req, protectedResponse, () => { nextCalled = true; });
    assert.equal(nextCalled, true);
    const moverResponse = makeResponse();
    await allowRoles.requireApprovedMover(req, moverResponse, () => assert.fail("unapproved mover must not enter provider route"));
    assert.equal(moverResponse.statusCode, 403);
  }
});

test("account lookup failure fails closed without exposing diagnostics", async (t) => {
  const current = { _id: new mongoose.Types.ObjectId(), role: "user", isActive: true };
  const { res, nextCalled } = await invoke(t, current, "user", true);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.message, "Could not verify account authorization");
  assert.equal(nextCalled, false);
  assert.equal(JSON.stringify(res.body).includes("private database diagnostic"), false);
});
