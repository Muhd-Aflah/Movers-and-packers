const VEHICLE_TYPES = ["three_wheeler_eeco", "tata_ace", "pickup_bolero", "tata_407_14ft", "truck_17ft", "truck_20_32ft"];
const SERVICE_MODES = ["transport_only", "full_service"];
const INVENTORY_CATEGORIES = ["furniture", "appliances", "kitchenItems", "electronics", "cartons", "fragileItems", "otherItems"];
const MATERIAL_TYPES = ["cartons", "bubbleWrap", "stretchFilm", "protectiveCovers", "tape", "other"];
const GEOAPIFY_BASE_URL = "https://api.geoapify.com/v1";

class PricingError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

const roundMoney = (amount) => Math.round((amount + Number.EPSILON) * 100) / 100;

const parseConfig = (envKey, missing) => {
  const raw = process.env[envKey];
  if (!raw || !raw.trim()) {
    missing.push(envKey);
    return null;
  }
  try {
    const config = JSON.parse(raw);
    if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error();
    return config;
  } catch {
    throw new PricingError(503, "PRICING_NOT_CONFIGURED", `Pricing configuration ${envKey} is invalid`, { invalid: [envKey] });
  }
};

const readRate = (value, label, missing, { allowZero = true } = {}) => {
  if (value === undefined || value === null || value === "") {
    missing.push(label);
    return null;
  }
  const rate = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate < 0 || (!allowZero && rate === 0)) {
    throw new PricingError(503, "PRICING_NOT_CONFIGURED", `Pricing configuration ${label} is invalid`, { invalid: [label] });
  }
  return rate;
};

const normalizeQuantities = (input, allowed, label, { optional = true } = {}) => {
  if (input === undefined && optional) return Object.fromEntries(allowed.map((key) => [key, 0]));
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new PricingError(400, "INVALID_BOOKING_DETAILS", `${label} quantities must be provided`);
  }
  for (const key of Object.keys(input)) {
    if (!allowed.includes(key)) throw new PricingError(400, "INVALID_BOOKING_DETAILS", `Unknown ${label} type: ${key}`);
  }
  return Object.fromEntries(allowed.map((key) => {
    const amount = input[key] === undefined ? 0 : input[key];
    if (!Number.isSafeInteger(amount) || amount < 0 || amount > 10000) {
      throw new PricingError(400, "INVALID_BOOKING_DETAILS", `${label} quantities must be non-negative whole numbers`);
    }
    return [key, amount];
  }));
};

const normalizeBookingInput = (input) => {
  const body = input || {};
  const forbiddenFields = [
    "price", "amount", "total", "baseFare", "perKmRate", "minimumFare", "rates", "tolls", "tax", "distanceKm",
    "labor", "workers", "additionalCharges", "estimate", "manualEstimate", "pricing", "pricingDraft", "pricingStatus",
    "pricingVersion", "pricingAcceptanceRequired",
  ];
  if (forbiddenFields.some((field) => Object.prototype.hasOwnProperty.call(body, field))) {
    throw new PricingError(400, "CLIENT_PRICING_NOT_ALLOWED", "Prices, rates, tolls, and taxes are calculated from backend configuration");
  }
  const { pickup, dropoff, serviceMode, vehicleType } = body;
  const pickupAddress = typeof pickup === "string" ? pickup.trim() : "";
  const dropoffAddress = typeof dropoff === "string" ? dropoff.trim() : "";
  if (!pickupAddress || pickupAddress.length > 300 || !dropoffAddress || dropoffAddress.length > 300) {
    throw new PricingError(400, "INVALID_BOOKING_DETAILS", "Enter valid pickup and dropoff addresses");
  }
  if (!SERVICE_MODES.includes(serviceMode)) throw new PricingError(400, "INVALID_SERVICE_MODE", "Choose full-service or transport-only");
  if (!VEHICLE_TYPES.includes(vehicleType)) throw new PricingError(400, "INVALID_VEHICLE", "Choose a valid vehicle");

  let inventory = normalizeQuantities(body.inventory, INVENTORY_CATEGORIES, "Inventory");
  let materials = normalizeQuantities(body.materials, MATERIAL_TYPES, "Packing material");
  const fullService = serviceMode === "full_service";
  if (!fullService) {
    inventory = Object.fromEntries(INVENTORY_CATEGORIES.map((key) => [key, 0]));
    materials = Object.fromEntries(MATERIAL_TYPES.map((key) => [key, 0]));
  }
  if (fullService && Object.values(inventory).every((quantity) => quantity === 0)) {
    throw new PricingError(400, "INVALID_INVENTORY", "Enter at least one item quantity for a full-service move");
  }
  const workerCounts = {};
  for (const key of ["packingWorkers", "loadingWorkers", "unloadingWorkers"]) {
    const value = body[key];
    if (fullService && (!Number.isSafeInteger(value) || value < 1 || value > 100)) {
      throw new PricingError(400, "INVALID_WORKER_COUNT", `${key} must be a whole number between 1 and 100 for full-service`);
    }
    workerCounts[key] = fullService ? value : 0;
  }
  return { pickup: pickupAddress, dropoff: dropoffAddress, serviceMode, vehicleType, inventory, materials, ...workerCounts };
};

