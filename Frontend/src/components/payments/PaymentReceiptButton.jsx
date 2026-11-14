import { useRef, useState } from "react";
import { LoaderCircle, Printer, RotateCcw } from "lucide-react";
import { Button } from "../ui/button";
import { getPaymentReceipt } from "../../services/payment.service";
import { formatCurrency } from "../../utils/currency";
import { formatMoveDate } from "../../utils/moveDate";

const PAYMENT_TIME = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const humanize = (value) => String(value || "").replaceAll("_", " ");

const row = (label, value) => value
  ? `<div class="row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`
  : "";

function receiptHtml(receipt) {
  const paymentDate = receipt.payment?.paidAt ? new Date(receipt.payment.paidAt) : null;
  const validPaymentDate = paymentDate && Number.isFinite(paymentDate.getTime());
  const amount = formatCurrency(receipt.payment?.amount, receipt.payment?.currency);
  const moveDate = receipt.move?.moveDate ? formatMoveDate(receipt.move.moveDate) : "";
  const receiptId = escapeHtml(receipt.receiptId);
  const customerName = receipt.customer?.name || "Customer details unavailable";
  const paymentDateText = validPaymentDate ? PAYMENT_TIME.format(paymentDate) : "Date unavailable";
  const paymentRows = [
    row("Payment record", receipt.payment?.id),
    row("Gateway payment ID", receipt.payment?.gatewayPaymentId),
    row("Payment date and time", paymentDateText),
    row("Payment status", receipt.payment?.status === "paid" ? "Paid" : "Unavailable"),
  ].join("");
  const moveRows = [
    row("Booking ID", receipt.move?.id),
    row("Pickup", receipt.move?.pickup),
    row("Destination", receipt.move?.destination),
    row("Move date", moveDate),
    row("Service mode", humanize(receipt.move?.serviceMode)),
    row("Vehicle", humanize(receipt.move?.vehicleType)),
  ].join("");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>SwiftMove payment receipt ${receiptId}</title>
<style>
@page{size:A4;margin:17mm}*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#172033;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.55}body{padding:28px}.receipt{max-width:760px;margin:0 auto}.top{display:flex;justify-content:space-between;gap:24px;padding-bottom:24px;border-bottom:2px solid #dce4ef}.brand{font-size:24px;font-weight:800;letter-spacing:-.5px;color:#1d4ed8}.brand span{color:#c2410c}.eyebrow{margin:4px 0 0;color:#596579;font-size:12px}.title{text-align:right}.title h1{margin:0;font-size:25px;line-height:1.2}.title p{margin:6px 0 0;color:#596579}.reference{margin:22px 0;padding:13px 16px;background:#f4f7fb;border-radius:10px;display:flex;justify-content:space-between;gap:16px}.reference strong{overflow-wrap:anywhere}.section{margin-top:24px}.section h2{margin:0 0 10px;padding-bottom:8px;border-bottom:1px solid #dce4ef;font-size:15px}.details{margin:0}.row{display:grid;grid-template-columns:minmax(145px,34%) 1fr;gap:16px;padding:7px 0}.row dt{color:#596579}.row dd{margin:0;overflow-wrap:anywhere;font-weight:600}.amount{margin-top:26px;padding:19px 20px;background:#f4f7fb;border-radius:12px;display:flex;align-items:center;justify-content:space-between;gap:16px}.amount span{font-weight:600}.amount strong{font-size:25px;color:#1d4ed8;overflow-wrap:anywhere;text-align:right}.footer{margin-top:25px;padding-top:14px;border-top:1px solid #dce4ef;color:#596579;font-size:12px}.actions{margin-top:24px;display:flex;justify-content:center}.actions button{min-height:46px;border:0;border-radius:10px;background:#1d4ed8;color:#fff;padding:10px 18px;font-size:14px;font-weight:700;cursor:pointer}@media(max-width:560px){body{padding:18px}.top{align-items:flex-start}.title h1{font-size:21px}.reference{align-items:flex-start;flex-direction:column}.row{grid-template-columns:1fr;gap:1px}.amount{align-items:flex-start;flex-direction:column}.amount strong{text-align:left}}@media print{body{padding:0}.actions{display:none}.receipt{max-width:none}.reference,.amount{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body><main class="receipt">
<header class="top"><div><div class="brand">Swift<span>Move</span></div></div><div class="title"><h1>Payment Receipt</h1><p>Verified payment</p></div></header>
<div class="reference"><span>Receipt reference</span><strong>${receiptId}</strong></div>
<section class="section"><h2>Customer</h2><dl class="details">${row("Name", customerName)}${row("Email", receipt.customer?.email)}</dl></section>
<section class="section"><h2>Booking</h2><dl class="details">${moveRows || "<div class=\"row\"><dd>Booking details unavailable</dd></div>"}</dl></section>
<section class="section"><h2>Payment</h2><dl class="details">${paymentRows}</dl></section>
<div class="amount"><span>Amount paid</span><strong>${escapeHtml(amount)}</strong></div>
<footer class="footer">This document confirms a payment recorded by SwiftMove. It is a payment receipt, not a tax invoice.</footer>
<div class="actions"><button type="button" data-print>Print / Save as PDF</button></div>
</main></body></html>`;
}

function preparingHtml() {
  return "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>Preparing receipt</title></head><body style=\"font-family:Arial,sans-serif;padding:32px;color:#172033\"><p>Loading your verified payment receipt…</p></body></html>";
}

export function PaymentReceiptButton({ paymentId }) {
  const inFlight = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function openReceipt() {
    if (inFlight.current) return;
    const receiptWindow = window.open("about:blank", "_blank", "width=900,height=1100");
    if (!receiptWindow) {
      setError("Allow a new window to open the receipt, then try again.");
      setNotice("");
      return;
    }

    inFlight.current = true;
    setLoading(true);
    setError("");
    setNotice("");
    receiptWindow.opener = null;
    receiptWindow.document.open();
    receiptWindow.document.write(preparingHtml());
    receiptWindow.document.close();

    try {
      const receipt = await getPaymentReceipt(paymentId);
      if (!receipt?.receiptId || receipt.payment?.status !== "paid" || !receipt.payment?.currency) {
        throw new Error("Receipt data is unavailable");
      }
      if (receiptWindow.closed) throw new Error("Receipt window was closed");
      receiptWindow.document.open();
      receiptWindow.document.write(receiptHtml(receipt));
      receiptWindow.document.close();
      receiptWindow.document.querySelector("[data-print]")?.addEventListener("click", () => receiptWindow.print());
      receiptWindow.focus();
      window.setTimeout(() => {
        if (!receiptWindow.closed) receiptWindow.print();
      }, 350);
      setNotice("Receipt opened. Choose Save as PDF in the print dialog to download a PDF copy.");
    } catch {
      if (!receiptWindow.closed) receiptWindow.close();
      setError("Receipt is unavailable right now. Check your connection and try again.");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" variant="outline" size="sm" disabled={loading} onClick={openReceipt}>
        {loading ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : error ? <RotateCcw aria-hidden="true" /> : <Printer aria-hidden="true" />}
        {loading ? "Preparing receipt…" : error ? "Retry receipt" : "Download Receipt"}
      </Button>
      {error && <p role="alert" className="max-w-xs text-xs text-red-700 dark:text-red-300">{error}</p>}
      {loading && <p role="status" className="text-xs text-slate-600 dark:text-slate-300">Loading verified payment details…</p>}
      {notice && <p role="status" className="max-w-xs text-xs text-green-700 dark:text-green-300">{notice}</p>}
    </div>
  );
}
