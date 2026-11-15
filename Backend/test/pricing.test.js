const test = require("node:test");
const assert = require("node:assert/strict");
const Move = require("../src/models/move.model");
const { getBookingPriceQuote, normalizeBookingInput } = require("../src/services/pricing.service");
const { createMove } = require("../src/controllers/move.controller");

const vehicleRates = {
  three_wheeler_eeco: { baseFare: 250, perKmRate: 14, minimumFare: 500 },
  tata_ace: { baseFare: 300, perKmRate: 18, minimumFare: 700 },
  pickup_bolero: { baseFare: 800, perKmRate: 25, minimumFare: 1200 },
  tata_407_14ft: { baseFare: 1500, perKmRate: 32, minimumFare: 2000 },
  truck_17ft: { baseFare: 3300, perKmRate: 42, minimumFare: 4000 },
  truck_20_32ft: { baseFare: 5000, perKmRate: 65, minimumFare: 6000 },
};
const materialRates = { cartons: 10, bubbleWrap: 5, stretchFilm: 7, protectiveCovers: 20, tape: 3, other: 1 };
const CONFIG_KEYS = [
  "PRICING_CURRENCY", "PRICING_VEHICLES_JSON", "PRICING_PACKING_MATERIAL_RATES_JSON",
  "PRICING_PACKING_PER_WORKER", "PRICING_LOADING_PER_WORKER", "PRICING_UNLOADING_PER_WORKER",
  "PRICING_TAX_STATUS", "PRICING_TAX_RATE", "GEOAPIFY_API_KEY",
];

