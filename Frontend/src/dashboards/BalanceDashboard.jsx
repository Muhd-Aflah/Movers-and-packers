import { ArrowUpRight, CircleCheck, CreditCard, Wallet } from "lucide-react";
import { formatCurrency } from "../utils/currency";
import { PaginationControls } from "../components/ui/PaginationControls";
import { PaymentReceiptButton } from "../components/payments/PaymentReceiptButton";
import { EmptyState, ErrorState, LoadingSkeleton } from "../components/ui/StatePanel";
import { Link } from "react-router-dom";

function BalanceCard({ title, value, subtitle, icon: Icon }) {
  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs text-slate-500 dark:text-slate-400">{title}</p><p className="mt-1 break-words text-lg font-semibold text-slate-900 dark:text-slate-100">{value}</p>{subtitle && <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{subtitle}</p>}</div><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Icon className="h-4 w-4" aria-hidden="true" /></span></div>
    </article>
  );
}

export function BalanceDashboard({ payments = [], pagination, page, onPageChange, loading = false, error = "", onRetry, compact = false }) {
  const groups = new Map();
  for (const payment of payments) {
    const currency = payment.currency || "UNKNOWN";
    const group = groups.get(currency) || { paid: 0, paidCount: 0, latestPaid: null };
    if (payment.paymentStatus === "paid" && Number.isFinite(payment.amount)) {
      group.paid += payment.amount;
      group.paidCount += 1;
      if (!group.latestPaid || new Date(payment.createdAt) > new Date(group.latestPaid.createdAt)) group.latestPaid = payment;
    }
    groups.set(currency, group);
  }

  if (error) return <ErrorState title="Could not load your payments" description={error} action={<button type="button" onClick={onRetry} className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">Retry</button>} />;
  if (loading && payments.length === 0) return <div aria-busy="true"><LoadingSkeleton lines={3} /></div>;
  if (!payments.length) return <EmptyState icon={Wallet} title="No payment records yet" description="Payments will appear here after a booking payment is completed." action={<Link to="/booking" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800">Plan a move <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>} />;

  return (
    <div className="min-w-0 space-y-4">
      {Array.from(groups.entries()).map(([currency, values]) => (
        <section key={currency} className="min-w-0">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{currency === "UNKNOWN" ? "Currency unavailable" : currency}</h3>
          <div className={`grid min-w-0 gap-2 ${compact ? "grid-cols-1" : "sm:grid-cols-3"}`}>
            <BalanceCard title="Paid in these records" value={formatCurrency(values.paid, currency)} subtitle="Verified payments on this page" icon={Wallet} />
            <BalanceCard title="Paid transactions" value={values.paidCount.toLocaleString()} subtitle="Verified payments" icon={CircleCheck} />
            <BalanceCard title="Most recent successful payment" value={values.latestPaid ? formatCurrency(values.latestPaid.amount, currency) : "No paid transaction"} subtitle={values.latestPaid?.createdAt ? new Date(values.latestPaid.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) : "No payment date"} icon={CreditCard} />
          </div>
        </section>
      ))}
      <section aria-labelledby="payment-records-title" className="min-w-0 space-y-3">
        <h3 id="payment-records-title" className="font-semibold">Payment history</h3>
        {payments.map((payment) => (
          <article key={payment._id} className="flex min-w-0 flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700 sm:p-4">
            <div className="min-w-0"><p className="break-all font-medium">Payment · {String(payment._id || "").slice(-8).toUpperCase() || "ID unavailable"}</p><p className="mt-1 break-all text-xs text-slate-600 dark:text-slate-400">Move {payment.move?._id || payment.move || "unavailable"}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) : "Date unavailable"}</p></div>
            <div className="min-w-0 text-right"><p className="font-semibold">{Number.isFinite(payment.amount) ? formatCurrency(payment.amount, payment.currency) : "Amount unavailable"}</p><p className="mt-1 capitalize text-slate-600 dark:text-slate-300">{payment.paymentStatus || "Status unavailable"}</p>{payment.receiptEligible === true && <div className="mt-2 sm:flex sm:justify-end"><PaymentReceiptButton paymentId={payment._id} /></div>}</div>
          </article>
        ))}
      </section>
      {pagination && <PaginationControls pagination={pagination} page={page} onPageChange={onPageChange} disabled={loading} label="Payment history pagination" />}
    </div>
  );
}
