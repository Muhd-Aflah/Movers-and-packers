import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardCards } from "./DashboardCards";
import { BalanceDashboard } from "./BalanceDashboard";
import { MyOrders } from "./MyOrders";
import { dashboardService } from "../services/dashboard.service";

export function UserDashboard() {
  const [dashboardData, setDashboardData] = useState({
    stats: null,
    orders: [],
    payments: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await dashboardService.getUserDashboard();

        setDashboardData({
          stats: data.stats || null,
          orders: data.orders || [],
          payments: data.payments || [],
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="p-4">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Overview / stats */}
      <DashboardCards stats={dashboardData.stats} />

      {/* Primary CTA */}
      <div className="flex justify-end">
        <Link
          to="/booking"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Create Move Request
        </Link>
      </div>

      {/* Orders (Moves) */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">My Orders</h2>
        <MyOrders orders={dashboardData.orders} />
      </section>

      {/* Payments */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">My Payments</h2>
        <BalanceDashboard payments={dashboardData.payments} />
      </section>
    </div>
  );
}
