const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Move = require("../src/models/move.model");
const User = require("../src/models/User.model");
const PaymentOrder = require("../src/models/paymentOrder.model");
const PaymentOrderIntent = require("../src/models/paymentOrderIntent.model");
const PaymentReconciliation = require("../src/models/paymentReconciliation.model");
const { buildManualPricingSnapshot } = require("../src/services/manualPricing.service");
const adminPricingController = require("../src/controllers/adminPricing.controller");
const moveController = require("../src/controllers/move.controller");

const SECRET = "manual-pricing-test-secret-material-at-least-32-bytes";
const PRICING_KEYS = [
  "PRICING_CURRENCY", "PRICING_VEHICLES_JSON", "PRICING_PACKING_MATERIAL_RATES_JSON",
  "PRICING_PACKING_PER_WORKER", "PRICING_LOADING_PER_WORKER", "PRICING_UNLOADING_PER_WORKER",
  "PRICING_TAX_STATUS", "GEOAPIFY_API_KEY",
];
const routeEnv = {
  PRICING_CURRENCY: "INR",
  PRICING_VEHICLES_JSON: JSON.stringify({ tata_ace: { baseFare: 300, perKmRate: 18, minimumFare: 700 } }),
  PRICING_TAX_STATUS: "disabled",
  GEOAPIFY_API_KEY: "test-only-key",
};
const draft = {
  serviceMode: "full_service", currency: "INR", distanceKm: 20, routeProvider: "geoapify",
  pickupResolved: "Pickup", dropoffResolved: "Dropoff",
  vehicle: { type: "tata_ace", baseFare: 300, perKmRate: 18, minimumFare: 700 },
  inventory: { furniture: 2 }, workers: { packing: 1, loading: 1, unloading: 1 },
  taxStatus: "disabled", breakdown: { transport: 700 },
};
const estimateInput = () => ({
  materials: [{ description: "Glassware cartons", quantity: 2, unit: "carton", unitRate: 100 }],
  labor: {
    packing: { workers: 2, ratePerWorker: 800 },
    loading: { workers: 2, ratePerWorker: 600 },
    unloading: { workers: 1, ratePerWorker: 600 },
  },
  additionalCharges: [{ description: "Stair carry", amount: 50 }],
});
const response = () => ({
  statusCode: 200, body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});
const setEnv = (t, overrides) => {
  const saved = Object.fromEntries(PRICING_KEYS.map((key) => [key, process.env[key]]));
  for (const key of PRICING_KEYS) {
    if (overrides[key] === undefined) delete process.env[key];
    else process.env[key] = overrides[key];
  }
  t.after(() => Object.entries(saved).forEach(([key, value]) => value === undefined ? delete process.env[key] : process.env[key] = value));
};
const stubRouteFetch = (t) => t.mock.method(global, "fetch", async (url) => ({
  ok: true,
  json: async () => String(url).includes("/routing")
    ? { features: [{ properties: { distance: 20000 } }] }
    : { features: [{ geometry: { coordinates: [77.5, 12.9] }, properties: { formatted: "Resolved" } }] },
}));

test("manual estimate computes all material, labour and additional charges on the server", () => {
  const quote = buildManualPricingSnapshot(draft, estimateInput(), new Date("2026-11-14T00:00:00.000Z"));
  assert.equal(quote.breakdown.transport, 700);
  assert.equal(quote.breakdown.packingMaterials, 200);
  assert.equal(quote.breakdown.packingLabour, 1600);
  assert.equal(quote.breakdown.loading, 1200);
  assert.equal(quote.breakdown.unloading, 600);
  assert.equal(quote.breakdown.additionalCharges, 50);
  assert.equal(quote.breakdown.taxStatus, "disabled");
  assert.equal(quote.breakdown.tolls, 0);
  assert.equal(quote.total, 4350);
});

