import { Truck, CalendarDays, CreditCard, Activity } from "lucide-react";

function StatCard({ icon: Icon, title, value, subtext }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          {subtext && <p className="mt-1 text-xs text-gray-600">{subtext}</p>}
        </div>
        <div className="rounded-lg bg-gray-50 p-2 text-gray-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  // Dummy data (perfect for a study project)
  const stats = {
    activeMoves: 5,
    todaysBookings: 12,
    revenue: "₹1.2L",
    supportTickets: 3,
  };

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Truck}
          title="Active Moves"
          value={stats.activeMoves}
          subtext="Currently in progress"
        />
        <StatCard
          icon={CalendarDays}
          title="Today’s Bookings"
          value={stats.todaysBookings}
          subtext="Scheduled today"
        />
        <StatCard
          icon={CreditCard}
          title="Revenue (MTD)"
          value={stats.revenue}
          subtext="Month to date"
        />
        <StatCard
          icon={Activity}
          title="Support Tickets"
          value={stats.supportTickets}
          subtext="Needs attention"
        />
      </div>

      {/* Simple section */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Admin Overview</h2>
        <p className="mt-2 text-sm text-gray-600">
          This is a simplified admin dashboard showing key operational metrics.
          Data is static for now and can be connected to the backend later.
        </p>
      </div>
    </div>
  );
}
