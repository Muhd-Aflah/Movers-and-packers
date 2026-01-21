import { Link, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { adminService } from "../services/admin.service";

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: "—",
    providers: "—",
    activeOrders: "—",
    totalPayments: "—",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getDashboardStats();
        setStats({
          totalUsers: data.totalUsers,
          providers: data.totalProviders,
          activeOrders: data.activeMoves,
          totalPayments: `₹${data.totalRevenue?.toLocaleString()}`,
        });
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Loading admin dashboard...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-600">
          Platform overview and management
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers} />
        <StatCard title="Providers" value={stats.providers} />
        <StatCard title="Active Orders" value={stats.activeOrders} />
        <StatCard title="Total Payments" value={stats.totalPayments} />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActionCard
          title="Manage Users"
          description="View and manage customer accounts"
          to="/dashboard/admin/users"
        />
        <ActionCard
          title="Manage Providers"
          description="Approve & manage service providers"
          to="/dashboard/admin/providers"
        />
        <ActionCard
          title="View Orders"
          description="All bookings and moves"
          to="/dashboard/admin/orders"
        />
        <ActionCard
          title="Payments"
          description="All payment transactions"
          to="/dashboard/admin/payments"
        />
      </div>

      {/* Renders child routes */}
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function ActionCard({ title, description, to }) {
  return (
    <Link
      to={to}
      className="rounded-lg border bg-white p-5 hover:shadow transition"
    >
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </Link>
  );
}