const loadPricingConfig = (booking, { manualReview = false } = {}) => {
  const missing = [];
  const currency = (process.env.PRICING_CURRENCY || "").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) missing.push("PRICING_CURRENCY");
  const vehicles = parseConfig("PRICING_VEHICLES_JSON", missing);
  const manualFullService = manualReview && booking.serviceMode === "full_service";
  const materialRates = booking.serviceMode === "full_service" && !manualFullService
    ? parseConfig("PRICING_PACKING_MATERIAL_RATES_JSON", missing)
    : {};
  const loadingRate = booking.serviceMode === "full_service" && !manualFullService
    ? readRate(process.env.PRICING_LOADING_PER_WORKER, "PRICING_LOADING_PER_WORKER", missing)
    : 0;
  const unloadingRate = booking.serviceMode === "full_service" && !manualFullService
    ? readRate(process.env.PRICING_UNLOADING_PER_WORKER, "PRICING_UNLOADING_PER_WORKER", missing)
    : 0;
  const packingRate = booking.serviceMode === "full_service" && !manualFullService
    ? readRate(process.env.PRICING_PACKING_PER_WORKER, "PRICING_PACKING_PER_WORKER", missing)
    : 0;
  const taxStatus = process.env.PRICING_TAX_STATUS;
  if (!["disabled", "enabled"].includes(taxStatus)) missing.push("PRICING_TAX_STATUS (disabled or enabled)");
  const taxRate = taxStatus === "enabled" ? readRate(process.env.PRICING_TAX_RATE, "PRICING_TAX_RATE", missing) : 0;

  const vehicleConfig = vehicles?.[booking.vehicleType];
  if (!vehicleConfig || typeof vehicleConfig !== "object") {
    if (vehicles) missing.push(`vehicle configuration: ${booking.vehicleType}`);
  }
  const baseFare = vehicleConfig ? readRate(vehicleConfig.baseFare, `${booking.vehicleType}.baseFare`, missing) : null;
  const perKmRate = vehicleConfig ? readRate(vehicleConfig.perKmRate, `${booking.vehicleType}.perKmRate`, missing) : null;
  const minimumFare = vehicleConfig ? readRate(vehicleConfig.minimumFare, `${booking.vehicleType}.minimumFare`, missing, { allowZero: false }) : null;

  const packingMaterialLines = [];
  if (booking.serviceMode === "full_service" && !manualFullService) {
    const totalInventory = Object.values(booking.inventory).reduce((sum, value) => sum + value, 0);
    const totalMaterials = Object.values(booking.materials).reduce((sum, value) => sum + value, 0);
    if (totalInventory > 0 && totalMaterials === 0) {
      throw new PricingError(422, "MANUAL_ESTIMATE_REQUIRED", "Enter the quantities of packing materials needed. Material quantities cannot be inferred from item counts.");
    }
    for (const material of MATERIAL_TYPES) {
      const quantity = booking.materials[material];
      if (!quantity) continue;
      const rate = readRate(materialRates?.[material], `${material} packing rate`, missing, { allowZero: false });
      packingMaterialLines.push({ material, quantity, unitRate: rate });
    }
  }
  if (missing.length) {
    throw new PricingError(503, "PRICING_NOT_CONFIGURED", "Pricing is incomplete. No final quote was generated.", { missing });
  }
  return { currency, vehicle: { baseFare, perKmRate, minimumFare }, packingMaterialLines, loadingRate, unloadingRate, packingRate, taxStatus, taxRate };
};