test("manual estimate validation rejects customer prices, invalid quantities, and tax/toll add-ons", () => {
  assert.throws(() => buildManualPricingSnapshot(draft, { ...estimateInput(), total: 1 }), { code: "INVALID_PACKING_ESTIMATE" });
  const badQuantity = estimateInput(); badQuantity.materials[0].quantity = -1;
  assert.throws(() => buildManualPricingSnapshot(draft, badQuantity), { code: "INVALID_PACKING_ESTIMATE" });
  const badCharge = estimateInput(); badCharge.additionalCharges[0].description = "GST";
  assert.throws(() => buildManualPricingSnapshot(draft, badCharge), { code: "INVALID_PACKING_ESTIMATE" });
});

test("full-service booking with missing material prices is saved for manual review without a payable price", async (t) => {
  setEnv(t, routeEnv); stubRouteFetch(t);
  t.mock.method(Move.prototype, "save", async function save() { return this; });
  const result = response();
  await moveController.createMove({
    body: {
      pickup: "A", dropoff: "B", moveDate: "2027-01-20", serviceMode: "full_service", vehicleType: "tata_ace",
      inventory: { furniture: 1 }, materials: {}, packingWorkers: 1, loadingWorkers: 1, unloadingWorkers: 1,
    },
    user: { id: new mongoose.Types.ObjectId().toString() },
  }, result);
  assert.equal(result.statusCode, 201);
  assert.equal(result.body.pricingStatus, "manual_review");
  assert.equal(result.body.pricingAcceptanceRequired, true);
  assert.equal(result.body.price, undefined);
  assert.equal(result.body.pricing, undefined);
  assert.equal(result.body.pricingDraft.breakdown.transport, 700);
});

test("admin estimate update saves versioned quote and admin audit trail", async (t) => {
  const moveId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();
  const move = {
    _id: moveId, serviceMode: "full_service", pricingStatus: "manual_review", pricingVersion: 0,
    pricingDraft: draft, paid: false,
  };
  const saved = { ...move };
  let updateFilter; let updateDoc; let intentFilter;
  t.mock.method(Move, "findById", async () => move);
  t.mock.method(PaymentOrder, "exists", async () => null);
  t.mock.method(PaymentOrderIntent, "exists", async (filter) => { intentFilter = filter; return null; });
  t.mock.method(PaymentReconciliation, "exists", async () => null);
  t.mock.method(Move, "updateOne", async () => ({ modifiedCount: 1 }));
  t.mock.method(Move, "findOneAndUpdate", async (filter, update) => {
    updateFilter = filter; updateDoc = update;
    return { ...saved, ...update.$set, ...(update.$push ? { pricingAudit: update.$push.pricingAudit } : {}) };
  });
  const result = response();
  await adminPricingController.submitPackingEstimate({
    params: { id: String(moveId) }, body: estimateInput(), user: { id: String(adminId) },
  }, result);
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.pricingStatus, "pending_acceptance");
  assert.equal(result.body.pricingVersion, 1);
  assert.equal(result.body.price, 4350);
  assert.equal(updateFilter.pricingVersion, 0);
  assert.equal(updateDoc.$push.pricingAudit.admin, String(adminId));
  assert.equal(updateDoc.$push.pricingAudit.previousEstimate, null);
  assert.equal(updateDoc.$push.pricingAudit.updatedEstimate.total, 4350);
  assert.deepEqual(intentFilter.status.$in, ["initiated", "gateway_created", "completed", "reconciliation_required"]);
});

test("estimate revision is blocked while any Razorpay order may still receive payment", async (t) => {
  const moveId = new mongoose.Types.ObjectId();
  const move = {
    _id: moveId, serviceMode: "full_service", pricingStatus: "pending_acceptance", pricingVersion: 1,
    pricingDraft: draft, pricing: { total: 4350, currency: "INR" }, paid: false,
  };
  let writes = 0;
  t.mock.method(Move, "findById", async () => move);
  t.mock.method(Move, "findOneAndUpdate", async () => { writes += 1; return move; });
  t.mock.method(Move, "updateOne", async () => ({ modifiedCount: 1 }));
  t.mock.method(PaymentOrder, "exists", async () => ({ _id: "existing-order" }));
  const result = response();
  await adminPricingController.submitPackingEstimate({
    params: { id: String(moveId) }, body: estimateInput(), user: { id: "admin-1" },
  }, result);
  assert.equal(result.statusCode, 409);
  assert.equal(result.body.code, "PAYMENT_ORDER_MAY_STILL_BE_PAYABLE");
  assert.equal(writes, 1, "only the shared lock claim may write; quote and audit stay unchanged");
});

