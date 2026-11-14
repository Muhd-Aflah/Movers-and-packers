import { Info } from "lucide-react";
import { ErrorState, LoadingState } from "../../ui/StatePanel";

const BREAKDOWN_ROWS = [
  ["transport", "Transport"],
  ["packingMaterials", "Packing materials"],
  ["packingLabour", "Packing labour"],
  ["loading", "Loading"],
  ["unloading", "Unloading"],
  ["tolls", "Tolls"],
  ["tax", "Tax"],
];

const formatMoney = (amount, currency) => {
  try { return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount); }
  catch { return `${currency} ${Number(amount).toLocaleString("en-IN")}`; }
};

export function ReviewStep({ quoteState, onRetry }) {
  if (quoteState.status === "loading" || quoteState.status === "idle") {
    return <LoadingState title="Preparing your estimate" description="Getting a fresh route and server-calculated quote. This may take a few seconds." />;
  }
  if (quoteState.status === "error") {
    return <ErrorState title="We couldn’t prepare the estimate" description={quoteState.error || "Check the addresses and try again."} action={<button type="button" onClick={onRetry} className="min-h-11 rounded-control bg-blue-600 px-4 font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">Try again</button>} />;
  }

  const quote = quoteState.data;
  if (quote?.manualEstimateRequired) {
    return (
      <div className="space-y-5">
        <div className="rounded-card border border-amber-300 bg-amber-50 p-5 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          <h3 className="font-display text-lg font-bold">An admin estimate is required</h3>
          <p className="mt-2 text-sm leading-6">Your full-service request needs an administrator to review packing materials and labour rates. You can submit the booking request now; payment will remain unavailable until the estimate is prepared and you accept its current version.</p>
        </div>
        <section aria-labelledby="transport-baseline-title" className="rounded-card border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h3 id="transport-baseline-title" className="font-semibold">Server-calculated transport baseline</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">This is not the final payable estimate.</p>
          <div className="mt-4 flex justify-between gap-4 border-t border-slate-200 pt-3 text-sm dark:border-slate-700"><span>Transport</span><span className="font-semibold">{formatMoney(quote.pricingDraft?.breakdown?.transport ?? 0, quote.currency)}</span></div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{Number(quote.distanceKm).toLocaleString("en-IN")} km · {quote.pickupResolved} → {quote.dropoffResolved}</p>
        </section>
      </div>
    );
  }

  const breakdown = quote?.breakdown;
  if (!quote?.pricingAvailable || !breakdown || !Number.isFinite(quote.total)) {
    return <ErrorState title="No final quote is available" description="You can’t continue to confirmation without a server-generated quote. Try again or review your move details." action={<button type="button" onClick={onRetry} className="min-h-11 rounded-control bg-blue-600 px-4 font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">Request a new quote</button>} />;
  }

  return (
    <div className="space-y-5">
      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Review the quote calculated by SwiftMove’s pricing service. Changing addresses, service, vehicle, inventory, materials or crew will request a fresh quote.</p>
      <section aria-labelledby="quote-breakdown-title" className="rounded-card border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h3 id="quote-breakdown-title" className="font-display text-lg font-bold">Price breakdown</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{Number(quote.distanceKm).toLocaleString("en-IN")} km road distance</p></div>
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-green-950 dark:text-green-200">Server quote</span>
        </div>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{quote.pickupResolved} → {quote.dropoffResolved}</p>
        <dl className="mt-4 divide-y divide-slate-200 dark:divide-slate-700">
          {BREAKDOWN_ROWS.map(([key, label]) => <div key={key} className="flex justify-between gap-4 py-3 text-sm"><dt className="text-slate-600 dark:text-slate-300">{label}{key === "tax" ? ` (${breakdown.taxStatus})` : key === "tolls" ? " (excluded when unavailable)" : ""}</dt><dd className="shrink-0 font-semibold">{formatMoney(Number(breakdown[key] || 0), quote.currency)}</dd></div>)}
          <div className="flex justify-between gap-4 border-t-2 border-slate-300 py-4 text-base font-bold dark:border-slate-600"><dt>Total</dt><dd>{formatMoney(quote.total, quote.currency)}</dd></div>
        </dl>
      </section>
      <p className="flex gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400"><Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />The booking API recalculates the price when you submit. This displayed quote is never sent as a payable amount.</p>
    </div>
  );
}
