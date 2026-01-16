import { Link } from "react-router-dom";
import { DashboardCards } from "./DashboardCards";
import { MyOrders } from "./MyOrders";
import { BalanceDashboard } from "./BalanceDashboard";

export function UserDashboard() {
  return (
    <div className="space-y-8">
      {/* Overview cards */}
      <DashboardCards />

      {/* Primary action */}
      <div className="flex justify-end">
        <Link
          to="/booking"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Create Booking
        </Link>
      </div>

      {/* Orders */}
      <MyOrders />

      {/* Payments */}
      <BalanceDashboard />
    </div>
  );
}
