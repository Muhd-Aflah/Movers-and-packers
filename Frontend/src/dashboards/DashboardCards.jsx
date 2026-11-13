import { CalendarDays, Truck, CreditCard } from "lucide-react";
import { formatCurrency } from "../utils/currency";

function Card({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-lg font-semibold text-gray-900">{value}</p>
          <p className="text-xs text-gray-600">{subtitle}</p>
        </div>
        <Icon className="h-5 w-5 text-gray-700" />
      </div>
    </div>
  );
}

export function DashboardCards({ stats = {} }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card
        title="Total Moves"
        value={stats.totalMoves ?? 0}
        subtitle="All your move requests"
        icon={CalendarDays}
      />
      <Card
        title="Paid Moves"
        value={stats.paidMoves ?? 0}
        subtitle="Moves with completed payment"
        icon={Truck}
      />
      <Card
        title="Total Spent"
        value={Array.isArray(stats.totalSpentByCurrency) && stats.totalSpentByCurrency.length
          ? stats.totalSpentByCurrency.map(({ currency, amount }) => formatCurrency(amount, currency)).join(" · ")
          : "No paid transactions"}
        subtitle="Completed payments by currency"
        icon={CreditCard}
      />
    </div>
  );
}
