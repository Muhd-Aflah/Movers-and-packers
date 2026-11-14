const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Move = require("../src/models/move.model");
const User = require("../src/models/User.model");
const Payment = require("../src/models/payment.model");
const PaymentReconciliation = require("../src/models/paymentReconciliation.model");
const PaymentOrderIntent = require("../src/models/paymentOrderIntent.model");
const { parsePagination, paginationMetadata } = require("../src/utils/pagination");
const moveController = require("../src/controllers/move.controller");
const providerController = require("../src/controllers/provider.controller");
const adminController = require("../src/controllers/admin.controller");
const paymentController = require("../src/controllers/payment.controller");

const queryFor = (data, trace = {}) => ({
  select(value) { trace.select = value; return this; },
  populate(...value) { (trace.populate ||= []).push(value); return this; },
  sort(value) { trace.sort = value; return this; },
  skip(value) { trace.skip = value; return this; },
  limit(value) { trace.limit = value; return this; },
  exec: async () => data,
});

const makeResponse = () => ({
  statusCode: 200,
  body: undefined,
  headers: {},
  set(name, value) { this.headers[name] = value; return this; },
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test("pagination defaults to 10 and accepts the maximum limit of 50", () => {
  assert.deepEqual(parsePagination({}), { page: 1, limit: 10, skip: 0 });
  assert.deepEqual(parsePagination({ page: "3", limit: "50" }), { page: 3, limit: 50, skip: 100 });
});

test("pagination rejects invalid, duplicate, oversized, and unsafe page or limit values", () => {
  for (const query of [
    { page: "0" }, { page: "-1" }, { page: "1.5" }, { page: "2junk" },
    { page: "9007199254740991", limit: "50" }, { page: "100002", limit: "10" }, { limit: "0" },
    { limit: "51" }, { limit: "many" }, { limit: ["10", "20"] },
  ]) {
    assert.throws(() => parsePagination(query), { code: "INVALID_PAGINATION" });
  }
});

test("pagination metadata handles empty results and the last page", () => {
  assert.deepEqual(paginationMetadata({ page: 1, limit: 10 }, 0), {
    page: 1, limit: 10, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false,
  });
  assert.deepEqual(paginationMetadata({ page: 3, limit: 10 }, 25), {
    page: 3, limit: 10, total: 25, totalPages: 3, hasNextPage: false, hasPrevPage: true,
  });
});

test("customer move history applies ownership, default pagination, and stable sorting", async (t) => {
  const owner = new mongoose.Types.ObjectId().toString();
  let filter;
  const trace = {};
  t.mock.method(Move, "find", (query) => { filter = query; return queryFor([], trace); });
  t.mock.method(Move, "countDocuments", async () => 21);
  const response = makeResponse();

  await moveController.getMyMoves({ user: { id: owner }, query: {} }, response);

  assert.deepEqual(filter, { user: owner });
  assert.deepEqual(trace.sort, { createdAt: -1, _id: -1 });
  assert.equal(trace.skip, 0);
  assert.equal(trace.limit, 10);
  assert.deepEqual(JSON.parse(response.headers["X-Pagination"]), {
    page: 1, limit: 10, total: 21, totalPages: 3, hasNextPage: true, hasPrevPage: false,
  });
  assert.deepEqual(response.body, []);
});

test("mover job history filters by the assigned mover and paginates the last page", async (t) => {
  const moverId = new mongoose.Types.ObjectId().toString();
  let filter;
  const trace = {};
  t.mock.method(Move, "find", (query) => { filter = query; return queryFor([], trace); });
  t.mock.method(Move, "countDocuments", async () => 51);
  const response = makeResponse();

  await providerController.getMyJobs({ user: { id: moverId }, query: { page: "2", limit: "50" } }, response);

  assert.deepEqual(filter, { provider: moverId });
  assert.deepEqual(trace.sort, { createdAt: -1, _id: -1 });
  assert.equal(trace.skip, 50);
  assert.equal(trace.limit, 50);
  assert.equal(JSON.parse(response.headers["X-Pagination"]).hasNextPage, false);
});

test("invalid list pagination returns 400 before querying", async (t) => {
  let calls = 0;
  t.mock.method(Move, "find", () => { calls += 1; return queryFor([]); });
  const response = makeResponse();

  await moveController.getMyMoves({ user: { id: "customer" }, query: { page: "2x" } }, response);

  assert.equal(response.statusCode, 400);
  assert.equal(calls, 0);
});

test("admin mover status and reconciliation search filters are retained with pagination", async (t) => {
  let userFilter;
  const userTrace = {};
  t.mock.method(User, "find", (query) => { userFilter = query; return queryFor([], userTrace); });
  t.mock.method(User, "countDocuments", async () => 0);
  const moverResponse = makeResponse();
  await adminController.getMoversByApprovalStatus({ query: { status: "approved" } }, moverResponse);
  assert.deepEqual(userFilter, { role: "mover", moverApprovalStatus: "approved" });
  assert.deepEqual(userTrace.sort, { createdAt: -1, _id: -1 });

  let reconciliationFilter;
  const reconciliationTrace = {};
  t.mock.method(PaymentReconciliation, "find", (query) => { reconciliationFilter = query; return queryFor([], reconciliationTrace); });
  t.mock.method(PaymentReconciliation, "countDocuments", async () => 4);
  const reconciliationResponse = makeResponse();
  await paymentController.getReconciliations({ query: { status: "failed", search: "pay.test" } }, reconciliationResponse);
  assert.equal(reconciliationFilter.status, "failed");
  assert.equal(reconciliationFilter.$or[0].razorpayPaymentId.$regex, "pay\\.test");
  assert.deepEqual(reconciliationTrace.sort, { receivedAt: 1, _id: 1 });
  assert.equal(reconciliationResponse.body.pagination.total, 4);
});

test("admin list routes retain authentication and role authorization", () => {
  const router = require("../src/routes/admin.routes");
  for (const path of ["/users", "/moves", "/providers", "/movers", "/payments", "/payments/reconciliation"]) {
    const route = router.stack.find((layer) => layer.route?.path === path && layer.route.methods.get);
    assert.ok(route, `${path} is mounted`);
    assert.equal(route.route.stack.length, 3, `${path} has authentication and admin-role guards`);
  }
});

test("query indexes cover the paginated list filters and stable sorts", () => {
  const hasIndex = (Model, expected) => Model.schema.indexes().some(([keys]) =>
    JSON.stringify(keys) === JSON.stringify(expected));
  assert.ok(hasIndex(Move, { user: 1, createdAt: -1, _id: -1 }));
  assert.ok(hasIndex(Move, { user: 1, paid: 1 }));
  assert.ok(hasIndex(Move, { provider: 1, createdAt: -1, _id: -1 }));
  assert.ok(hasIndex(Move, { serviceMode: 1, pricingStatus: 1, createdAt: 1, _id: 1 }));
  assert.ok(hasIndex(User, { role: 1, moverApprovalStatus: 1, createdAt: -1, _id: -1 }));
  assert.ok(hasIndex(Payment, { user: 1, createdAt: -1, _id: -1 }));
  assert.ok(hasIndex(Payment, { paymentStatus: 1, currency: 1 }));
  assert.ok(hasIndex(PaymentReconciliation, { status: 1, receivedAt: 1, _id: 1 }));
  assert.ok(PaymentOrderIntent.schema.indexes().some(([keys, options]) =>
    JSON.stringify(keys) === JSON.stringify({ move: 1, pricingVersion: 1 }) && options.unique === true));
});
