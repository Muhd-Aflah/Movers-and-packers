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

export function BalanceDashboard({ payments = [] }) {
  const paidPayments = payments.filter(
    p => p.paymentStatus === "paid"
  );

  const pendingPayments = payments.filter(
    p => p.paymentStatus === "created"
  );

  const totalPaid = paidPayments.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  const pendingAmount = pendingPayments.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  const lastPaymentAmount =
    paidPayments.length > 0 ? paidPayments[0].amount : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        Payments Overview
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BalanceCard
          title="Total Paid"
          value={totalPaid}
          subtitle="All completed payments"
          icon={Wallet}
        />

        <BalanceCard
          title="Pending Amount"
          value={pendingAmount}
          subtitle={
            pendingAmount === 0 ? "No dues" : "Payment pending"
          }
          icon={Clock}
        />

        <BalanceCard
          title="Last Payment"
          value={lastPaymentAmount}
          subtitle="Most recent successful payment"
          icon={ArrowUpRight}
        />
      </div>
    </div>
  );
}
