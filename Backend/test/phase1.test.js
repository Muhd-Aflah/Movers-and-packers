const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const User = require("../src/models/User.model");
const Move = require("../src/models/move.model");
const Payment = require("../src/models/payment.model");
const PaymentOrder = require("../src/models/paymentOrder.model");
const PaymentOrderIntent = require("../src/models/paymentOrderIntent.model");
const PaymentProcessing = require("../src/models/paymentProcessing.model");

const SECRET = "test-only-secret-material-that-is-at-least-32-bytes";
let fakeOrders;
let createOrderCalls;
let fakeGatewayPayment;
let onGatewayOrderCreate;
let gatewayCreateError;

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
        if (onGatewayOrderCreate) onGatewayOrderCreate(input, order);
        if (gatewayCreateError) throw gatewayCreateError;
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
  user: new mongoose.Types.ObjectId().toString(),
  paid: false,
  pricingStatus: "priced",
  price: 12.34,
  pricing: { currency: "USD" },
});

const stubOrderIntent = (t) => {
  let intent = null;
  t.mock.method(PaymentOrderIntent, "findOne", () => ({ sort: async () => intent }));
  t.mock.method(PaymentOrderIntent.prototype, "save", async function save() { intent = this; return this; });
  t.mock.method(PaymentOrderIntent, "updateOne", async (_filter, update) => {
    if (intent) Object.assign(intent, update.$set || {});
    return { modifiedCount: 1 };
  });
  return { get intent() { return intent; } };
};

const stubPaymentProcessing = (t) => {
  let processing = null;
  t.mock.method(PaymentProcessing, "findOneAndUpdate", async (_filter, update) => {
    if (update.$setOnInsert && !processing) processing = { _id: "processing-test", ...update.$setOnInsert };
    if (update.$set?.leaseToken) processing = { ...processing, ...update.$set };
    return processing;
  });
  t.mock.method(PaymentProcessing, "updateOne", async (_filter, update) => {
    if (processing) {
      Object.assign(processing, update.$set || {});
      if (update.$unset?.leaseToken) delete processing.leaseToken;
    }
    return { modifiedCount: 1 };
  });
  t.mock.method(PaymentProcessing, "findOne", async () => processing);
};

test("signup rejects oversized bcrypt inputs and public admin role is rejected", async (t) => {
  process.env.JWT_SECRET = SECRET;
  const authController = require("../src/controllers/auth.controller");
  const oversized = makeResponse();
  await authController.signup({ body: { name: "Customer", email: "customer@example.com", password: "x".repeat(73), role: "user" } }, oversized);
  assert.equal(oversized.statusCode, 400);

  let createCalled = false;
  t.mock.method(User, "create", async () => { createCalled = true; });
  const response = makeResponse();
  await authController.signup({ body: { name: "Customer", email: "customer@example.com", password: "ok", role: "admin" } }, response);
  assert.equal(response.statusCode, 400);
  assert.equal(createCalled, false);
});

