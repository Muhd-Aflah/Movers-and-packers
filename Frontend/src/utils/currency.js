export function formatCurrency(amount, currency) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return "Amount unavailable";
  if (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) {
    return `${numericAmount.toLocaleString()} (currency unavailable)`;
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(numericAmount);
  } catch {
    return `${numericAmount.toLocaleString()} ${currency}`;
  }
}
