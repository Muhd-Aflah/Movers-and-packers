const MOVE_TYPES = ["home_move", "office_move"];
const PROPERTY_TYPES_BY_MOVE = {
  home_move: ["house", "apartment_flat"],
  office_move: ["office", "shop_commercial"],
};
const METADATA_FIELDS = ["moveType", "propertyType", "approximateSize"];
const INDIA_TIME_ZONE = "Asia/Kolkata";

class BookingMetadataError extends Error {
  constructor(message) {
    super(message);
    this.name = "BookingMetadataError";
    this.statusCode = 400;
    this.code = "INVALID_BOOKING_METADATA";
  }
}

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const indiaDateKey = (date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const isValidDateOnly = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const normalizeMoveDate = (value, now = new Date()) => {
  if ((typeof value !== "string" && !(value instanceof Date)) || !value) {
    const error = new Error("Enter a valid move date");
    error.statusCode = 400;
    error.code = "INVALID_MOVE_DATE";
    throw error;
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isValidDateOnly(value)) {
    const error = new Error("Enter a valid move date");
    error.statusCode = 400;
    error.code = "INVALID_MOVE_DATE";
    throw error;
  }

  const parsed = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    const error = new Error("Enter a valid move date");
    error.statusCode = 400;
    error.code = "INVALID_MOVE_DATE";
    throw error;
  }

  // Date inputs represent a calendar day. Compare that exact key; for legacy
  // timestamp inputs, compare the day observed in India without changing storage.
  const requestedDay = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : indiaDateKey(parsed);
  if (requestedDay < indiaDateKey(now)) {
    const error = new Error("Move date cannot be before today in India");
    error.statusCode = 400;
    error.code = "MOVE_DATE_IN_PAST";
    throw error;
  }
  return parsed;
};

const normalizeBookingMetadata = (body = {}) => {
  const supplied = METADATA_FIELDS.filter((field) => hasOwn(body, field));
  // Backend-first rollout: old clients may omit all metadata. Partial or
  // malformed metadata is rejected; the new wizard will always send all three.
  if (supplied.length === 0) return null;
  if (supplied.length !== METADATA_FIELDS.length) {
    throw new BookingMetadataError("Move type, property type, and approximate size must be provided together");
  }

  const { moveType, propertyType, approximateSize } = body;
  if (!MOVE_TYPES.includes(moveType)) throw new BookingMetadataError("Choose a valid move type");
  if (!PROPERTY_TYPES_BY_MOVE[moveType].includes(propertyType)) {
    throw new BookingMetadataError("Property type does not match the selected move type");
  }
  if (!approximateSize || typeof approximateSize !== "object" || Array.isArray(approximateSize)) {
    throw new BookingMetadataError("Approximate size must include a numeric value and unit");
  }
  if (Object.keys(approximateSize).some((key) => !["value", "unit"].includes(key))) {
    throw new BookingMetadataError("Approximate size contains an unsupported field");
  }
  const expectedUnit = moveType === "home_move" ? "bhk" : "sq_ft";
  const { value, unit } = approximateSize;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new BookingMetadataError("Approximate size must be a positive finite number");
  }
  if (unit !== expectedUnit) {
    throw new BookingMetadataError(`Approximate size unit must be ${expectedUnit}`);
  }
  if (unit === "bhk" && !Number.isSafeInteger(value)) {
    throw new BookingMetadataError("BHK size must be a positive whole number");
  }
  return { moveType, propertyType, approximateSize: { value, unit } };
};

module.exports = {
  MOVE_TYPES,
  PROPERTY_TYPES_BY_MOVE,
  BookingMetadataError,
  normalizeBookingMetadata,
  normalizeMoveDate,
  indiaDateKey,
};