test("estimate revision is blocked after successful payment or while reconciliation is pending", async (t) => {
  const moveId = new mongoose.Types.ObjectId();
  const move = {
    _id: moveId, serviceMode: "full_service", pricingStatus: "pending_acceptance", pricingVersion: 1,
    pricingDraft: draft, pricing: { total: 4350, currency: "INR" }, paid: false,
  };
  t.mock.method(Move, "findById", async () => move);
  t.mock.method(Move, "findOneAndUpdate", async () => move);
  t.mock.method(Move, "updateOne", async () => ({ modifiedCount: 1 }));
  t.mock.method(PaymentOrder, "exists", async () => null);
  t.mock.method(PaymentOrderIntent, "exists", async () => null);
  t.mock.method(PaymentReconciliation, "exists", async () => ({ _id: "reconciliation" }));
  const result = response();
  await adminPricingController.submitPackingEstimate({
    params: { id: String(moveId) }, body: estimateInput(), user: { id: "admin-1" },
  }, result);
  assert.equal(result.statusCode, 409);
  assert.equal(result.body.code, "PAYMENT_RECONCILIATION_PENDING");
});

test("a successfully paid move cannot have its estimate revised", async (t) => {
  const moveId = new mongoose.Types.ObjectId();
  t.mock.method(Move, "findById", async () => ({
    _id: moveId, serviceMode: "full_service", pricingStatus: "priced", pricingVersion: 1,
    pricingDraft: draft, price: 4350, paid: true,
  }));
  let writes = 0;
  t.mock.method(Move, "findOneAndUpdate", async () => { writes += 1; });
  const result = response();
  await adminPricingController.submitPackingEstimate({
    params: { id: String(moveId) }, body: estimateInput(), user: { id: "admin-1" },
  }, result);
  assert.equal(result.statusCode, 409);
  assert.equal(writes, 0);
});

test("estimate revision audits both snapshots and invalidates prior acceptance", async (t) => {
  const moveId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();
  const previousEstimate = { ...buildManualPricingSnapshot(draft, estimateInput()), total: 4350 };
  const move = {
    _id: moveId, serviceMode: "full_service", pricingStatus: "pending_acceptance", pricingVersion: 1,
    pricingDraft: draft, pricing: previousEstimate, paid: false,
    pricingAcceptedAt: null, acceptedPricingVersion: null,
  };
  let savedUpdate;
  t.mock.method(Move, "findById", async () => move);
  t.mock.method(PaymentOrder, "exists", async () => null);
  t.mock.method(PaymentOrderIntent, "exists", async () => null);
  t.mock.method(PaymentReconciliation, "exists", async () => null);
  t.mock.method(Move, "updateOne", async () => ({ modifiedCount: 1 }));
  t.mock.method(Move, "findOneAndUpdate", async (_filter, update) => { savedUpdate = update; return { ...move, ...update.$set }; });
  const result = response();
  const revised = estimateInput(); revised.additionalCharges = [];
  await adminPricingController.submitPackingEstimate({ params: { id: String(moveId) }, body: revised, user: { id: String(adminId) } }, result);
  assert.equal(result.statusCode, 200);
  assert.equal(savedUpdate.$set.pricingVersion, 2);
  assert.equal(savedUpdate.$set.pricingStatus, "pending_acceptance");
  assert.equal(savedUpdate.$set.pricingAcceptedAt, null);
  assert.equal(savedUpdate.$set.acceptedPricingVersion, null);
  assert.equal(savedUpdate.$push.pricingAudit.previousEstimate.total, 4350);
  assert.equal(savedUpdate.$push.pricingAudit.updatedEstimate.total, 4300);
  assert.equal(savedUpdate.$push.pricingAudit.admin, String(adminId));
});

