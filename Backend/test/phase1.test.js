const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const User = require("../src/models/User.model");
const Move = require("../src/models/move.model");
const Payment = require("../src/models/payment.model");
const PaymentOrder = require("../src/models/paymentOrder.model");

const SECRET = "test-only-secret-material-that-is-at-least-32-bytes";
let fakeOrders;
let createOrderCalls;
let fakeGatewayPayment;

class FakeRazorpay {
  constructor() {
    this.orders = {
      create: async (input) => {
        createOrderCalls += 1;
        const order = {
          id: `order_test_${createOrderCalls}`,
          amount: input.amount,
          currency: input.currency,
          status: "created",
        };
        fakeOrders.set(order.id, order);
        return order;
      },
      fetch: async (id) => {
        if (!fakeOrders.has(id)) throw new Error("Unknown fake order");
        return fakeOrders.get(id);
      },
    };
    this.payments = {
      fetch: async (id) => ({ ...fakeGatewayPayment, id }),
    };
  }
}

const razorpayPath = require.resolve("razorpay");
const originalRazorpay = require("razorpay");
require.cache[razorpayPath].exports = FakeRazorpay;
const paymentController = require("../src/controllers/payment.controller");
require.cache[razorpayPath].exports = originalRazorpay;

const makeResponse = () => ({
  statusCode: 200,
  body: undefined,
  headers: {},
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
  set(name, value) { this.headers[name] = value; return this; },
});

const makeMove = (id = new mongoose.Types.ObjectId().toString()) => ({
  _id: id,
  user: "user-test-id",
  paid: false,
  pricingStatus: "priced",
  price: 12.34,
  pricing: { currency: "USD" },
});

test("signup rejects oversized bcrypt inputs and public admin role is never granted", async (t) => {
  process.env.JWT_SECRET = SECRET;
  const authController = require("../src/controllers/auth.controller");
  const oversized = makeResponse();
  await authController.signup({ body: { name: "Customer", email: "customer@example.com", password: "x".repeat(73), role: "user" } }, oversized);
  assert.equal(oversized.statusCode, 400);

  t.mock.method(User, "findOne", async () => null);
  t.mock.method(User, "create", async (input) => ({
    _id: "user-1",
    name: input.name,
    email: input.email,
    role: input.role,
  }));
  const response = makeResponse();
  await authController.signup({ body: { name: "Customer", email: "customer@example.com", password: "ok", role: "admin" } }, response);
  assert.equal(response.statusCode, 201);
  assert.equal(response.body.user.role, "user");
});

test("JWT middleware accepts valid HS256 and rejects expired or missing tokens", (t) => {
  process.env.JWT_SECRET = SECRET;
  const jwt = require("jsonwebtoken");
  const { protect } = require("../src/middleware/auth.middleware");
  const valid = jwt.sign({ id: "user-1", role: "user" }, SECRET, { algorithm: "HS256", expiresIn: "1m" });
  const expired = jwt.sign({ id: "user-1", role: "user" }, SECRET, { algorithm: "HS256", expiresIn: -1 });
  const wrongAlgorithm = jwt.sign({ id: "user-1", role: "user" }, SECRET, { algorithm: "HS384", expiresIn: "1m" });
  const invoke = (authorization) => {
    const req = { headers: authorization ? { authorization } : {} };
    const res = makeResponse();
    let nextCalled = false;
    protect(req, res, () => { nextCalled = true; });
    return { req, res, nextCalled };
  };
  assert.equal(invoke(`Bearer ${valid}`).nextCalled, true);
  assert.equal(invoke(`Bearer ${expired}`).res.statusCode, 401);
  assert.equal(invoke(`Bearer ${wrongAlgorithm}`).res.statusCode, 401);
  assert.equal(invoke(undefined).res.statusCode, 401);
});