const fetchGeoapifyJson = async (url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new PricingError(502, "DISTANCE_PROVIDER_ERROR", "The distance service could not process these locations");
    return await response.json();
  } catch (error) {
    if (error instanceof PricingError) throw error;
    throw new PricingError(502, "DISTANCE_PROVIDER_ERROR", "The distance service is unavailable");
  } finally {
    clearTimeout(timeoutId);
  }
};

const geocodeAddress = async (address, apiKey) => {
  const url = new URL(`${GEOAPIFY_BASE_URL}/geocode/search`);
  url.searchParams.set("text", address);
  url.searchParams.set("limit", "1");
  url.searchParams.set("apiKey", apiKey);
  const data = await fetchGeoapifyJson(url);
  const feature = data.features?.[0];
  const [longitude, latitude] = feature?.geometry?.coordinates || [];
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new PricingError(422, "LOCATION_NOT_FOUND", "One or both locations could not be resolved. Check the addresses and try again.");
  }
  return { latitude, longitude, formatted: feature.properties?.formatted || address };
};

const getRoadDistanceKm = async (pickup, dropoff) => {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) throw new PricingError(503, "DISTANCE_PROVIDER_NOT_CONFIGURED", "Distance-based pricing is unavailable because the routing service is not configured");
  const [origin, destination] = await Promise.all([geocodeAddress(pickup, apiKey), geocodeAddress(dropoff, apiKey)]);
  const url = new URL(`${GEOAPIFY_BASE_URL}/routing`);
  url.searchParams.set("waypoints", `${origin.latitude},${origin.longitude}|${destination.latitude},${destination.longitude}`);
  url.searchParams.set("mode", "drive");
  url.searchParams.set("apiKey", apiKey);
  const data = await fetchGeoapifyJson(url);
  const distanceMeters = data.features?.[0]?.properties?.distance;
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) throw new PricingError(422, "ROUTE_NOT_FOUND", "A drivable route could not be found between these locations");
  return { distanceKm: distanceMeters / 1000, pickupResolved: origin.formatted, dropoffResolved: destination.formatted };
};

const getBookingPriceQuote = async (input) => {
  const booking = normalizeBookingInput(input);
  const config = loadPricingConfig(booking);
  const route = await getRoadDistanceKm(booking.pickup, booking.dropoff);
  const vehicleTransport = config.vehicle.baseFare + route.distanceKm * config.vehicle.perKmRate;
  const transport = roundMoney(Math.max(config.vehicle.minimumFare, vehicleTransport));
  const packingMaterials = roundMoney(config.packingMaterialLines.reduce((sum, item) => sum + item.quantity * item.unitRate, 0));
  const packingLabour = roundMoney(booking.packingWorkers * config.packingRate);
  const loading = roundMoney(booking.loadingWorkers * config.loadingRate);
  const unloading = roundMoney(booking.unloadingWorkers * config.unloadingRate);
  const tolls = 0;
  const beforeTax = roundMoney(transport + packingMaterials + packingLabour + loading + unloading + tolls);
  const tax = config.taxStatus === "enabled" ? roundMoney(beforeTax * config.taxRate / 100) : 0;
  const total = roundMoney(beforeTax + tax);
  if (total <= 0) throw new PricingError(503, "PRICING_NOT_CONFIGURED", "Pricing configuration must produce a positive payable amount");
  return {
    serviceMode: booking.serviceMode,
    currency: config.currency,
    distanceKm: roundMoney(route.distanceKm),
    pickupResolved: route.pickupResolved,
    dropoffResolved: route.dropoffResolved,
    vehicle: { type: booking.vehicleType, ...config.vehicle },
    inventory: booking.inventory,
    materials: config.packingMaterialLines,
    workers: { packing: booking.packingWorkers, loading: booking.loadingWorkers, unloading: booking.unloadingWorkers },
    breakdown: { transport, packingMaterials, packingLabour, loading, unloading, tolls, tax, taxStatus: config.taxStatus, taxIncluded: config.taxStatus === "enabled", tollStatus: "excluded_actual_amount_not_available", total },
    total,
  };
};

