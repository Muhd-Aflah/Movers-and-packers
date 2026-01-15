import { CalendarDays, Truck, CreditCard } from "lucide-react";

function InfoCard({ icon: Icon, title, value, subtext }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
          {subtext && (
            <p className="mt-1 text-xs text-gray-600">{subtext}</p>
          )}
        </div>
        <div className="rounded-lg bg-gray-50 p-2 text-gray-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function UserDashboard() {
  // Dummy user data (perfect for study project)
  const booking = {
    status: "No active booking",
    date: "—",
    payment: "₹0",
  };

  return (
    <div className="space-y-6">
      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoCard
          icon={CalendarDays}
          title="Move Date"
          value={booking.date}
          subtext="Not scheduled"
        />
        <InfoCard
          icon={Truck}
          title="Move Status"
          value={booking.status}
          subtext="Create a booking to get started"
        />
        <InfoCard
          icon={CreditCard}
          title="Outstanding Payment"
          value={booking.payment}
          subtext="No dues"
        />
      </div>

      {/* Message section */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">
          Welcome
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          This is your user dashboard. Once you create a booking,
          you’ll be able to track your move status and payments here.
        </p>
      </div>
    </div>
  );
}
