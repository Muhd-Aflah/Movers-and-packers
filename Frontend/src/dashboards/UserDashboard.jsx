import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardCards } from "./DashboardCards";
import { BalanceDashboard } from "./BalanceDashboard";
import { MyOrders } from "./MyOrders";
import { dashboardService } from "../services/dashboard.service";
import { ErrorState, LoadingSkeleton } from "../components/ui/StatePanel";
import { getMyMovesPage } from "../services/booking.service";
import { getMyPaymentsPage } from "../services/payment.service";
import { usePaginatedData } from "../hooks/usePaginatedData";

export function UserDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchMoves = useCallback((page) => getMyMovesPage(page), []);
  const fetchPayments = useCallback((page) => getMyPaymentsPage(page), []);
  const moves = usePaginatedData(fetchMoves);
  const payments = usePaginatedData(fetchPayments);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await dashboardService.getUserDashboard();

        setStats(data.stats || null);
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
    return <div className="space-y-4 p-4" aria-busy="true"><LoadingSkeleton lines={4} /></div>;
  }

  if (error) {
    return <div className="p-4"><ErrorState title="Could not load your dashboard" description={error} /></div>;
  }

  return (
    <div className="space-y-8">
      {/* Overview / stats */}
      <DashboardCards stats={stats} />

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
        <MyOrders orders={moves.items} pagination={moves.pagination} page={moves.page} onPageChange={moves.setPage} loading={moves.loading} error={moves.error} />
      </section>

      {/* Payments */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">My Payments</h2>
        <BalanceDashboard payments={payments.items} pagination={payments.pagination} page={payments.page} onPageChange={payments.setPage} loading={payments.loading} error={payments.error} />
      </section>
    </div>
  );
}
