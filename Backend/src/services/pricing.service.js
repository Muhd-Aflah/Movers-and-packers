const SERVICE_TYPES = ["warehousing", "freight", "packaging", "delivery", "custom"];
const GEOAPIFY_BASE_URL = "https://api.geoapify.com/v1";

class PricingError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

const roundMoney = (amount, fractionDigits) => {
  const factor = 10 ** fractionDigits;
  return Math.round((amount + Number.EPSILON) * factor) / factor;
};

const currencyFractionDigits = (currency) => {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits;
  } catch {
    throw new PricingError(503, "PRICING_NOT_CONFIGURED", "Pricing currency is not configured correctly");
  }
};

const parseRate = (key, missing) => {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === "") {
    missing.push(key);
    return null;
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new PricingError(503, "PRICING_NOT_CONFIGURED", "Pricing configuration contains an invalid rate");
  }
  return value;
};

const loadPricingConfig = ({ service, loadingRequired, unloadingRequired }) => {
  const missing = [];
  const currencyRaw = process.env.PRICING_CURRENCY;
  const currency = typeof currencyRaw === "string" ? currencyRaw.trim().toUpperCase() : "";
  if (!/^[A-Z]{3}$/.test(currency)) missing.push("PRICING_CURRENCY");

  const baseBookingCharge = parseRate("PRICING_BASE_CHARGE", missing);
  const pricePerKilometre = parseRate("PRICING_PER_KM", missing);
  const minimumBookingCharge = parseRate("PRICING_MINIMUM_CHARGE", missing);

  let serviceCharges = null;
  const serviceChargesRaw = process.env.PRICING_SERVICE_CHARGES_JSON;
  if (!serviceChargesRaw || !serviceChargesRaw.trim()) {
    missing.push("PRICING_SERVICE_CHARGES_JSON");
  } else {
    try {
      serviceCharges = JSON.parse(serviceChargesRaw);
    } catch {
      throw new PricingError(503, "PRICING_NOT_CONFIGURED", "Service charge configuration is invalid");
    }
    if (!serviceCharges || typeof serviceCharges !== "object" || Array.isArray(serviceCharges)) {
      throw new PricingError(503, "PRICING_NOT_CONFIGURED", "Service charge configuration is invalid");
    }
  }

  let serviceCharge = null;
  if (serviceCharges) {
    const value = serviceCharges[service];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      missing.push(`service charge for ${service}`);
    } else {
      serviceCharge = value;
    }
  }

  const loadingCharge = loadingRequired ? parseRate("PRICING_LOADING_CHARGE", missing) : 0;
  const unloadingCharge = unloadingRequired ? parseRate("PRICING_UNLOADING_CHARGE", missing) : 0;

  if (missing.length) {
    throw new PricingError(
      503,
      "PRICING_NOT_CONFIGURED",
      "Pricing is not configured yet. No price was generated.",
      { missing },
    );
  }

  return {
    currency,
    fractionDigits: currencyFractionDigits(currency),
    baseBookingCharge,
    pricePerKilometre,
    minimumBookingCharge,
    serviceCharge,
    loadingCharge,
    unloadingCharge,
  };
};

const fetchGeoapifyJson = async (url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new PricingError(502, "DISTANCE_PROVIDER_ERROR", "The distance service could not process these locations");
    }
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
  const coordinates = feature?.geometry?.coordinates;
  const [longitude, latitude] = coordinates || [];
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new PricingError(422, "LOCATION_NOT_FOUND", "One or both locations could not be resolved. Check the addresses and try again.");
  }
  return {
    latitude,
    longitude,
    formatted: feature.properties?.formatted || address,
  };
};

const getRoadDistanceKm = async (pickup, dropoff) => {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    throw new PricingError(503, "DISTANCE_PROVIDER_NOT_CONFIGURED", "Distance-based pricing is unavailable because the routing service is not configured");
  }

  const [origin, destination] = await Promise.all([
    geocodeAddress(pickup, apiKey),
    geocodeAddress(dropoff, apiKey),
  ]);

  const url = new URL(`${GEOAPIFY_BASE_URL}/routing`);
  url.searchParams.set(
    "waypoints",
    `${origin.latitude},${origin.longitude}|${destination.latitude},${destination.longitude}`,
  );
  url.searchParams.set("mode", "drive");
  url.searchParams.set("apiKey", apiKey);

  const data = await fetchGeoapifyJson(url);
  const distanceMeters = data.features?.[0]?.properties?.distance;
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) {
    throw new PricingError(422, "ROUTE_NOT_FOUND", "A drivable route could not be found between these locations");
  }

  return {
    distanceKm: distanceMeters / 1000,
    pickupResolved: origin.formatted,
    dropoffResolved: destination.formatted,
  };
};

const normalizeBookingInput = (input) => {
  const { pickup, dropoff, service, weight, loadingRequired = false, unloadingRequired = false } = input || {};
  const pickupAddress = typeof pickup === "string" ? pickup.trim() : "";
  const dropoffAddress = typeof dropoff === "string" ? dropoff.trim() : "";
  const numericWeight = Number(weight);

  if (
    !pickupAddress || pickupAddress.length > 300 ||
    !dropoffAddress || dropoffAddress.length > 300 ||
    !SERVICE_TYPES.includes(service) ||
    !Number.isFinite(numericWeight) || numericWeight <= 0 ||
    typeof loadingRequired !== "boolean" ||
    typeof unloadingRequired !== "boolean"
  ) {
    throw new PricingError(400, "INVALID_BOOKING_DETAILS", "Enter valid pickup, dropoff, service, and weight details");
  }

  return {
    pickup: pickupAddress,
    dropoff: dropoffAddress,
    service,
    weight: numericWeight,
    loadingRequired,
    unloadingRequired,
  };
};

const getBookingPriceQuote = async (input) => {
  const booking = normalizeBookingInput(input);
  const config = loadPricingConfig(booking);
  const route = await getRoadDistanceKm(booking.pickup, booking.dropoff);
  const round = (value) => roundMoney(value, config.fractionDigits);
  const baseBookingCharge = round(config.baseBookingCharge);
  const distanceCharge = round(route.distanceKm * config.pricePerKilometre);
  const serviceCharge = round(config.serviceCharge);
  const loadingCharge = round(config.loadingCharge);
  const unloadingCharge = round(config.unloadingCharge);
  const subtotal = round(
    baseBookingCharge + distanceCharge + serviceCharge + loadingCharge + unloadingCharge,
  );
  const minimumAdjustment = round(Math.max(0, config.minimumBookingCharge - subtotal));
  const total = round(Math.max(subtotal, config.minimumBookingCharge));
  if (total <= 0) {
    throw new PricingError(
      503,
      "PRICING_NOT_CONFIGURED",
      "Pricing configuration must produce a positive payable amount.",
    );
  }

  return {
    pickupResolved: route.pickupResolved,
    dropoffResolved: route.dropoffResolved,
    distanceKm: round(route.distanceKm),
    currency: config.currency,
    breakdown: {
      baseBookingCharge,
      pricePerKilometre: round(config.pricePerKilometre),
      distanceCharge,
      serviceCharge,
      loadingCharge,
      unloadingCharge,
      subtotal,
      minimumBookingCharge: round(config.minimumBookingCharge),
      minimumAdjustment,
      total,
    },
    total,
  };
};

module.exports = {
  PricingError,
  SERVICE_TYPES,
  getBookingPriceQuote,
  normalizeBookingInput,
};
