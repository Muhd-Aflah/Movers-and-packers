const MAX_MONEY_RUPEES = 10_000_000;
const MAX_MATERIAL_LINES = 30;
const MAX_ADDITIONAL_LINES = 20;

const estimateError = (statusCode, code, message) => Object.assign(new Error(message), { statusCode, code });

const hasOnlyKeys = (value, allowed) =>
  value && typeof value === "object" && !Array.isArray(value) &&
  Object.keys(value).every((key) => allowed.includes(key));

const toPaise = (amount, label, { allowZero = true } = {}) => {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0 || amount > MAX_MONEY_RUPEES || (!allowZero && amount === 0)) {
    throw estimateError(400, "INVALID_PACKING_ESTIMATE", `${label} must be a valid non-negative INR amount`);
  }
  const paise = Math.round((amount + Number.EPSILON) * 100);
  if (!Number.isSafeInteger(paise) || Math.abs(amount * 100 - paise) > 0.000001) {
    throw estimateError(400, "INVALID_PACKING_ESTIMATE", `${label} can have at most two decimal places`);
  }
  return paise;
};

const normalizeLineDescription = (value, label, maxLength) => {
  if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
    throw estimateError(400, "INVALID_PACKING_ESTIMATE", `${label} is required and must be at most ${maxLength} characters`);
  }
  return value.trim();
};

const normalizeManualEstimate = (input) => {
  const body = input || {};
  if (!hasOnlyKeys(body, ["materials", "labor", "additionalCharges"])) {
    throw estimateError(400, "INVALID_PACKING_ESTIMATE", "Estimate contains unsupported fields");
  }
  if (!Array.isArray(body.materials) || body.materials.length < 1 || body.materials.length > MAX_MATERIAL_LINES) {
    throw estimateError(400, "INVALID_PACKING_ESTIMATE", `Enter between 1 and ${MAX_MATERIAL_LINES} packing material lines`);
  }
  const materials = body.materials.map((line) => {
    if (!hasOnlyKeys(line, ["description", "quantity", "unit", "unitRate"])) {
      throw estimateError(400, "INVALID_PACKING_ESTIMATE", "Packing material line contains unsupported fields");
    }
    if (typeof line.quantity !== "number" || !Number.isFinite(line.quantity) || line.quantity <= 0 || line.quantity > 10000) {
      throw estimateError(400, "INVALID_PACKING_ESTIMATE", "Material quantity must be greater than zero and no more than 10,000");
    }
    const unitRatePaise = toPaise(line.unitRate, "Material unit rate");
    const amountPaise = Math.round(line.quantity * unitRatePaise);
    if (!Number.isSafeInteger(amountPaise)) throw estimateError(400, "INVALID_PACKING_ESTIMATE", "Material line amount is too large");
    return {
      description: normalizeLineDescription(line.description, "Material description", 120),
      quantity: line.quantity,
      unit: normalizeLineDescription(line.unit, "Material unit", 40),
      unitRate: unitRatePaise / 100,
      amount: amountPaise / 100,
    };
  });

  if (!hasOnlyKeys(body.labor, ["packing", "loading", "unloading"])) {
    throw estimateError(400, "INVALID_PACKING_ESTIMATE", "Enter valid packing, loading, and unloading labour details");
  }
  const labor = {};
  for (const key of ["packing", "loading", "unloading"]) {
    const inputLine = body.labor[key];
    if (!hasOnlyKeys(inputLine, ["workers", "ratePerWorker"]) ||
      !Number.isSafeInteger(inputLine.workers) || inputLine.workers < 1 || inputLine.workers > 100) {
      throw estimateError(400, "INVALID_PACKING_ESTIMATE", `${key} workers must be a whole number between 1 and 100`);
    }
    const ratePaise = toPaise(inputLine.ratePerWorker, `${key} rate per worker`);
    const amountPaise = ratePaise * inputLine.workers;
    if (!Number.isSafeInteger(amountPaise)) throw estimateError(400, "INVALID_PACKING_ESTIMATE", `${key} labour amount is too large`);
    labor[key] = { workers: inputLine.workers, ratePerWorker: ratePaise / 100, amount: amountPaise / 100 };
  }

  const additionalInput = body.additionalCharges === undefined ? [] : body.additionalCharges;
  if (!Array.isArray(additionalInput) || additionalInput.length > MAX_ADDITIONAL_LINES) {
    throw estimateError(400, "INVALID_PACKING_ESTIMATE", `Additional charges must contain no more than ${MAX_ADDITIONAL_LINES} lines`);
  }
  const additionalCharges = additionalInput.map((line) => {
    if (!hasOnlyKeys(line, ["description", "amount"])) {
      throw estimateError(400, "INVALID_PACKING_ESTIMATE", "Additional charge line contains unsupported fields");
    }
    const description = normalizeLineDescription(line.description, "Additional charge description", 120);
    if (/\b(gst|tax|toll)s?\b/i.test(description)) {
      throw estimateError(400, "INVALID_PACKING_ESTIMATE", "Tax and tolls cannot be added as manual charges");
    }
    return { description, amount: toPaise(line.amount, "Additional charge") / 100 };
  });

  return { materials, labor, additionalCharges };
};

