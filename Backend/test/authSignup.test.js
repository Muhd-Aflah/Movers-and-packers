const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
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

test("database failure returns generic 500 and logs a safe diagnostic message", async (t) => {
  const logged = [];
  t.mock.method(User, "findOne", async () => null);
  t.mock.method(User, "create", async () => { throw new Error("database operation failed"); });
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
  assert.match(logText, /database operation failed/);
  assert.doesNotMatch(logText, /private@example\.com|private-password/);
});

test("duplicate lookup failure logs sanitized MongoDB diagnostics and keeps the response generic", async (t) => {
  const logged = [];
  const previousMongoUri = process.env.MONGO_URI;
  const previousJwtSecret = process.env.JWT_SECRET;
  const testMongoUri = "mongodb+srv://staging-user:staging-password@cluster.example/swiftmove_staging";
  const testJwtSecret = "diagnostic-test-secret-material-at-least-32-bytes";
  process.env.MONGO_URI = testMongoUri;
  process.env.JWT_SECRET = testJwtSecret;
  t.after(() => {
    if (previousMongoUri === undefined) delete process.env.MONGO_URI;
    else process.env.MONGO_URI = previousMongoUri;
    if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousJwtSecret;
  });

  t.mock.method(User, "findOne", async () => {
    const error = new Error(
      `not authorized on swiftmove_staging to find users for private@example.com; password: private-password; uri=${testMongoUri}; auth user staging-user; auth password staging-password; secret=${testJwtSecret}`,
    );
    error.name = "MongoServerError";
    error.code = 8000;
    error.codeName = "AtlasError";
    error.errorLabels = ["RetryableWriteError", "TransientTransactionError"];
    throw error;
  });
  t.mock.method(console, "error", (...args) => logged.push(args));
  const res = response();
  await authController.signup({
    body: { name: "Customer", email: "private@example.com", password: "private-password" },
  }, res);

  assert.equal(res.statusCode, 500);
  assert.ok(res.body.requestId);
  assert.deepEqual(Object.keys(res.body).sort(), ["message", "requestId"]);
  assert.equal(res.body.message, "Signup failed");

  const fields = logged[0][1];
  assert.equal(fields.requestId, res.body.requestId);
  assert.equal(fields.phase, "check-duplicate-email");
  assert.equal(fields.errorName, "MongoServerError");
  assert.equal(fields.errorCode, 8000);
  assert.equal(fields.codeName, "AtlasError");
  assert.deepEqual(fields.errorLabels, ["RetryableWriteError", "TransientTransactionError"]);
  assert.equal(fields.databaseName, mongoose.connection.name || null);
  assert.equal(fields.collectionName, "users");
  assert.equal(fields.usesDefaultConnection, User.db === mongoose.connection);
  assert.match(fields.errorMessage, /not authorized on swiftmove_staging to find users/);

  const logText = JSON.stringify(logged);
  assert.doesNotMatch(logText, /private@example\.com|private-password|staging-user|staging-password|cluster\.example|diagnostic-test-secret-material/);
});