test("invalid estimate does not write and estimate routes are admin-only", async (t) => {
  const moveId = new mongoose.Types.ObjectId();
  t.mock.method(Move, "findById", async () => ({
    _id: moveId, serviceMode: "full_service", pricingStatus: "manual_review", pricingVersion: 0, pricingDraft: draft,
  }));
  t.mock.method(PaymentOrder, "exists", async () => null);
  t.mock.method(PaymentReconciliation, "exists", async () => null);
  let writes = 0;
  t.mock.method(Move, "findOneAndUpdate", async () => { writes += 1; });
  const invalid = response();
  await adminPricingController.submitPackingEstimate({ params: { id: String(moveId) }, body: { ...estimateInput(), total: 100 }, user: { id: "admin-1" } }, invalid);
  assert.equal(invalid.statusCode, 400);
  assert.equal(writes, 0);

  const router = require("../src/routes/admin.routes");
  const routes = router.stack.filter((layer) => layer.route && ["/moves/manual-estimates", "/moves/:id/packing-estimate"].includes(layer.route.path));
  assert.equal(routes.length, 2);
  for (const layer of routes) {
    assert.equal(layer.route.stack[0].name, "protect");
    assert.equal(layer.route.stack[1].name, "<anonymous>");
    const denied = response();
    let nextCalled = false;
    layer.route.stack[1].handle({ user: { role: "user" } }, denied, () => { nextCalled = true; });
    assert.equal(denied.statusCode, 403);
    assert.equal(nextCalled, false);
    t.mock.method(User, "findById", () => ({ select: async () => ({ _id: "admin-1", role: "admin", isActive: true }) }));
    const allowed = response();
    await layer.route.stack[1].handle({ user: { id: "admin-1", role: "admin" } }, allowed, () => { nextCalled = true; });
    assert.equal(nextCalled, true);
    t.mock.restoreAll();
  }
});

test("customer acceptance is scoped to owner and exact pending estimate version", async (t) => {
  const { acceptMovePricing } = moveController;
  const moveId = new mongoose.Types.ObjectId();
  const customerId = new mongoose.Types.ObjectId();
  const current = {
    _id: moveId, user: customerId, serviceMode: "full_service", pricingStatus: "pending_acceptance",
    pricingAcceptanceRequired: true, pricingVersion: 2, price: 4350, pricing: { total: 4350 }, paid: false,
  };
  let filter; let update;
  t.mock.method(Move, "findOne", async () => current);
  t.mock.method(Move, "findOneAndUpdate", async (query, change) => { filter = query; update = change; return { ...current, ...change.$set }; });
  const result = response();
  await acceptMovePricing({ params: { id: String(moveId) }, user: { id: String(customerId) } }, result);
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.pricingStatus, "priced");
  assert.equal(filter.user, String(customerId));
  assert.equal(filter.pricingVersion, 2);
  assert.equal(update.$set.acceptedPricingVersion, 2);
});

test("customer pricing acceptance route requires authentication and the user role", () => {
  const router = require("../src/routes/move.routes");
  const route = router.stack.find((layer) => layer.route?.path === "/:id/accept-pricing")?.route;
  assert.ok(route);
  assert.equal(route.stack[0].name, "protect");
  const denied = response();
  let called = false;
  route.stack[1].handle({ user: { role: "admin" } }, denied, () => { called = true; });
  assert.equal(denied.statusCode, 403);
  assert.equal(called, false);
  route.stack[1].handle({ user: { role: "user" } }, response(), () => { called = true; });
  assert.equal(called, true);
});

test("manual estimate quote response gives no final total", async (t) => {
  setEnv(t, routeEnv); stubRouteFetch(t);
  const { createQuote } = require("../src/controllers/pricing.controller");
  const result = response();
  await createQuote({ body: {
    pickup: "A", dropoff: "B", serviceMode: "full_service", vehicleType: "tata_ace",
    inventory: { furniture: 1 }, materials: {}, packingWorkers: 1, loadingWorkers: 1, unloadingWorkers: 1,
  } }, result);
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.manualEstimateRequired, true);
  assert.equal(result.body.pricingStatus, "manual_review");
  assert.equal(result.body.total, undefined);
});
