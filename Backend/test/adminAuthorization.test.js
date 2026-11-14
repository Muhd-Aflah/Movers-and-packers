const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const User = require("../src/models/User.model");
const allowRoles = require("../src/middleware/role.middleware");

const makeResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test("admin middleware authorizes only an existing active current admin and selects no sensitive fields", async (t) => {
  const id = new mongoose.Types.ObjectId();
  const user = { _id: id, role: "admin", isActive: true };
  let selectedFields;
  t.mock.method(User, "findById", (requestedId) => {
    assert.equal(String(requestedId), String(id));
    return { select: async (fields) => { selectedFields = fields; return user; } };
  });
  const req = { user: { id: String(id), role: "admin" } };
  const res = makeResponse();
  let nextCalled = false;
  await allowRoles("admin")(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(req.user.role, "admin");
  assert.equal(selectedFields, "role isActive moverApprovalStatus");
  assert.equal("password" in req.currentUser, false);
});

test("old admin JWT is rejected after demotion, disablement, or deletion", async (t) => {
  const id = new mongoose.Types.ObjectId();
  let currentUser;
  t.mock.method(User, "findById", () => ({ select: async () => currentUser }));
  for (const account of [
    { _id: id, role: "user", isActive: true },
    { _id: id, role: "admin", isActive: false },
    null,
  ]) {
    currentUser = account;
    const response = makeResponse();
    let nextCalled = false;
    await allowRoles("admin")({ user: { id: String(id), role: "admin" } }, response, () => { nextCalled = true; });
    assert.notEqual(response.statusCode, 200);
    assert.equal(nextCalled, false);
    assert.match(response.body.message, /Access denied|disabled|no longer exists/);
  }
});

test("customer and mover JWT roles cannot access admin routes and do not trigger a database lookup", async (t) => {
  let lookups = 0;
  t.mock.method(User, "findById", () => { lookups += 1; throw new Error("should not query for non-admin token roles"); });
  for (const role of ["user", "mover"]) {
    const response = makeResponse();
    let nextCalled = false;
    await allowRoles("admin")({ user: { id: new mongoose.Types.ObjectId().toString(), role } }, response, () => { nextCalled = true; });
    assert.equal(response.statusCode, 403);
    assert.equal(nextCalled, false);
  }
  assert.equal(lookups, 0);
});

test("admin authorization fails closed with a generic response on database errors", async (t) => {
  t.mock.method(User, "findById", () => ({ select: async () => { throw new Error("private database diagnostic"); } }));
  const response = makeResponse();
  await allowRoles("admin")({ user: { id: new mongoose.Types.ObjectId().toString(), role: "admin" } }, response, () => assert.fail("next must not run"));
  assert.equal(response.statusCode, 500);
  assert.equal(response.body.message, "Could not verify account authorization");
  assert.equal(JSON.stringify(response.body).includes("private database diagnostic"), false);
});
