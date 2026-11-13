const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../src/models/User.model");
const authController = require("../src/controllers/auth.controller");

const SECRET = "signup-test-secret-material-that-is-at-least-32-bytes";

const response = () => ({
  statusCode: 200,
  body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test("ordinary signup persists a hashed password and returns an HS256 JWT", async (t) => {
  process.env.JWT_SECRET = SECRET;
  t.mock.method(User, "findOne", async () => null);
  let persisted;
  t.mock.method(User.collection, "insertOne", async (document) => ({
    acknowledged: true,
    insertedId: (persisted = document)._id,
  }));

  const res = response();
  await authController.signup({
    body: { name: "Customer", email: "Customer@example.com", password: "correct horse battery staple" },
  }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.user.role, "user");
  assert.equal(res.body.user.email, "customer@example.com");
  const decoded = jwt.verify(res.body.token, SECRET, { algorithms: ["HS256"] });
  assert.equal(decoded.role, "user");
  assert.ok(persisted);
  assert.notEqual(persisted.password, "correct horse battery staple");
  assert.equal(await bcrypt.compare("correct horse battery staple", persisted.password), true);
});

test("duplicate account precheck and duplicate-key race return 409", async (t) => {
  t.mock.method(User, "findOne", async () => ({ _id: "existing" }));
  const existing = response();
  await authController.signup({
    body: { name: "Customer", email: "duplicate@example.com", password: "valid" },
  }, existing);
  assert.equal(existing.statusCode, 409);

  t.mock.method(User, "findOne", async () => null);
  t.mock.method(User, "create", async () => {
    const error = new Error("duplicate key with private record details");
    error.code = 11000;
    throw error;
  });
  const raced = response();
  await authController.signup({
    body: { name: "Customer", email: "race@example.com", password: "valid" },
  }, raced);
  assert.equal(raced.statusCode, 409);
  assert.equal(raced.body.message, "An account with this email already exists");
});

test("missing fields, invalid email, and invalid password return 400 without database calls", async (t) => {
  let calls = 0;
  t.mock.method(User, "findOne", async () => { calls += 1; return null; });
  const cases = [
    {},
    { name: "Customer", email: "not-an-email", password: "valid" },
    { name: "Customer", email: "customer@example.com", password: "" },
    { name: "Customer", email: "customer@example.com", password: "x".repeat(73) },
  ];
  for (const body of cases) {
    const res = response();
    await authController.signup({ body }, res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(calls, 0);
});

test("database failure returns generic 500 and logs only safe correlation metadata", async (t) => {
  const logged = [];
  t.mock.method(User, "findOne", async () => null);
  t.mock.method(User, "create", async () => { throw new Error("secret-bearing database detail"); });
  t.mock.method(console, "error", (...args) => logged.push(args));

  const res = response();
  await authController.signup({
    body: { name: "Customer", email: "private@example.com", password: "private-password" },
  }, res);

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.message, "Signup failed");
  assert.ok(res.body.requestId);
  const logText = JSON.stringify(logged);
  assert.match(logText, /requestId/);
  assert.match(logText, /create-account/);
  assert.doesNotMatch(logText, /private@example\.com|private-password|secret-bearing database detail/);
});

test("duplicate lookup failure is logged and does not reveal database error text", async (t) => {
  const logged = [];
  t.mock.method(User, "findOne", async () => { throw new Error("private connection detail"); });
  t.mock.method(console, "error", (...args) => logged.push(args));
  const res = response();
  await authController.signup({
    body: { name: "Customer", email: "lookup@example.com", password: "password" },
  }, res);
  assert.equal(res.statusCode, 500);
  assert.ok(res.body.requestId);
  assert.doesNotMatch(JSON.stringify(logged), /lookup@example\.com|password|private connection detail/);
});
