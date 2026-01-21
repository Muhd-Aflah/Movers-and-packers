import { Wallet, ArrowUpRight, Clock } from "lucide-react";

function BalanceCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-xl font-semibold text-gray-900">
            ₹{value.toLocaleString()}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-600">{subtitle}</p>
          )}
        </div>
        <div className="rounded-lg bg-gray-100 p-2">
          <Icon className="h-5 w-5 text-gray-700" />
        </div>
      </div>
    </div>
  );
}

export function BalanceDashboard({ payments }) {
  // Dummy data (MongoDB-ready)
  const balance = {
    totalPaid: payments.filter(p => p.paymentStatus === "paid").reduce((sum, p) => sum + p.amount, 0),
    pending: payments.filter(p => p.paymentStatus === "created").reduce((sum, p) => sum + p.amount, 0),
    lastPayment: payments.length > 0 ? payments[0].amount : 0,
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        Payments Overview
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BalanceCard
          title="Total Paid"
          value={balance.totalPaid}
          subtitle="All completed payments"
          icon={Wallet}
        />

        <BalanceCard
          title="Pending Amount"
          value={balance.pending}
          subtitle={
            balance.pending === 0 ? "No dues" : "Payment pending"
          }
          icon={Clock}
        />

        <BalanceCard
          title="Last Payment"
          value={balance.lastPayment}
          subtitle="Most recent transaction"
          icon={ArrowUpRight}
        />
      </div>
    </div>
  );
}
