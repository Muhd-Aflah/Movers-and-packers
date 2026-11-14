export const BOOKING_STEPS = [
  "Moving Details",
  "Addresses",
  "Service",
  "Vehicle",
  "Inventory",
  "Labour",
  "Review",
  "Confirm",
];

export const INVENTORY_FIELDS = [
  ["furniture", "Furniture"],
  ["appliances", "Appliances"],
  ["kitchenItems", "Kitchen items"],
  ["electronics", "Electronics"],
  ["cartons", "Cartons / boxes"],
  ["fragileItems", "Fragile items"],
  ["otherItems", "Other items"],
];

export const MATERIAL_FIELDS = [
  ["cartons", "Cartons"],
  ["bubbleWrap", "Bubble wrap"],
  ["stretchFilm", "Stretch film"],
  ["protectiveCovers", "Protective covers"],
  ["tape", "Tape"],
  ["other", "Other materials"],
];

export const WORKER_FIELDS = [
  ["packingWorkers", "Packing workers"],
  ["loadingWorkers", "Loading workers"],
  ["unloadingWorkers", "Unloading workers"],
];

export const VEHICLES = [
  ["three_wheeler_eeco", "3-Wheeler / Eeco", "Compact moves and narrow streets"],
  ["tata_ace", "Tata Ace", "Small household moves"],
  ["pickup_bolero", "Pickup / Bolero", "Medium-sized loads"],
  ["tata_407_14ft", "Tata 407 · 14 ft", "Larger household moves"],
  ["truck_17ft", "17-ft Truck", "Large home or office moves"],
  ["truck_20_32ft", "20–32-ft Truck", "High-volume moves"],
];

export const PROPERTY_TYPES = {
  home_move: [["house", "Independent house"], ["apartment_flat", "Apartment / flat"]],
  office_move: [["office", "Office"], ["shop_commercial", "Shop / commercial space"]],
};

export const DRAFT_STORAGE_KEY = "swiftmove:booking-draft:v1";
export const LEGACY_DRAFT_KEY = "pendingBooking";
export const DRAFT_VERSION = 1;
export const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

export const getIndiaToday = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const isValidDateOnly = (value) => {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
};

const emptyQuantities = (fields) => Object.fromEntries(fields.map(([key]) => [key, 0]));

export const defaultBookingDraft = () => ({
  moveType: "home_move",
  propertyType: "",
  approximateSize: { value: "", unit: "bhk" },
  moveDate: "",
  pickup: "",
  dropoff: "",
  serviceMode: "full_service",
  vehicleType: "tata_ace",
  inventory: emptyQuantities(INVENTORY_FIELDS),
  materials: emptyQuantities(MATERIAL_FIELDS),
  packingWorkers: 1,
  loadingWorkers: 1,
  unloadingWorkers: 1,
});

const safeText = (value, maxLength = 300) =>
  typeof value === "string" ? value.slice(0, maxLength) : "";

const safeQuantityGroup = (source, fields) => Object.fromEntries(fields.map(([key]) => {
  const value = source?.[key];
  const number = value === "" || value === undefined || value === null ? 0 : Number(value);
  return [key, Number.isSafeInteger(number) && number >= 0 && number <= 10000 ? number : 0];
}));

