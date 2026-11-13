import { apiRequest } from "./api";

export const getPriceQuote = (booking) =>
  apiRequest("/api/pricing/quote", {
    method: "POST",
    body: JSON.stringify(booking),
  });
