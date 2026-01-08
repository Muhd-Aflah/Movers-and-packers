// Format utilities
export const formatCurrency = (amount, currency = "NGN") => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
  }).format(amount);
};

export const formatDate = (date, options = {}) => {
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  }).format(new Date(date));
};

export const formatNumber = (number, locale = "en-NG") => {
  return new Intl.NumberFormat(locale).format(number);
};

export const formatWeight = (weight, unit = "kg") => {
  return `${weight} ${unit}`;
};

export const formatPhoneNumber = (phone) => {
  // Simple phone formatting - can be enhanced based on requirements
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
};

// String utilities
export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncate = (str, length, ending = "...") => {
  if (str.length > length) {
    return str.substring(0, length - ending.length) + ending;
  }
  return str;
};

export const slugify = (str) => {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Array utilities
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

export const unique = (array) => {
  return [...new Set(array)];
};

export const sortBy = (array, key, direction = "asc") => {
  return [...array].sort((a, b) => {
    if (direction === "desc") {
      return b[key] > a[key] ? 1 : -1;
    }
    return a[key] > b[key] ? 1 : -1;
  });
};
