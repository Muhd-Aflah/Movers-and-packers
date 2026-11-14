const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
// Bound offset scans so an extreme page number cannot force an impractical skip.
const MAX_SKIP = 1_000_000;

const paginationError = (message) => Object.assign(new Error(message), {
  statusCode: 400,
  code: "INVALID_PAGINATION",
});

const parsePositiveInteger = (value, name, defaultValue) => {
  if (value === undefined) return defaultValue;
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    throw paginationError(`${name} must be a positive whole number`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw paginationError(`${name} is too large`);
  return parsed;
};

const parsePagination = (query = {}) => {
  const page = parsePositiveInteger(query.page, "page", 1);
  const limit = parsePositiveInteger(query.limit, "limit", DEFAULT_LIMIT);
  if (limit > MAX_LIMIT) throw paginationError(`limit must not exceed ${MAX_LIMIT}`);
  const skip = (page - 1) * limit;
  if (!Number.isSafeInteger(skip) || skip > MAX_SKIP) throw paginationError("page is too large");
  return { page, limit, skip };
};

const paginationMetadata = ({ page, limit }, total) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

const findPage = async ({ Model, filter = {}, page, limit, skip, sort, select, populate = [] }) => {
  let query = Model.find(filter);
  if (select) query = query.select(select);
  for (const population of populate) query = query.populate(...population);
  query = query.sort(sort).skip(skip).limit(limit);
  const [data, total] = await Promise.all([query.exec(), Model.countDocuments(filter)]);
  return { data, pagination: paginationMetadata({ page, limit }, total) };
};

const sendPaginated = (res, result, { statusCode = 200 } = {}) =>
  res
    .set("X-Pagination", JSON.stringify(result.pagination))
    .status(statusCode)
    .json(result.data);

module.exports = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  parsePagination,
  paginationMetadata,
  findPage,
  sendPaginated,
};
