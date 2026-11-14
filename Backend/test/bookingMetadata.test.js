const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Move = require("../src/models/move.model");
const { createMove } = require("../src/controllers/move.controller");
const { getBookingPriceQuote } = require("../src/services/pricing.service");
const {
  normalizeBookingMetadata,
  normalizeMoveDate,
} = require("../src/services/bookingMetadata.service");

const validHome = {
  moveType: "home_move",
  propertyType: "apartment_flat",
  approximateSize: { value: 2, unit: "bhk" },
};
const validOffice = {
  moveType: "office_move",
  propertyType: "office",
  approximateSize: { value: 1200, unit: "sq_ft" },
};
const response = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});
const transportInput = () => ({
  pickup: "Origin",
  dropoff: "Destination",
  serviceMode: "transport_only",
  vehicleType: "tata_ace",
});

test("booking metadata accepts the approved home and office contracts", () => {
  assert.deepEqual(normalizeBookingMetadata(validHome), validHome);
  assert.deepEqual(normalizeBookingMetadata(validOffice), validOffice);
  assert.equal(normalizeBookingMetadata({}), null); // legacy API client
});

test("booking metadata rejects invalid, incomplete, incompatible, or unexpected values", () => {
  const invalidInputs = [
    [{ ...validHome, moveType: "relocation" }],
    [{ ...validHome, propertyType: "office" }],
    [{ ...validOffice, propertyType: "house" }],
    [{ moveType: "home_move", propertyType: "house" }],
    [{ ...validHome, approximateSize: undefined }],
    [{ ...validHome, approximateSize: { value: 2, unit: "sq_ft" } }],
    [{ ...validHome, approximateSize: { value: 0, unit: "bhk" } }],
    [{ ...validHome, approximateSize: { value: -1, unit: "bhk" } }],
    [{ ...validHome, approximateSize: { value: 1.5, unit: "bhk" } }],
    [{ ...validHome, approximateSize: { value: "2", unit: "bhk" } }],
    [{ ...validOffice, approximateSize: { value: Number.POSITIVE_INFINITY, unit: "sq_ft" } }],
    [{ ...validOffice, approximateSize: { value: 0, unit: "sq_ft" } }],
    [{ ...validOffice, approximateSize: { value: 1200, unit: "square_feet" } }],
    [{ ...validHome, approximateSize: { value: 2, unit: "bhk", note: "extra" } }],
  ];
  for (const [input] of invalidInputs) {
    assert.throws(() => normalizeBookingMetadata(input), { code: "INVALID_BOOKING_METADATA" });
  }
});

test("Asia/Kolkata move-date validation compares the date-only calendar day", () => {
  const now = new Date("2026-11-14T00:30:00.000Z");
  assert.throws(() => normalizeMoveDate("2026-11-13", now), { code: "MOVE_DATE_IN_PAST" });
  assert.equal(normalizeMoveDate("2026-11-14", now).toISOString(), "2026-11-14T00:00:00.000Z");
  assert.equal(normalizeMoveDate("2026-11-15", now).toISOString(), "2026-11-15T00:00:00.000Z");
  assert.throws(() => normalizeMoveDate("2026-02-30", now), { code: "INVALID_MOVE_DATE" });
  assert.throws(() => normalizeMoveDate("not-a-date", now), { code: "INVALID_MOVE_DATE" });
  assert.throws(() => normalizeMoveDate(undefined, now), { code: "INVALID_MOVE_DATE" });
});

test("a legacy Move without booking metadata remains valid; partial metadata does not", async () => {
  const legacyMove = new Move({
    user: new mongoose.Types.ObjectId(),
    serviceMode: "transport_only",
    vehicleType: "tata_ace",
    moveDate: new Date("2027-01-20T00:00:00.000Z"),
  });
  await assert.doesNotReject(legacyMove.validate());
  legacyMove.moveType = "home_move";
  await assert.rejects(legacyMove.validate());
  const validMove = new Move({
    user: new mongoose.Types.ObjectId(),
    serviceMode: "transport_only",
    vehicleType: "tata_ace",
    moveDate: new Date("2027-01-20T00:00:00.000Z"),
    ...validHome,
  });
  await assert.doesNotReject(validMove.validate());
});

