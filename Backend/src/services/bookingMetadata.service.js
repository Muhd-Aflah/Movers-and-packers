const MOVE_TYPES = ["home_move", "office_move"];
const PROPERTY_TYPES_BY_MOVE = {
  home_move: ["house", "apartment_flat"],
  office_move: ["office", "shop_commercial"],
};
const METADATA_FIELDS = ["moveType", "propertyType", "approximateSize"];
const utcDateKey = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;

class BookingMetadataError extends Error {
  constructor(message) {
    super(message);
    this.name = "BookingMetadataError";
    this.statusCode = 400;
    this.code = "INVALID_BOOKING_METADATA";
  }
}

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const isValidDateOnly = (value) => {
  if (typeof value !== "string") return false;
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
  if (typeof value !== "string" || !value) {
    const error = new Error("Enter a valid move date");
    error.statusCode = 400;
    error.code = "INVALID_MOVE_DATE";
    throw error;
  }

  if (!isValidDateOnly(value)) {
    const error = new Error("Enter a valid move date");
    error.statusCode = 400;
    error.code = "INVALID_MOVE_DATE";
    throw error;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime())) {
    const error = new Error("Enter a valid move date");
    error.statusCode = 400;
    error.code = "INVALID_MOVE_DATE";
    throw error;
  }

  // Date-only values are compared as UTC calendar keys to avoid host timezone shifts.
  if (value < utcDateKey(now)) {
    const error = new Error("Please select today or a future date.");
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
  utcDateKey,
};
