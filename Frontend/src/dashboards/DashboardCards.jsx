import { CalendarDays, Truck, CreditCard } from "lucide-react";

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

export function DashboardCards() {
  // Dummy user data (MongoDB-ready)
  const data = {
    moveDate: "Not scheduled",
    status: "No active booking",
    payment: 0,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card
        title="Move Date"
        value="—"
        subtitle={data.moveDate}
        icon={CalendarDays}
      />
      <Card
        title="Move Status"
        value={data.status}
        subtitle="Create a booking to get started"
        icon={Truck}
      />
      <Card
        title="Outstanding Payment"
        value={`₹${data.payment}`}
        subtitle="No dues"
        icon={CreditCard}
      />
    </div>
  );
}
