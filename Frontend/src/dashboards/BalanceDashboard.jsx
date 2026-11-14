import { Wallet, ArrowUpRight, CircleCheck } from "lucide-react";
import { formatCurrency } from "../utils/currency";
import { PaginationControls } from "../components/ui/PaginationControls";
import { PaymentReceiptButton } from "../components/payments/PaymentReceiptButton";

function BalanceCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-600">{subtitle}</p>}
        </div>
        <div className="rounded-lg bg-gray-100 p-2">
          <Icon className="h-5 w-5 text-gray-700" />
        </div>
      </div>
    </div>
  );
}

export function BalanceDashboard({ payments = [], pagination, page, onPageChange, loading = false, error = "" }) {
  const groups = new Map();
  for (const payment of payments) {
    const currency = payment.currency || "UNKNOWN";
    const group = groups.get(currency) || { paid: 0, paidCount: 0, latestPaid: null };
    if (payment.paymentStatus === "paid") group.paid += payment.amount || 0;
    if (payment.paymentStatus === "paid") {
      group.paidCount += 1;
      if (!group.latestPaid || new Date(payment.createdAt) > new Date(group.latestPaid.createdAt)) {
        group.latestPaid = payment;
      }
    }
    groups.set(currency, group);
  }

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {!groups.size && !error && <p className="text-sm text-gray-500">{loading ? "Loading payments..." : "No payment records yet."}</p>}
      {Array.from(groups.entries()).map(([currency, values]) => (
        <section key={currency}>
          <h3 className="mb-3 text-sm font-medium text-gray-600">
            {currency === "UNKNOWN" ? "Currency unavailable" : currency}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <BalanceCard
              title="Paid in These Records"
              value={formatCurrency(values.paid, currency)}
              subtitle="Verified payments in the current page"
              icon={Wallet}
            />
            <BalanceCard
              title="Paid Transactions"
              value={values.paidCount.toLocaleString()}
              subtitle="Verified payments"
              icon={CircleCheck}
            />
            <BalanceCard
              title="Most Recent Successful Payment"
              value={values.latestPaid
                ? formatCurrency(values.latestPaid.amount, currency)
                : formatCurrency(0, currency)}
              subtitle={values.latestPaid ? new Date(values.latestPaid.createdAt).toLocaleDateString() : "No payment"}
              icon={ArrowUpRight}
            />
          </div>
        </section>
      ))}
      {payments.length > 0 && !error && (
        <section aria-labelledby="payment-records-title" className="space-y-3">
          <h3 id="payment-records-title" className="font-semibold">Payment records on this page</h3>
          {payments.map((payment) => (
            <article key={payment._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="min-w-0">
                <p className="break-all font-medium">Payment {payment._id}</p>
                <p className="text-slate-600 dark:text-slate-300">Move {payment.move?._id || payment.move || "unavailable"}</p>
                <p className="text-slate-600 dark:text-slate-300">{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : "Date unavailable"}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(payment.amount, payment.currency)}</p>
                <p className="capitalize text-slate-600 dark:text-slate-300">{payment.paymentStatus || "status unavailable"}</p>
                {payment.receiptEligible === true && (
                  <div className="mt-2 sm:flex sm:justify-end"><PaymentReceiptButton paymentId={payment._id} /></div>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
      {pagination && <PaginationControls pagination={pagination} page={page} onPageChange={onPageChange} disabled={loading} label="Payment history pagination" />}
    </div>
  );
}