const configure = (overrides = {}) => {
  const values = {
    PRICING_CURRENCY: "INR",
    PRICING_VEHICLES_JSON: JSON.stringify(vehicleRates),
    PRICING_PACKING_MATERIAL_RATES_JSON: JSON.stringify(materialRates),
    PRICING_PACKING_PER_WORKER: "800",
    PRICING_LOADING_PER_WORKER: "600",
    PRICING_UNLOADING_PER_WORKER: "600",
    PRICING_TAX_STATUS: "disabled",
    GEOAPIFY_API_KEY: "test-key",
    ...overrides,
  };
  for (const key of CONFIG_KEYS) {
    if (values[key] === undefined) delete process.env[key];
    else process.env[key] = values[key];
  }
};
const installFetch = (t, distanceMeters = 20000) => {
  t.mock.method(global, "fetch", async (url) => ({
    ok: true,
    json: async () => String(url).includes("/routing")
      ? { features: [{ properties: { distance: distanceMeters } }] }
      : { features: [{ geometry: { coordinates: [77.5, 12.9] }, properties: { formatted: "Resolved location" } }] },
  }));
};
const transportInput = (vehicleType = "tata_ace") => ({
  pickup: "Origin", dropoff: "Destination", serviceMode: "transport_only", vehicleType,
});
const fullServiceInput = () => ({
  ...transportInput(), serviceMode: "full_service",
  inventory: { furniture: 2, appliances: 1 },
  materials: { cartons: 2, bubbleWrap: 1 },
  packingWorkers: 2, loadingWorkers: 2, unloadingWorkers: 1,
});
const response = () => ({ statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

test("transport-only quote applies vehicle fare and per-km formula without labour or packing", async (t) => {
  const saved = Object.fromEntries(CONFIG_KEYS.map((key) => [key, process.env[key]]));
  t.after(() => Object.entries(saved).forEach(([key, value]) => value === undefined ? delete process.env[key] : process.env[key] = value));
  configure(); installFetch(t);
  const quote = await getBookingPriceQuote(transportInput());
  assert.equal(quote.distanceKm, 20);
  assert.equal(quote.breakdown.transport, 700);
  assert.equal(quote.breakdown.packingMaterials, 0);
  assert.equal(quote.breakdown.loading, 0);
  assert.equal(quote.breakdown.unloading, 0);
  assert.equal(quote.breakdown.tolls, 0);
  assert.equal(quote.breakdown.tollStatus, "excluded_actual_amount_not_available");
  assert.equal(quote.breakdown.taxStatus, "disabled");
  assert.equal(quote.total, 700);
});

test("transport-only quote needs no packing materials or labour rates", async (t) => {
  const saved = Object.fromEntries(CONFIG_KEYS.map((key) => [key, process.env[key]]));
  t.after(() => Object.entries(saved).forEach(([key, value]) => value === undefined ? delete process.env[key] : process.env[key] = value));
  configure({
    PRICING_PACKING_MATERIAL_RATES_JSON: "",
    PRICING_PACKING_PER_WORKER: "",
    PRICING_LOADING_PER_WORKER: "",
    PRICING_UNLOADING_PER_WORKER: "",
  });
  installFetch(t, 10000);
  const quote = await getBookingPriceQuote(transportInput());
  assert.equal(quote.breakdown.transport, Math.max(700, 300 + 10 * 18));
  assert.equal(quote.total, quote.breakdown.transport);
  assert.equal(quote.breakdown.packingMaterials, 0);
  assert.equal(quote.breakdown.packingLabour, 0);
  assert.equal(quote.breakdown.loading, 0);
  assert.equal(quote.breakdown.unloading, 0);
});

test("tax is applied only when explicitly enabled and configured", async (t) => {
  const saved = Object.fromEntries(CONFIG_KEYS.map((key) => [key, process.env[key]]));
  t.after(() => Object.entries(saved).forEach(([key, value]) => value === undefined ? delete process.env[key] : process.env[key] = value));
  configure({ PRICING_TAX_STATUS: "enabled", PRICING_TAX_RATE: "5" }); installFetch(t);
  const quote = await getBookingPriceQuote(transportInput());
  assert.equal(quote.breakdown.tax, 35);
  assert.equal(quote.breakdown.taxStatus, "enabled");
  assert.equal(quote.breakdown.taxIncluded, true);
  assert.equal(quote.total, 735);
});

test("invalid negative road distance from the routing provider returns no quote", async (t) => {
  const saved = Object.fromEntries(CONFIG_KEYS.map((key) => [key, process.env[key]]));
  t.after(() => Object.entries(saved).forEach(([key, value]) => value === undefined ? delete process.env[key] : process.env[key] = value));
  configure(); installFetch(t, -1);
  await assert.rejects(getBookingPriceQuote(transportInput()), (error) => error.code === "ROUTE_NOT_FOUND" && error.statusCode === 422);
});

test("all vehicle transport rates come from backend configuration", async (t) => {
  const saved = Object.fromEntries(CONFIG_KEYS.map((key) => [key, process.env[key]]));
  t.after(() => Object.entries(saved).forEach(([key, value]) => value === undefined ? delete process.env[key] : process.env[key] = value));
  configure(); installFetch(t);
  for (const [type, rate] of Object.entries(vehicleRates)) {
    const quote = await getBookingPriceQuote(transportInput(type));
    assert.equal(quote.vehicle.baseFare, rate.baseFare);
    assert.equal(quote.vehicle.perKmRate, rate.perKmRate);
    assert.equal(quote.vehicle.minimumFare, rate.minimumFare);
    assert.equal(quote.breakdown.transport, Math.max(rate.minimumFare, rate.baseFare + 20 * rate.perKmRate));
  }
});

test("vehicle minimum fare applies only to transport before full-service add-ons", async (t) => {
  const saved = Object.fromEntries(CONFIG_KEYS.map((key) => [key, process.env[key]]));
  t.after(() => Object.entries(saved).forEach(([key, value]) => value === undefined ? delete process.env[key] : process.env[key] = value));
  configure({ PRICING_PACKING_MATERIAL_RATES_JSON: JSON.stringify(materialRates) }); installFetch(t, 2000);
  const quote = await getBookingPriceQuote(fullServiceInput());
  assert.equal(quote.breakdown.transport, 700);
  assert.equal(quote.breakdown.packingMaterials, 25);
  assert.equal(quote.breakdown.packingLabour, 1600);
  assert.equal(quote.breakdown.loading, 1200);
  assert.equal(quote.breakdown.unloading, 600);
  assert.equal(quote.total, 4125);
});

test("full-service quote requires separate configured material and labour rates", async (t) => {
  const saved = Object.fromEntries(CONFIG_KEYS.map((key) => [key, process.env[key]]));
  t.after(() => Object.entries(saved).forEach(([key, value]) => value === undefined ? delete process.env[key] : process.env[key] = value));
  configure({ PRICING_PACKING_MATERIAL_RATES_JSON: "", PRICING_PACKING_PER_WORKER: "" }); installFetch(t);
  await assert.rejects(getBookingPriceQuote(fullServiceInput()), (error) => error.statusCode === 503 && error.details.missing.includes("PRICING_PACKING_MATERIAL_RATES_JSON"));
});

test("full-service quote becomes manual review when materials or labour rates are unavailable", async (t) => {
  const saved = Object.fromEntries(CONFIG_KEYS.map((key) => [key, process.env[key]]));
  t.after(() => Object.entries(saved).forEach(([key, value]) => value === undefined ? delete process.env[key] : process.env[key] = value));
  configure({ PRICING_PACKING_MATERIAL_RATES_JSON: "", PRICING_PACKING_PER_WORKER: "" });
  installFetch(t);
  const { createQuote } = require("../src/controllers/pricing.controller");
  const res = response();
  await createQuote({ body: fullServiceInput() }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.manualEstimateRequired, true);
  assert.equal(res.body.pricingStatus, "manual_review");
  assert.equal(res.body.serviceMode, "full_service");
  assert.equal(res.body.pricingDraft.breakdown.transport, 700);
  assert.equal(res.body.pricingDraft.breakdown.packingMaterials, null);
});

test("quote endpoint returns the missing vehicle configuration in its error details", async (t) => {
  const saved = Object.fromEntries(CONFIG_KEYS.map((key) => [key, process.env[key]]));
  t.after(() => Object.entries(saved).forEach(([key, value]) => value === undefined ? delete process.env[key] : process.env[key] = value));
  configure({ PRICING_VEHICLES_JSON: "" });
  const { createQuote } = require("../src/controllers/pricing.controller");
  const res = response();
  await createQuote({ body: transportInput() }, res);
  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.body, {
    pricingAvailable: false,
    code: "PRICING_NOT_CONFIGURED",
    message: "Pricing is incomplete. No final quote was generated.",
    details: { missing: ["PRICING_VEHICLES_JSON"] },
  });
});

test("full-service with inventory requires declared packing quantities", async (t) => {
  const saved = Object.fromEntries(CONFIG_KEYS.map((key) => [key, process.env[key]]));
  t.after(() => Object.entries(saved).forEach(([key, value]) => value === undefined ? delete process.env[key] : process.env[key] = value));
  configure(); installFetch(t);
  const input = fullServiceInput(); input.materials = {};
  await assert.rejects(getBookingPriceQuote(input), (error) => error.code === "MANUAL_ESTIMATE_REQUIRED" && error.statusCode === 422);
});

test("validation rejects bad modes, vehicles, distance, client prices, inventory, and workers", () => {
  assert.throws(() => normalizeBookingInput({ ...transportInput(), serviceMode: "bad" }), { code: "INVALID_SERVICE_MODE" });
  assert.throws(() => normalizeBookingInput({ ...transportInput(), vehicleType: "van" }), { code: "INVALID_VEHICLE" });
  assert.throws(() => normalizeBookingInput({ ...transportInput(), distanceKm: -5 }), { code: "CLIENT_PRICING_NOT_ALLOWED" });
  assert.throws(() => normalizeBookingInput({ ...transportInput(), price: 1 }), { code: "CLIENT_PRICING_NOT_ALLOWED" });
  assert.throws(() => normalizeBookingInput({ ...transportInput(), labor: { packing: 1 } }), { code: "CLIENT_PRICING_NOT_ALLOWED" });
  assert.throws(() => normalizeBookingInput({ ...transportInput(), additionalCharges: [{ amount: 1 }] }), { code: "CLIENT_PRICING_NOT_ALLOWED" });
  assert.throws(() => normalizeBookingInput({ ...fullServiceInput(), inventory: { furniture: -1 } }), { code: "INVALID_BOOKING_DETAILS" });
  assert.throws(() => normalizeBookingInput({ ...fullServiceInput(), loadingWorkers: 0 }), { code: "INVALID_WORKER_COUNT" });
});

test("missing vehicle minimum blocks transport quote instead of treating base fare as the minimum", async (t) => {
  const saved = Object.fromEntries(CONFIG_KEYS.map((key) => [key, process.env[key]]));
  t.after(() => Object.entries(saved).forEach(([key, value]) => value === undefined ? delete process.env[key] : process.env[key] = value));
  const missingMinimum = { ...vehicleRates, tata_ace: { ...vehicleRates.tata_ace, minimumFare: null } };
  configure({ PRICING_VEHICLES_JSON: JSON.stringify(missingMinimum) }); installFetch(t);
  await assert.rejects(getBookingPriceQuote(transportInput()), (error) => error.code === "PRICING_NOT_CONFIGURED" && error.details.missing.includes("tata_ace.minimumFare"));
});

test("transport-only requires each configured vehicle fare and identifies any missing rate", async (t) => {
  const saved = Object.fromEntries(CONFIG_KEYS.map((key) => [key, process.env[key]]));
  t.after(() => Object.entries(saved).forEach(([key, value]) => value === undefined ? delete process.env[key] : process.env[key] = value));
  for (const field of ["baseFare", "perKmRate", "minimumFare"]) {
    const vehicles = { ...vehicleRates, tata_ace: { ...vehicleRates.tata_ace, [field]: null } };
    configure({ PRICING_VEHICLES_JSON: JSON.stringify(vehicles) });
    await assert.rejects(
      getBookingPriceQuote(transportInput()),
      (error) => error.code === "PRICING_NOT_CONFIGURED" && error.details.missing.includes(`tata_ace.${field}`),
    );
  }
});

test("booking saves the server quote and service details as a move snapshot", async (t) => {
  const saved = Object.fromEntries(CONFIG_KEYS.map((key) => [key, process.env[key]]));
  t.after(() => Object.entries(saved).forEach(([key, value]) => value === undefined ? delete process.env[key] : process.env[key] = value));
  configure(); installFetch(t);
  t.mock.method(Move.prototype, "save", async function save() { return this; });
  const res = response();
  await createMove({ body: { ...transportInput(), moveDate: "2027-01-20" }, user: { id: "user-1" } }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.serviceMode, "transport_only");
  assert.equal(res.body.vehicleType, "tata_ace");
  assert.equal(res.body.price, 700);
  assert.equal(res.body.pricing.breakdown.transport, 700);
  assert.equal(res.body.pricing.vehicle.minimumFare, 700);
});