const requiresManualEstimate = (error) =>
  error?.code === "MANUAL_ESTIMATE_REQUIRED" ||
  (error?.code === "PRICING_NOT_CONFIGURED" &&
    [error.details?.missing, error.details?.invalid].some((entries) => Array.isArray(entries) && entries.some((key) =>
      key === "PRICING_PACKING_MATERIAL_RATES_JSON" ||
      key === "PRICING_PACKING_PER_WORKER" ||
      key === "PRICING_LOADING_PER_WORKER" ||
      key === "PRICING_UNLOADING_PER_WORKER" ||
      key.endsWith(" packing rate"),
    )));

const getManualReviewQuote = async (input) => {
  const booking = normalizeBookingInput(input);
  if (booking.serviceMode !== "full_service") {
    throw new PricingError(400, "INVALID_SERVICE_MODE", "Manual packing estimates only apply to full-service moves");
  }
  const config = loadPricingConfig(booking, { manualReview: true });
  if (config.currency !== "INR") {
    throw new PricingError(503, "PRICING_NOT_CONFIGURED", "Manual packing estimates require INR pricing configuration");
  }
  if (config.taxStatus !== "disabled") {
    throw new PricingError(503, "PRICING_NOT_CONFIGURED", "Manual packing estimates are available only while tax is disabled");
  }
  const route = await getRoadDistanceKm(booking.pickup, booking.dropoff);
  const transport = roundMoney(Math.max(
    config.vehicle.minimumFare,
    config.vehicle.baseFare + route.distanceKm * config.vehicle.perKmRate,
  ));
  return {
    serviceMode: booking.serviceMode,
    currency: config.currency,
    distanceKm: roundMoney(route.distanceKm),
    pickupResolved: route.pickupResolved,
    dropoffResolved: route.dropoffResolved,
    vehicle: { type: booking.vehicleType, ...config.vehicle },
    inventory: booking.inventory,
    requestedMaterials: booking.materials,
    workers: { packing: booking.packingWorkers, loading: booking.loadingWorkers, unloading: booking.unloadingWorkers },
    pricingDraft: {
      serviceMode: booking.serviceMode,
      currency: config.currency,
      distanceKm: roundMoney(route.distanceKm),
      routeProvider: "geoapify",
      pickupResolved: route.pickupResolved,
      dropoffResolved: route.dropoffResolved,
      vehicle: { type: booking.vehicleType, ...config.vehicle },
      inventory: booking.inventory,
      requestedMaterials: booking.materials,
      workers: { packing: booking.packingWorkers, loading: booking.loadingWorkers, unloading: booking.unloadingWorkers },
      taxStatus: config.taxStatus,
      breakdown: { transport, packingMaterials: null, packingLabour: null, loading: null, unloading: null, tolls: 0, tax: 0, tollStatus: "excluded_actual_amount_not_available" },
    },
  };
};

module.exports = { PricingError, VEHICLE_TYPES, SERVICE_MODES, INVENTORY_CATEGORIES, MATERIAL_TYPES, getRoadDistanceKm, getBookingPriceQuote, getManualReviewQuote, requiresManualEstimate, normalizeBookingInput };