export const sanitizeBookingDraft = (source = {}) => {
  const draft = defaultBookingDraft();
  const moveType = ["home_move", "office_move"].includes(source.moveType) ? source.moveType : draft.moveType;
  const propertyOptions = PROPERTY_TYPES[moveType];
  const propertyType = propertyOptions.some(([value]) => value === source.propertyType) ? source.propertyType : "";
  const expectedUnit = moveType === "home_move" ? "bhk" : "sq_ft";
  const sizeValue = source.approximateSize?.value;
  const numericSize = sizeValue === "" || sizeValue === undefined ? "" : Number(sizeValue);
  const approximateSize = {
    value: Number.isFinite(numericSize) && numericSize > 0 && (expectedUnit !== "bhk" || Number.isSafeInteger(numericSize))
      ? numericSize
      : "",
    unit: expectedUnit,
  };
  const moveDate = isValidDateOnly(source.moveDate)
    ? source.moveDate
    : "";
  return {
    moveType,
    propertyType,
    approximateSize,
    moveDate,
    pickup: safeText(source.pickup ?? source.origin),
    dropoff: safeText(source.dropoff ?? source.destination ?? source.drop),
    serviceMode: ["full_service", "transport_only"].includes(source.serviceMode) ? source.serviceMode : draft.serviceMode,
    vehicleType: VEHICLES.some(([value]) => value === source.vehicleType) ? source.vehicleType : draft.vehicleType,
    inventory: safeQuantityGroup(source.inventory, INVENTORY_FIELDS),
    materials: safeQuantityGroup(source.materials, MATERIAL_FIELDS),
    packingWorkers: Number.isSafeInteger(Number(source.packingWorkers)) && Number(source.packingWorkers) >= 1 && Number(source.packingWorkers) <= 100 ? Number(source.packingWorkers) : 1,
    loadingWorkers: Number.isSafeInteger(Number(source.loadingWorkers)) && Number(source.loadingWorkers) >= 1 && Number(source.loadingWorkers) <= 100 ? Number(source.loadingWorkers) : 1,
    unloadingWorkers: Number.isSafeInteger(Number(source.unloadingWorkers)) && Number(source.unloadingWorkers) >= 1 && Number(source.unloadingWorkers) <= 100 ? Number(source.unloadingWorkers) : 1,
  };
};

const parseDraftStorage = (storage, key) => {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    try { storage?.removeItem(key); } catch { /* storage may be unavailable */ }
    return null;
  }
};

export const loadBookingDraft = (locationState = null, now = Date.now()) => {
  try {
    const stored = parseDraftStorage(window.sessionStorage, DRAFT_STORAGE_KEY);
    if (stored?.version === DRAFT_VERSION && Number.isFinite(stored.expiresAt) && stored.expiresAt > now && stored.data) {
      const savedStep = Number.isInteger(stored.step) ? stored.step : 0;
      return { data: sanitizeBookingDraft(stored.data), step: Math.min(6, Math.max(0, savedStep)), restored: true };
    }
    if (stored) window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch { /* storage may be unavailable */ }

  let legacy = null;
  try { legacy = parseDraftStorage(window.localStorage, LEGACY_DRAFT_KEY); }
  catch { /* local storage may be blocked independently of session storage */ }
  if (legacy && typeof legacy === "object") {
    if (Object.prototype.hasOwnProperty.call(legacy, "__draftExpiresAt") &&
      (!Number.isFinite(legacy.__draftExpiresAt) || legacy.__draftExpiresAt <= now)) {
      try { window.localStorage.removeItem(LEGACY_DRAFT_KEY); } catch { /* storage may be unavailable */ }
    } else {
      if (!Object.prototype.hasOwnProperty.call(legacy, "__draftExpiresAt")) {
        try {
          window.localStorage.setItem(LEGACY_DRAFT_KEY, JSON.stringify({
            ...legacy,
            __draftExpiresAt: now + DRAFT_TTL_MS,
          }));
        } catch { /* still restore the compatible legacy payload */ }
      }
      return { data: sanitizeBookingDraft(legacy), step: 0, restored: true };
    }
  }

  const initial = locationState?.quoteData || locationState || {};
  return { data: sanitizeBookingDraft(initial), step: 0, restored: false };
};

export const saveBookingDraft = (data, step, now = Date.now()) => {
  try {
    window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
      version: DRAFT_VERSION,
      expiresAt: now + DRAFT_TTL_MS,
      step,
      data: sanitizeBookingDraft(data),
    }));
  } catch { /* keep the current booking usable when storage is unavailable */ }
};

export const saveLegacyPendingBooking = (data, now = Date.now()) => {
  try {
    window.localStorage.setItem(LEGACY_DRAFT_KEY, JSON.stringify({
      ...sanitizeBookingDraft(data),
      __draftExpiresAt: now + DRAFT_TTL_MS,
    }));
  }
  catch { /* login can still proceed; the session draft may be available */ }
};

export const clearBookingDraft = () => {
  try { window.sessionStorage.removeItem(DRAFT_STORAGE_KEY); } catch { /* ignore storage failures */ }
  try { window.localStorage.removeItem(LEGACY_DRAFT_KEY); } catch { /* ignore storage failures */ }
};

