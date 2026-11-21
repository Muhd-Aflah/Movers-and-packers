import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { printHtml, isNativePlatform, isPluginAvailable, getPaymentReceipt } = vi.hoisted(() => ({
  printHtml: vi.fn(),
  isNativePlatform: vi.fn(),
  isPluginAvailable: vi.fn(),
  getPaymentReceipt: vi.fn(),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform, isPluginAvailable },
  registerPlugin: () => ({ printHtml }),
}));
vi.mock("../../services/payment.service", () => ({ getPaymentReceipt }));

import { PaymentReceiptButton } from "./PaymentReceiptButton";

const verifiedReceipt = {
  receiptId: "SM-RCP-ABC123",
  customer: { name: "Test Customer" },
  move: { id: "move-1" },
  payment: { id: "payment-1", status: "paid", currency: "INR", amount: 100 },
};

const receiptWindow = () => ({
  closed: false,
  document: { open: vi.fn(), write: vi.fn(), close: vi.fn(), querySelector: vi.fn(() => null) },
  focus: vi.fn(),
  print: vi.fn(),
  close: vi.fn(),
});

describe("PaymentReceiptButton", () => {
  beforeEach(() => {
    isNativePlatform.mockReturnValue(false);
    isPluginAvailable.mockReturnValue(false);
    getPaymentReceipt.mockReset();
    printHtml.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("opens a desktop receipt and retries the same payment ID after a transient error", async () => {
    const firstWindow = receiptWindow();
    const secondWindow = receiptWindow();
    vi.spyOn(window, "open").mockReturnValueOnce(firstWindow).mockReturnValueOnce(secondWindow);
    getPaymentReceipt
      .mockRejectedValueOnce(new Error("Temporary failure"))
      .mockResolvedValueOnce(verifiedReceipt);

    render(<PaymentReceiptButton paymentId="payment-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Download Receipt" }));
    await screen.findByText("Receipt is unavailable right now. Check your connection and try again.");
    expect(firstWindow.close).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Retry receipt" }));
    await screen.findByText("Receipt opened. Choose Save as PDF in the print dialog to download a PDF copy.");
    await waitFor(() => expect(secondWindow.document.write).toHaveBeenCalledWith(
      expect.stringContaining("<title>SwiftMove payment receipt"),
    ));
    expect(getPaymentReceipt).toHaveBeenCalledTimes(2);
    expect(getPaymentReceipt).toHaveBeenNthCalledWith(1, "payment-1");
    expect(getPaymentReceipt).toHaveBeenNthCalledWith(2, "payment-1");
  });

  it("sends verified receipt HTML to the Android native printer", async () => {
    const openWindow = vi.spyOn(window, "open");
    isNativePlatform.mockReturnValue(true);
    isPluginAvailable.mockReturnValue(true);
    getPaymentReceipt.mockResolvedValue(verifiedReceipt);
    printHtml.mockResolvedValue({ opened: true });

    render(<PaymentReceiptButton paymentId="payment-android" />);
    fireEvent.click(screen.getByRole("button", { name: "Download Receipt" }));
    await screen.findByText("Android print options opened. Choose Save as PDF to download your receipt.");

    expect(getPaymentReceipt).toHaveBeenCalledWith("payment-android");
    expect(printHtml).toHaveBeenCalledWith(expect.objectContaining({
      name: "SwiftMove Receipt SM-RCP-ABC123",
      html: expect.stringContaining("Verified payment"),
    }));
    expect(openWindow).not.toHaveBeenCalled();
  });
});