test("booking creation persists metadata and returns it without trusting client ownership", async (t) => {
  const configKeys = [
    "PRICING_CURRENCY", "PRICING_VEHICLES_JSON", "PRICING_PACKING_MATERIAL_RATES_JSON",
    "PRICING_PACKING_PER_WORKER", "PRICING_LOADING_PER_WORKER", "PRICING_UNLOADING_PER_WORKER",
    "PRICING_TAX_STATUS", "GEOAPIFY_API_KEY",
  ];
  const previous = Object.fromEntries(configKeys.map((key) => [key, process.env[key]]));
  t.after(() => configKeys.forEach((key) => previous[key] === undefined
    ? delete process.env[key]
    : process.env[key] = previous[key]));
  process.env.PRICING_CURRENCY = "INR";
  process.env.PRICING_VEHICLES_JSON = JSON.stringify({ tata_ace: { baseFare: 300, perKmRate: 18, minimumFare: 700 } });
  process.env.PRICING_PACKING_MATERIAL_RATES_JSON = JSON.stringify({ cartons: 10 });
  process.env.PRICING_PACKING_PER_WORKER = "800";
  process.env.PRICING_LOADING_PER_WORKER = "600";
  process.env.PRICING_UNLOADING_PER_WORKER = "600";
  process.env.PRICING_TAX_STATUS = "disabled";
  process.env.GEOAPIFY_API_KEY = "test-key";
  t.mock.method(global, "fetch", async (url) => ({
    ok: true,
    json: async () => String(url).includes("/routing")
      ? { features: [{ properties: { distance: 20000 } }] }
      : { features: [{ geometry: { coordinates: [77.5, 12.9] }, properties: { formatted: "Resolved location" } }] },
  }));
  t.mock.method(Move.prototype, "save", async function save() { return this; });

  const ownerId = new mongoose.Types.ObjectId();
  const res = response();
  await createMove({
    body: {
      ...transportInput(), ...validHome, moveDate: "2099-01-20",
      user: new mongoose.Types.ObjectId().toString(), role: "admin",
      trackingEvents: [{ event: "delivery_completed", at: new Date("2000-01-01T00:00:00Z") }],
      paid: true,
    },
    user: { id: ownerId.toString(), role: "user" },
  }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(String(res.body.user), ownerId.toString());
  assert.equal(res.body.moveType, validHome.moveType);
  assert.equal(res.body.propertyType, validHome.propertyType);
  assert.deepEqual(res.body.approximateSize.toObject(), validHome.approximateSize);
  assert.equal(res.body.trackingEvents.length, 1);
  assert.equal(res.body.trackingEvents[0].event, "booking_requested");
  assert.ok(res.body.trackingEvents[0].at instanceof Date);
  assert.ok(res.body.trackingEvents[0].at.getTime() > new Date("2000-01-01T00:00:00Z").getTime());
  assert.equal(String(res.body.trackingEvents[0].actor), ownerId.toString());
  assert.equal(res.body.trackingEvents[0].actorRole, "user");
  assert.equal(res.body.paid, false, "client-supplied payment state is ignored");
});

test("booking creation rejects malformed metadata and past or missing dates", async () => {
  const invalidRequests = [
    { body: { ...transportInput(), ...validHome, moveDate: "2099-01-20", approximateSize: { value: 2, unit: "sq_ft" } }, user: { id: "user-1" } },
    { body: { ...transportInput(), ...validHome, moveDate: "2000-01-01" }, user: { id: "user-1" } },
    { body: { ...transportInput(), ...validHome }, user: { id: "user-1" } },
  ];
  for (const req of invalidRequests) {
    const res = response();
    await createMove(req, res);
    assert.equal(res.statusCode, 400);
  }
});

test("metadata does not change server quote results", async (t) => {
  const configKeys = [
    "PRICING_CURRENCY", "PRICING_VEHICLES_JSON", "PRICING_PACKING_MATERIAL_RATES_JSON",
    "PRICING_PACKING_PER_WORKER", "PRICING_LOADING_PER_WORKER", "PRICING_UNLOADING_PER_WORKER",
    "PRICING_TAX_STATUS", "GEOAPIFY_API_KEY",
  ];
  const previous = Object.fromEntries(configKeys.map((key) => [key, process.env[key]]));
  t.after(() => configKeys.forEach((key) => previous[key] === undefined
    ? delete process.env[key]
    : process.env[key] = previous[key]));
  process.env.PRICING_CURRENCY = "INR";
  process.env.PRICING_VEHICLES_JSON = JSON.stringify({ tata_ace: { baseFare: 300, perKmRate: 18, minimumFare: 700 } });
  process.env.PRICING_PACKING_MATERIAL_RATES_JSON = JSON.stringify({ cartons: 10 });
  process.env.PRICING_PACKING_PER_WORKER = "800";
  process.env.PRICING_LOADING_PER_WORKER = "600";
  process.env.PRICING_UNLOADING_PER_WORKER = "600";
  process.env.PRICING_TAX_STATUS = "disabled";
  process.env.GEOAPIFY_API_KEY = "test-key";
  t.mock.method(global, "fetch", async (url) => ({
    ok: true,
    json: async () => String(url).includes("/routing")
      ? { features: [{ properties: { distance: 20000 } }] }
      : { features: [{ geometry: { coordinates: [77.5, 12.9] }, properties: { formatted: "Resolved location" } }] },
  }));

  const transportQuote = await getBookingPriceQuote(transportInput());
  const transportQuoteWithMetadata = await getBookingPriceQuote({ ...transportInput(), ...validHome });
  assert.deepEqual(transportQuoteWithMetadata, transportQuote);

  const fullServiceInput = {
    ...transportInput(),
    serviceMode: "full_service",
    inventory: { furniture: 1 },
    materials: { cartons: 2 },
    packingWorkers: 1,
    loadingWorkers: 1,
    unloadingWorkers: 1,
  };
  const fullServiceQuote = await getBookingPriceQuote(fullServiceInput);
  const fullServiceQuoteWithMetadata = await getBookingPriceQuote({ ...fullServiceInput, ...validOffice });
  assert.deepEqual(fullServiceQuoteWithMetadata, fullServiceQuote);
  assert.equal(fullServiceQuoteWithMetadata.distanceKm, fullServiceQuote.distanceKm);
  assert.deepEqual(fullServiceQuoteWithMetadata.vehicle, fullServiceQuote.vehicle);
  assert.equal(fullServiceQuoteWithMetadata.breakdown.packingMaterials, fullServiceQuote.breakdown.packingMaterials);
  assert.equal(fullServiceQuoteWithMetadata.breakdown.packingLabour, fullServiceQuote.breakdown.packingLabour);
  assert.equal(fullServiceQuoteWithMetadata.breakdown.loading, fullServiceQuote.breakdown.loading);
  assert.equal(fullServiceQuoteWithMetadata.breakdown.unloading, fullServiceQuote.breakdown.unloading);
  assert.equal(fullServiceQuoteWithMetadata.total, fullServiceQuote.total);
});
