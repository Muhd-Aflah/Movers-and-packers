import { Wallet, ArrowUpRight, CircleCheck } from "lucide-react";
import { formatCurrency } from "../utils/currency";

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

export function BalanceDashboard({ payments = [] }) {
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

  if (!groups.size) {
    return <p className="text-sm text-gray-500">No payment records yet.</p>;
  }

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([currency, values]) => (
        <section key={currency}>
          <h3 className="mb-3 text-sm font-medium text-gray-600">
            {currency === "UNKNOWN" ? "Currency unavailable" : currency}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <BalanceCard
              title="Total Paid"
              value={formatCurrency(values.paid, currency)}
              subtitle="Successful payments"
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
    </div>
  );
}
