import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardCards } from "./DashboardCards";
import { MyMoves } from "../components/moves/MyMoves";
import { BalanceDashboard } from "./BalanceDashboard";
import { MyOrders } from "./MyOrders";
import { dashboardService } from "../services/dashboard.service";

export function UserDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await dashboardService.getUserDashboard();
        setDashboardData(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!dashboardData) return <div>No dashboard data available.</div>;

  return (
    <div className="space-y-8">
      {/* Overview / stats */}
      <DashboardCards />

      {/* Primary CTA */}
      <div className="flex justify-end">
        <Link
          to="/booking"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Create Move Request
        </Link>
      </div>

      {/* My Orders */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">My Orders</h2>
        <MyOrders orders={dashboardData.orders} />
      </section>

      {/* Payments / balance */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">My Payments</h2>
        <BalanceDashboard payments={dashboardData.payments} />
      </section>
    </div>
  );
}