export const getPricingPayload = (draft) => {
  const payload = {
    pickup: draft.pickup.trim(),
    dropoff: draft.dropoff.trim(),
    serviceMode: draft.serviceMode,
    vehicleType: draft.vehicleType,
  };
  if (draft.serviceMode === "full_service") {
    Object.assign(payload, {
      inventory: Object.fromEntries(Object.entries(draft.inventory).map(([key, value]) => [key, Number(value || 0)])),
      materials: Object.fromEntries(Object.entries(draft.materials).map(([key, value]) => [key, Number(value || 0)])),
      packingWorkers: Number(draft.packingWorkers),
      loadingWorkers: Number(draft.loadingWorkers),
      unloadingWorkers: Number(draft.unloadingWorkers),
    });
  }
  return payload;
};

export const getCreateMovePayload = (draft) => ({
  ...getPricingPayload(draft),
  moveDate: draft.moveDate,
  moveType: draft.moveType,
  propertyType: draft.propertyType,
  approximateSize: {
    value: Number(draft.approximateSize.value),
    unit: draft.moveType === "home_move" ? "bhk" : "sq_ft",
  },
});

export const formatQuoteMoney = (amount, currency) => {
  try { return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount); }
  catch { return `${currency || ""} ${Number(amount).toLocaleString("en-IN")}`.trim(); }
};

export const validateStep = (step, draft) => {
  const errors = {};
  if (step === 0) {
    if (!["home_move", "office_move"].includes(draft.moveType)) errors.moveType = "Choose a move type.";
    if (!PROPERTY_TYPES[draft.moveType]?.some(([value]) => value === draft.propertyType)) errors.propertyType = "Choose a property type.";
    const size = Number(draft.approximateSize.value);
    if (!Number.isFinite(size) || size <= 0) errors.approximateSize = "Enter a positive approximate size.";
    else if (draft.moveType === "home_move" && !Number.isSafeInteger(size)) errors.approximateSize = "BHK must be a whole number.";
    if (!isValidDateOnly(draft.moveDate) || draft.moveDate < getIndiaToday()) errors.moveDate = "Choose today or a future move date.";
  }
  if (step === 1) {
    if (!draft.pickup.trim()) errors.pickup = "Enter a pickup address.";
    else if (draft.pickup.trim().length > 300) errors.pickup = "Use 300 characters or fewer.";
    if (!draft.dropoff.trim()) errors.dropoff = "Enter a delivery address.";
    else if (draft.dropoff.trim().length > 300) errors.dropoff = "Use 300 characters or fewer.";
  }
  if (step === 2 && !["full_service", "transport_only"].includes(draft.serviceMode)) errors.serviceMode = "Choose a service mode.";
  if (step === 3 && !VEHICLES.some(([value]) => value === draft.vehicleType)) errors.vehicleType = "Choose a vehicle.";
  if (step === 4 && draft.serviceMode === "full_service") {
    const values = Object.values(draft.inventory);
    if (values.some((value) => !Number.isSafeInteger(Number(value)) || Number(value) < 0 || Number(value) > 10000)) errors.inventory = "Use whole-number quantities from 0 to 10,000.";
    else if (values.every((value) => Number(value) === 0)) errors.inventory = "Add at least one inventory item for full service.";
    if (Object.values(draft.materials).some((value) => !Number.isSafeInteger(Number(value)) || Number(value) < 0 || Number(value) > 10000)) errors.materials = "Use whole-number quantities from 0 to 10,000.";
  }
  if (step === 5 && draft.serviceMode === "full_service") {
    for (const [field, label] of WORKER_FIELDS) {
      const value = Number(draft[field]);
      if (!Number.isSafeInteger(value) || value < 1 || value > 100) errors[field] = `${label} must be a whole number from 1 to 100.`;
    }
  }
  return errors;
};

export const validateBookingDraft = (draft) => [0, 1, 2, 3, 4, 5].reduce(
  (allErrors, step) => ({ ...allErrors, ...validateStep(step, draft) }),
  {},
);
