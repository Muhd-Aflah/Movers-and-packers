import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./api", () => ({ apiRequest: vi.fn() }));

import { apiRequest } from "./api";
import { getPriceQuote } from "./pricing.service";

describe("getPriceQuote in-flight requests", () => {
  afterEach(() => vi.resetAllMocks());

  it("shares a same-payload request while it is pending", async () => {
    let resolveRequest;
    apiRequest.mockReturnValue(new Promise((resolve) => { resolveRequest = resolve; }));
    const booking = { pickup: "Origin", dropoff: "Destination" };

    const first = getPriceQuote(booking);
    const second = getPriceQuote({ ...booking });
    expect(second).toBe(first);
    expect(apiRequest).toHaveBeenCalledTimes(1);
    expect(apiRequest).toHaveBeenCalledWith("/api/pricing/quote", {
      method: "POST",
      body: JSON.stringify(booking),
    });

    resolveRequest({ total: 1234 });
    await expect(first).resolves.toEqual({ total: 1234 });

    getPriceQuote(booking);
    expect(apiRequest).toHaveBeenCalledTimes(2);
  });
});