test("JWT middleware accepts valid HS256 and rejects expired or missing tokens", async (t) => {
  process.env.JWT_SECRET = SECRET;
  const jwt = require("jsonwebtoken");
  const { protect } = require("../src/middleware/auth.middleware");
  const userId = new mongoose.Types.ObjectId();
  t.mock.method(User, "findById", () => ({ select: async () => ({ _id: userId, role: "user", isActive: true }) }));
  const valid = jwt.sign({ id: String(userId), role: "user" }, SECRET, { algorithm: "HS256", expiresIn: "1m" });
  const expired = jwt.sign({ id: String(userId), role: "user" }, SECRET, { algorithm: "HS256", expiresIn: -1 });
  const wrongAlgorithm = jwt.sign({ id: String(userId), role: "user" }, SECRET, { algorithm: "HS384", expiresIn: "1m" });
  const invoke = async (authorization) => {
    const req = { headers: authorization ? { authorization } : {} };
    const res = makeResponse();
    let nextCalled = false;
    await protect(req, res, () => { nextCalled = true; });
    return { req, res, nextCalled };
  };
  assert.equal((await invoke(`Bearer ${valid}`)).nextCalled, true);
  assert.equal((await invoke(`Bearer ${expired}`)).res.statusCode, 401);
  assert.equal((await invoke(`Bearer ${wrongAlgorithm}`)).res.statusCode, 401);
  assert.equal((await invoke(undefined)).res.statusCode, 401);
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
  assert.throws(() => normalizeBookingInput({ pickup: "x", dropoff: "y", serviceMode: "unknown", vehicleType: "tata_ace" }), { statusCode: 400 });

  const saved = {};
  for (const key of ["PRICING_CURRENCY", "PRICING_VEHICLES_JSON", "PRICING_PACKING_MATERIAL_RATES_JSON", "PRICING_PACKING_PER_WORKER", "PRICING_LOADING_PER_WORKER", "PRICING_UNLOADING_PER_WORKER", "PRICING_TAX_STATUS"]) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  try {
    await assert.rejects(
      getBookingPriceQuote({ pickup: "A", dropoff: "B", serviceMode: "transport_only", vehicleType: "tata_ace" }),
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
    "PRICING_VEHICLES_JSON", "PRICING_PACKING_MATERIAL_RATES_JSON", "PRICING_TAX_STATUS",
  ];
  const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  for (const [key, value] of Object.entries({
    GEOAPIFY_API_KEY: "test-only-key",
    PRICING_CURRENCY: "USD",
    PRICING_VEHICLES_JSON: JSON.stringify({ tata_ace: { baseFare: 1, perKmRate: 1, minimumFare: 1 } }),
    PRICING_TAX_STATUS: "disabled",
  })) process.env[key] = value;

  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    return { ok: true, json: async () => ({ features: [] }) };
  };
  try {
    await assert.rejects(
      getBookingPriceQuote({ pickup: "Unknown A", dropoff: "Unknown B", serviceMode: "transport_only", vehicleType: "tata_ace" }),
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
  const moveId = new mongoose.Types.ObjectId();
  const ownerId = new mongoose.Types.ObjectId();
  let filter;
  t.mock.method(Move, "findOne", (query) => {
    filter = query;
    const result = { populate() { return result; }, then(resolve, reject) { return Promise.resolve(null).then(resolve, reject); } };
    return result;
  });
  const response = makeResponse();
  await getMyMove({ params: { id: moveId.toString() }, user: { id: ownerId.toString() } }, response);
  assert.equal(filter._id, moveId.toString());
  assert.equal(filter.user, ownerId.toString());
  assert.equal(response.statusCode, 404);
});

test("mover status updates reject transitions outside accepted -> in_progress -> completed", async (t) => {
  const providerController = require("../src/controllers/provider.controller");
  const moveId = new mongoose.Types.ObjectId();
  let updateCalled = false;
  t.mock.method(Move, "findById", async () => ({ _id: moveId, provider: "mover-1", status: "requested", paid: true }));
  t.mock.method(Move, "findOneAndUpdate", () => { updateCalled = true; });
  const response = makeResponse();
  await providerController.updateMoveStatus({
    params: { id: moveId.toString() },
    body: { status: "completed" },
    user: { id: "mover-1" },
  }, response);
  assert.equal(response.statusCode, 400);
  assert.equal(updateCalled, false);
});

test("assigned mover can advance an accepted move to in_progress", async (t) => {
  const providerController = require("../src/controllers/provider.controller");
  const original = { _id: new mongoose.Types.ObjectId(), provider: "mover-2", status: "accepted", paid: true, trackingEvents: [] };
  const updated = { ...original, status: "in_progress" };
  let filter;
  t.mock.method(Move, "findById", async () => original);
  t.mock.method(Move, "findOneAndUpdate", (query) => {
    filter = query;
    const result = { populate() { return result; }, then(resolve, reject) { return Promise.resolve(updated).then(resolve, reject); } };
    return result;
  });
  const response = makeResponse();
  await providerController.updateMoveStatus({
    params: { id: original._id.toString() },
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
  stubOrderIntent(t);
  t.mock.method(Move, "findOne", async () => move);
  t.mock.method(Move, "findOneAndUpdate", async () => move);
  t.mock.method(Move, "exists", async () => true);
  t.mock.method(Move, "updateOne", async () => ({ modifiedCount: 1 }));
  t.mock.method(PaymentOrder, "find", () => ({ sort: async () => pending ? [pending] : [] }));
  t.mock.method(PaymentOrder, "findOneAndUpdate", async (_filter, update) => {
    pending ||= { ...update.$setOnInsert, _id: "payment-order-test" };
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

test("an obsolete quote cannot create a new payable order while an old order remains created", async (t) => {
  process.env.RAZORPAY_KEY_ID = "test-key-id";
  process.env.RAZORPAY_KEY_SECRET = SECRET;
  fakeOrders = new Map([[
    "order_old_quote",
    { id: "order_old_quote", amount: 1234, currency: "USD", status: "created" },
  ]]);
  createOrderCalls = 0;
  const move = {
    ...makeMove(), pricingVersion: 3, acceptedPricingVersion: 3,
    pricingAcceptedAt: new Date(), pricingAcceptanceRequired: true,
  };
  stubOrderIntent(t);
  t.mock.method(Move, "findOne", async () => move);
  t.mock.method(Move, "findOneAndUpdate", async () => move);
  t.mock.method(Move, "updateOne", async () => ({ modifiedCount: 1 }));
  t.mock.method(PaymentOrder, "find", () => ({ sort: async () => [{
    user: move.user, move: move._id, razorpayOrderId: "order_old_quote", amount: 12.34,
    currency: "USD", pricingVersion: 2, status: "created",
  }] }));

  const result = makeResponse();
  await paymentController.createOrder({ body: { moveId: move._id }, user: { id: move.user } }, result);
  assert.equal(result.statusCode, 409);
  assert.equal(result.body.code, "OBSOLETE_PAYMENT_ORDER_EXISTS");
  assert.equal(createOrderCalls, 0);
});

test("concurrent payment-order requests are serialized by the database lock", async (t) => {
  process.env.RAZORPAY_KEY_ID = "test-key-id";
  process.env.RAZORPAY_KEY_SECRET = SECRET;
  fakeOrders = new Map();
  createOrderCalls = 0;
  const move = makeMove();
  let lockClaimed = false;
  stubOrderIntent(t);
  t.mock.method(Move, "findOne", async () => move);
  t.mock.method(Move, "findOneAndUpdate", async (filter) => {
    if (filter["paymentOrderLock.token"]) return move;
    if (lockClaimed) return null;
    lockClaimed = true;
    return move;
  });
  t.mock.method(Move, "exists", async () => true);
  t.mock.method(Move, "updateOne", async () => { lockClaimed = false; return { modifiedCount: 1 }; });
  t.mock.method(PaymentOrder, "find", () => ({ sort: async () => [] }));
  t.mock.method(PaymentOrder, "findOneAndUpdate", async (_filter, update) => ({ ...update.$setOnInsert, _id: "payment-order-test" }));

  const responses = [makeResponse(), makeResponse()];
  await Promise.all(responses.map((response) => paymentController.createOrder(
    { body: { moveId: move._id }, user: { id: move.user } },
    response,
  )));
  assert.deepEqual(responses.map((response) => response.statusCode).sort(), [201, 409]);
  assert.equal(createOrderCalls, 1);
});

test("durable order intent is saved before contacting Razorpay", async (t) => {
  process.env.RAZORPAY_KEY_ID = "test-key-id";
  process.env.RAZORPAY_KEY_SECRET = SECRET;
  fakeOrders = new Map(); createOrderCalls = 0; gatewayCreateError = null;
  const move = { ...makeMove(), pricingVersion: 4, pricingAcceptanceRequired: true, acceptedPricingVersion: 4, pricingAcceptedAt: new Date() };
  const intentState = stubOrderIntent(t);
  onGatewayOrderCreate = () => assert.ok(intentState.intent, "local intent must exist before remote order creation");
  t.after(() => { onGatewayOrderCreate = null; });
  t.mock.method(Move, "findOne", async () => move);
  t.mock.method(Move, "findOneAndUpdate", async () => move);
  t.mock.method(Move, "updateOne", async () => ({ modifiedCount: 1 }));
  t.mock.method(PaymentOrder, "find", () => ({ sort: async () => [] }));
  t.mock.method(PaymentOrder, "findOneAndUpdate", async (_filter, update) => ({ ...update.$setOnInsert, _id: "intent-payment-order" }));
  const result = makeResponse();
  await paymentController.createOrder({ body: { moveId: move._id }, user: { id: move.user } }, result);
  assert.equal(result.statusCode, 201);
  assert.equal(intentState.intent.status, "completed");
  assert.equal(intentState.intent.acceptedPricingVersion, 4);
  assert.equal(intentState.intent.amount, move.price);
  assert.equal(intentState.intent.currency, "USD");
});

test("gateway order saved in intent recovers when local PaymentOrder persistence initially fails", async (t) => {
  process.env.RAZORPAY_KEY_ID = "test-key-id";
  process.env.RAZORPAY_KEY_SECRET = SECRET;
  fakeOrders = new Map(); createOrderCalls = 0; gatewayCreateError = null; onGatewayOrderCreate = null;
  const move = makeMove();
  const intentState = stubOrderIntent(t);
  let orderWriteFails = true;
  t.mock.method(Move, "findOne", async () => move);
  t.mock.method(Move, "findOneAndUpdate", async () => move);
  t.mock.method(Move, "updateOne", async () => ({ modifiedCount: 1 }));
  t.mock.method(PaymentOrder, "find", () => ({ sort: async () => [] }));
  t.mock.method(PaymentOrder, "findOneAndUpdate", async (_filter, update) => {
    if (orderWriteFails) { orderWriteFails = false; throw new Error("simulated local persistence failure"); }
    return { ...update.$setOnInsert, _id: "intent-payment-order" };
  });
  const first = makeResponse();
  await paymentController.createOrder({ body: { moveId: move._id }, user: { id: move.user } }, first);
  assert.equal(first.statusCode, 502);
  assert.equal(intentState.intent.status, "gateway_created");
  assert.ok(intentState.intent.razorpayOrderId);
  const retry = makeResponse();
  await paymentController.createOrder({ body: { moveId: move._id }, user: { id: move.user } }, retry);
  assert.equal(retry.statusCode, 200);
  assert.equal(retry.body.order_id, intentState.intent.razorpayOrderId);
  assert.equal(createOrderCalls, 1);
});

test("uncertain remote order creation remains blocked and is never retried automatically", async (t) => {
  process.env.RAZORPAY_KEY_ID = "test-key-id";
  process.env.RAZORPAY_KEY_SECRET = SECRET;
  fakeOrders = new Map(); createOrderCalls = 0; onGatewayOrderCreate = null;
  gatewayCreateError = new Error("simulated timeout after remote create");
  const move = makeMove();
  const intentState = stubOrderIntent(t);
  t.mock.method(Move, "findOne", async () => move);
  t.mock.method(Move, "findOneAndUpdate", async () => move);
  t.mock.method(Move, "updateOne", async () => ({ modifiedCount: 1 }));
  t.mock.method(PaymentOrder, "find", () => ({ sort: async () => [] }));
  const first = makeResponse();
  await paymentController.createOrder({ body: { moveId: move._id }, user: { id: move.user } }, first);
  assert.equal(first.statusCode, 502);
  assert.equal(intentState.intent.status, "reconciliation_required");
  const retry = makeResponse();
  await paymentController.createOrder({ body: { moveId: move._id }, user: { id: move.user } }, retry);
  assert.equal(retry.statusCode, 409);
  assert.equal(createOrderCalls, 1);
  gatewayCreateError = null;
  t.after(() => { gatewayCreateError = null; });
});

test("a verified-absent failed intent is reused with a fresh receipt after admin review", async (t) => {
  process.env.RAZORPAY_KEY_ID = "test-key-id";
  process.env.RAZORPAY_KEY_SECRET = SECRET;
  fakeOrders = new Map(); createOrderCalls = 0; gatewayCreateError = null;
  const move = makeMove();
  let intent = {
    _id: new mongoose.Types.ObjectId(),
    user: move.user,
    move: move._id,
    pricingVersion: 0,
    acceptedPricingVersion: null,
    amount: move.price,
    currency: "USD",
    status: "failed",
    failureCode: "admin_verified_no_gateway_order",
    receipt: "sm_oldreceipt",
    razorpayOrderId: null,
    paymentOrder: null,
  };
  let initialReceipt;
  t.mock.method(PaymentOrderIntent, "findOne", (filter) => ({
    sort: async () => filter.status === "failed" ? intent : null,
  }));
  t.mock.method(PaymentOrderIntent, "findOneAndUpdate", async (_filter, update) => {
    initialReceipt = intent.receipt;
    Object.assign(intent, update.$set);
    return intent;
  });
  t.mock.method(PaymentOrderIntent, "updateOne", async (_filter, update) => {
    Object.assign(intent, update.$set || {});
    return { modifiedCount: 1 };
  });
  t.mock.method(Move, "findOne", async () => move);
  t.mock.method(Move, "findOneAndUpdate", async () => move);
  t.mock.method(Move, "updateOne", async () => ({ modifiedCount: 1 }));
  t.mock.method(PaymentOrder, "find", () => ({ sort: async () => [] }));
  t.mock.method(PaymentOrder, "findOneAndUpdate", async (_filter, update) => ({ ...update.$setOnInsert, _id: "reused-intent-order" }));

  const response = makeResponse();
  await paymentController.createOrder({ body: { moveId: move._id }, user: { id: move.user } }, response);
  assert.equal(response.statusCode, 201);
  assert.notEqual(intent.receipt, initialReceipt);
  assert.equal(intent.status, "completed");
  assert.equal(intent.failureCode, null);
  assert.equal(createOrderCalls, 1);
});

test("Razorpay orders are blocked for manual-review and unaccepted estimate moves", async (t) => {
  process.env.RAZORPAY_KEY_ID = "test-key-id";
  process.env.RAZORPAY_KEY_SECRET = SECRET;
  createOrderCalls = 0;
  let currentMove;
  t.mock.method(Move, "findOne", async () => currentMove);
  for (const state of [
    { pricingStatus: "manual_review", pricingAcceptanceRequired: true, pricingVersion: 0 },
    { pricingStatus: "pending_acceptance", pricingAcceptanceRequired: true, pricingVersion: 1, price: 100, pricing: { currency: "INR" } },
    { pricingStatus: "priced", pricingAcceptanceRequired: true, pricingVersion: 2, acceptedPricingVersion: 1, pricingAcceptedAt: new Date(), price: 100, pricing: { currency: "INR" } },
  ]) {
    const move = { ...makeMove(), ...state };
    currentMove = move;
    const result = makeResponse();
    await paymentController.createOrder({ body: { moveId: move._id }, user: { id: move.user } }, result);
    assert.equal(result.statusCode, 409);
  }
  assert.equal(createOrderCalls, 0);
});

test("Razorpay order amount and pricing version come from the accepted manual quote", async (t) => {
  process.env.RAZORPAY_KEY_ID = "test-key-id";
  process.env.RAZORPAY_KEY_SECRET = SECRET;
  fakeOrders = new Map();
  createOrderCalls = 0;
  const move = {
    ...makeMove(), price: 43.5, pricing: { currency: "INR", total: 43.5 },
    pricingAcceptanceRequired: true, pricingStatus: "priced", pricingVersion: 3,
    acceptedPricingVersion: 3, pricingAcceptedAt: new Date(),
  };
  let savedOrder;
  stubOrderIntent(t);
  t.mock.method(Move, "findOne", async () => move);
  t.mock.method(Move, "findOneAndUpdate", async () => move);
  t.mock.method(Move, "updateOne", async () => ({ modifiedCount: 1 }));
  t.mock.method(PaymentOrder, "find", () => ({ sort: async () => [] }));
  t.mock.method(PaymentOrder, "findOneAndUpdate", async (_filter, update) => { savedOrder = { ...update.$setOnInsert, _id: "payment-order-test" }; return savedOrder; });
  const result = makeResponse();
  await paymentController.createOrder({ body: { moveId: move._id }, user: { id: move.user } }, result);
  assert.equal(result.statusCode, 201);
  assert.equal(result.body.amount, 4350);
  assert.equal(result.body.currency, "INR");
  assert.equal(savedOrder.amount, 43.5);
  assert.equal(savedOrder.pricingVersion, 3);
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
  move.pricingVersion = 2;
  move.pricingAcceptanceRequired = true;
  move.pricingAcceptedAt = new Date();
  move.acceptedPricingVersion = 2;
  move.pricing.total = 12.34;
  const paymentOrder = {
    _id: new mongoose.Types.ObjectId(),
    user: move.user,
    move: move._id,
    amount: 12.34,
    currency: "USD",
    gateway: "razorpay",
    pricingVersion: 2,
    razorpayOrderId: orderId,
    status: "created",
  };
  let storedPayment = null;
  let localOrder = paymentOrder;
  stubPaymentProcessing(t);
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