test("role middleware rejects customers on admin APIs and movers on admin APIs", () => {
  const allowRoles = require("../src/middleware/role.middleware");
  const adminOnly = allowRoles("admin");
  for (const role of ["user", "mover"]) {
    const response = makeResponse();
    adminOnly({ user: { role } }, response, () => assert.fail("next must not run"));
    assert.equal(response.statusCode, 403);
  }
});

test("public quote rejects invalid inputs and missing prices without making a route call", async () => {
  const { getBookingPriceQuote, normalizeBookingInput } = require("../src/services/pricing.service");
  assert.throws(() => normalizeBookingInput({ pickup: "x", dropoff: "y", service: "unknown", weight: 1 }), { statusCode: 400 });

  const saved = {};
  for (const key of ["PRICING_CURRENCY", "PRICING_BASE_CHARGE", "PRICING_PER_KM", "PRICING_MINIMUM_CHARGE", "PRICING_SERVICE_CHARGES_JSON"]) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  try {
    await assert.rejects(
      getBookingPriceQuote({ pickup: "A", dropoff: "B", service: "delivery", weight: 3 }),
      (error) => error.code === "PRICING_NOT_CONFIGURED" && error.statusCode === 503,
    );
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("unresolved Geoapify results return no quote and never call routing", async () => {
  const { getBookingPriceQuote } = require("../src/services/pricing.service");
  const keys = [
    "GEOAPIFY_API_KEY", "PRICING_CURRENCY", "PRICING_BASE_CHARGE", "PRICING_PER_KM",
    "PRICING_MINIMUM_CHARGE", "PRICING_SERVICE_CHARGES_JSON",
  ];
  const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  for (const [key, value] of Object.entries({
    GEOAPIFY_API_KEY: "test-only-key",
    PRICING_CURRENCY: "USD",
    PRICING_BASE_CHARGE: "1",
    PRICING_PER_KM: "1",
    PRICING_MINIMUM_CHARGE: "1",
    PRICING_SERVICE_CHARGES_JSON: JSON.stringify({ delivery: 1 }),
  })) process.env[key] = value;

  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    return { ok: true, json: async () => ({ features: [] }) };
  };
  try {
    await assert.rejects(
      getBookingPriceQuote({ pickup: "Unknown A", dropoff: "Unknown B", service: "delivery", weight: 1 }),
      (error) => error.code === "LOCATION_NOT_FOUND" && error.statusCode === 422,
    );
    assert.equal(calls, 2);
  } finally {
    global.fetch = originalFetch;
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("customer move retrieval scopes the database query to the authenticated owner", async (t) => {
  const { getMyMove } = require("../src/controllers/move.controller");
  let filter;
  t.mock.method(Move, "findOne", (query) => {
    filter = query;
    return { populate: async () => null };
  });
  const response = makeResponse();
  await getMyMove({ params: { id: "move-1" }, user: { id: "user-1" } }, response);
  assert.equal(filter._id, "move-1");
  assert.equal(filter.user, "user-1");
  assert.equal(response.statusCode, 404);
});

test("mover status updates reject transitions outside accepted -> in_progress -> completed", async (t) => {
  const providerController = require("../src/controllers/provider.controller");
  let updateCalled = false;
  t.mock.method(Move, "findById", async () => ({ _id: "move-1", provider: "mover-1", status: "requested", paid: true }));
  t.mock.method(Move, "findOneAndUpdate", () => { updateCalled = true; });
  const response = makeResponse();
  await providerController.updateMoveStatus({
    params: { id: "move-1" },
    body: { status: "completed" },
    user: { id: "mover-1" },
  }, response);
  assert.equal(response.statusCode, 400);
  assert.equal(updateCalled, false);
});

test("assigned mover can advance an accepted move to in_progress", async (t) => {
  const providerController = require("../src/controllers/provider.controller");
  const original = { _id: "move-2", provider: "mover-2", status: "accepted", paid: true };
  const updated = { ...original, status: "in_progress" };
  let filter;
  t.mock.method(Move, "findById", async () => original);
  t.mock.method(Move, "findOneAndUpdate", (query) => {
    filter = query;
    return { populate: async () => updated };
  });
  const response = makeResponse();
  await providerController.updateMoveStatus({
    params: { id: original._id },
    body: { status: "in_progress" },
    user: { id: "mover-2" },
  }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.move.status, "in_progress");
  assert.equal(filter.provider, "mover-2");
  assert.equal(filter.status, "accepted");
});

test("repeated payment-order requests reuse the saved Razorpay order and amount", async (t) => {
  process.env.RAZORPAY_KEY_ID = "test-key-id";
  process.env.RAZORPAY_KEY_SECRET = SECRET;
  fakeOrders = new Map();
  createOrderCalls = 0;
  const move = makeMove();
  let pending = null;
  t.mock.method(Move, "findOne", async () => move);
  t.mock.method(Move, "findOneAndUpdate", async () => move);
  t.mock.method(Move, "exists", async () => true);
  t.mock.method(Move, "updateOne", async () => ({ modifiedCount: 1 }));
  t.mock.method(PaymentOrder, "findOne", () => ({ sort: async () => pending }));
  t.mock.method(PaymentOrder, "create", async (record) => {
    pending = { ...record, status: "created" };
    return pending;
  });

  const first = makeResponse();
  await paymentController.createOrder({ body: { moveId: move._id }, user: { id: move.user } }, first);
  const second = makeResponse();
  await paymentController.createOrder({ body: { moveId: move._id }, user: { id: move.user } }, second);

  assert.equal(first.statusCode, 201);
  assert.equal(second.statusCode, 200);
  assert.equal(first.body.order_id, second.body.order_id);
  assert.equal(first.body.amount, 1234);
  assert.equal(createOrderCalls, 1);
});

test("concurrent payment-order requests are serialized by the database lock", async (t) => {
  process.env.RAZORPAY_KEY_ID = "test-key-id";
  process.env.RAZORPAY_KEY_SECRET = SECRET;
  fakeOrders = new Map();
  createOrderCalls = 0;
  const move = makeMove();
  let lockClaimed = false;
  t.mock.method(Move, "findOne", async () => move);
  t.mock.method(Move, "findOneAndUpdate", async (filter) => {
    if (filter["paymentOrderLock.token"]) return move;
    if (lockClaimed) return null;
    lockClaimed = true;
    return move;
  });
  t.mock.method(Move, "exists", async () => true);
  t.mock.method(Move, "updateOne", async () => { lockClaimed = false; return { modifiedCount: 1 }; });
  t.mock.method(PaymentOrder, "findOne", () => ({ sort: async () => null }));
  t.mock.method(PaymentOrder, "create", async () => ({}));

  const responses = [makeResponse(), makeResponse()];
  await Promise.all(responses.map((response) => paymentController.createOrder(
    { body: { moveId: move._id }, user: { id: move.user } },
    response,
  )));
  assert.deepEqual(responses.map((response) => response.statusCode).sort(), [201, 409]);
  assert.equal(createOrderCalls, 1);
});

test("payment verification accepts a gateway-confirmed payment and is idempotent on retry", async (t) => {
  process.env.RAZORPAY_KEY_ID = "test-key-id";
  process.env.RAZORPAY_KEY_SECRET = SECRET;
  const orderId = "order_test_paid";
  const paymentId = "pay_test_paid";
  const order = { id: orderId, amount: 1234, currency: "USD", status: "paid" };
  fakeOrders = new Map([[orderId, order]]);
  fakeGatewayPayment = {
    order_id: orderId,
    amount: 1234,
    currency: "USD",
    status: "captured",
  };
  const move = makeMove();
  move.price = 12.34;
  const paymentOrder = {
    _id: "payment-order-1",
    user: move.user,
    move: move._id,
    amount: 12.34,
    currency: "USD",
    razorpayOrderId: orderId,
    status: "created",
  };
  let storedPayment = null;
  let localOrder = paymentOrder;
  t.mock.method(Payment, "findOne", async () => storedPayment);
  t.mock.method(Payment, "create", async (record) => {
    storedPayment = { ...record, _id: "payment-1", paymentStatus: "paid" };
    return storedPayment;
  });
  t.mock.method(PaymentOrder, "findOne", async () => localOrder);
  t.mock.method(PaymentOrder, "findOneAndUpdate", async (_filter, update) => {
    localOrder = { ...localOrder, ...update.$set, status: "paid" };
    return localOrder;
  });
  t.mock.method(PaymentOrder, "findById", async () => localOrder);
  t.mock.method(Move, "findOne", async () => move);
  t.mock.method(Move, "findOneAndUpdate", async (_filter, update) => {
    if (update?.$set?.paid) {
      move.paid = true;
      move.payment = update.$set.payment;
    }
    return move;
  });
  t.mock.method(Move, "updateOne", async () => ({ modifiedCount: 1 }));

  const signature = crypto.createHmac("sha256", SECRET).update(`${orderId}|${paymentId}`).digest("hex");
  const request = {
    body: {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    },
    user: { id: move.user },
  };

  const first = makeResponse();
  await paymentController.verifyPayment(request, first);
  const retry = makeResponse();
  await paymentController.verifyPayment(request, retry);

  assert.equal(first.statusCode, 200);
  assert.equal(retry.statusCode, 200);
  assert.equal(storedPayment.paymentStatus, "paid");
});

test("uncaptured gateway payment never marks PaymentOrder or Move paid", async (t) => {
  process.env.RAZORPAY_KEY_ID = "test-key-id";
  process.env.RAZORPAY_KEY_SECRET = SECRET;
  const orderId = "order_test_paid";
  const paymentId = "pay_test_auth_only";
  fakeOrders = new Map([[orderId, { id: orderId, amount: 1234, currency: "USD", status: "attempted" }]]);
  fakeGatewayPayment = {
    order_id: orderId,
    amount: 1234,
    currency: "USD",
    status: "authorized",
  };
  const move = makeMove();
  const paymentOrder = {
    _id: "payment-order-2",
    user: move.user,
    move: move._id,
    amount: 12.34,
    currency: "USD",
    razorpayOrderId: orderId,
    status: "created",
  };
  let mutations = 0;
  t.mock.method(Payment, "findOne", async () => null);
  t.mock.method(Payment, "create", async () => { mutations += 1; });
  t.mock.method(PaymentOrder, "findOne", async () => paymentOrder);
  t.mock.method(PaymentOrder, "findOneAndUpdate", async () => { mutations += 1; });
  t.mock.method(Move, "findOne", async () => move);
  t.mock.method(Move, "findOneAndUpdate", async (_filter, update) => {
    if (update?.$set?.paid) mutations += 1;
    return move;
  });
  t.mock.method(Move, "updateOne", async () => ({ modifiedCount: 1 }));

  const signature = crypto.createHmac("sha256", SECRET).update(`${orderId}|${paymentId}`).digest("hex");
  const response = makeResponse();
  await paymentController.verifyPayment({
    body: {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    },
    user: { id: move.user },
  }, response);

  assert.equal(response.statusCode, 409);
  assert.equal(mutations, 0);
  assert.equal(move.paid, false);
});

test("rate limiter returns 429 with Retry-After after the configured limit", () => {
  const { createRateLimiter } = require("../src/middleware/rateLimit.middleware");
  const limiter = createRateLimiter({ windowMs: 60000, max: 1 });
  const makeRequest = () => ({ ip: `test-${crypto.randomUUID()}` });
  const first = makeResponse();
  let nextCalled = false;
  limiter(makeRequest(), first, () => { nextCalled = true; });
  assert.equal(nextCalled, true);

  const ip = `repeat-${crypto.randomUUID()}`;
  limiter({ ip }, makeResponse(), () => {});
  const blocked = makeResponse();
  limiter({ ip }, blocked, () => {});
  assert.equal(blocked.statusCode, 429);
  assert.ok(Number(blocked.headers["Retry-After"]) > 0);
});