const buildManualPricingSnapshot = (pricingDraft, estimate, calculatedAt = new Date()) => {
  if (!pricingDraft || pricingDraft.serviceMode !== "full_service" || !pricingDraft.breakdown) {
    throw estimateError(409, "MANUAL_ESTIMATE_UNAVAILABLE", "This move has no valid full-service pricing draft");
  }
  if (pricingDraft.currency !== "INR" || pricingDraft.taxStatus !== "disabled") {
    throw estimateError(409, "MANUAL_ESTIMATE_UNAVAILABLE", "Manual estimates require INR pricing with tax disabled");
  }
  const normalized = normalizeManualEstimate(estimate);
  const transportPaise = toPaise(pricingDraft.breakdown.transport, "Transport amount");
  const sumPaise = (items) => items.reduce((sum, item) => sum + toPaise(item.amount, "Charge amount"), 0);
  const materialsPaise = sumPaise(normalized.materials);
  const packingLaborPaise = toPaise(normalized.labor.packing.amount, "Packing labour");
  const loadingPaise = toPaise(normalized.labor.loading.amount, "Loading labour");
  const unloadingPaise = toPaise(normalized.labor.unloading.amount, "Unloading labour");
  const additionalPaise = sumPaise(normalized.additionalCharges);
  const totalPaise = transportPaise + materialsPaise + packingLaborPaise + loadingPaise + unloadingPaise + additionalPaise;
  if (!Number.isSafeInteger(totalPaise) || totalPaise <= 0) {
    throw estimateError(400, "INVALID_PACKING_ESTIMATE", "Estimate total must be a positive valid amount");
  }
  return {
    serviceMode: "full_service",
    currency: pricingDraft.currency,
    distanceKm: pricingDraft.distanceKm,
    routeProvider: pricingDraft.routeProvider,
    pickupResolved: pricingDraft.pickupResolved,
    dropoffResolved: pricingDraft.dropoffResolved,
    vehicle: pricingDraft.vehicle,
    inventory: pricingDraft.inventory,
    calculatedAt,
    estimateType: "admin_manual",
    materials: normalized.materials,
    workers: {
      packing: normalized.labor.packing.workers,
      loading: normalized.labor.loading.workers,
      unloading: normalized.labor.unloading.workers,
    },
    labor: normalized.labor,
    additionalCharges: normalized.additionalCharges,
    breakdown: {
      transport: transportPaise / 100,
      packingMaterials: materialsPaise / 100,
      packingLabour: packingLaborPaise / 100,
      loading: loadingPaise / 100,
      unloading: unloadingPaise / 100,
      additionalCharges: additionalPaise / 100,
      tolls: 0,
      tax: 0,
      taxStatus: "disabled",
      taxIncluded: false,
      tollStatus: "excluded_actual_amount_not_available",
      total: totalPaise / 100,
    },
    total: totalPaise / 100,
  };
};

module.exports = { normalizeManualEstimate, buildManualPricingSnapshot };
