import { LayoutDashboard } from "lucide-react";
import { getAuthFromStorage } from "../utils/auth";

import { AdminDashboard } from "../dashboards/AdminDashboard";
import { ProviderDashboard } from "../dashboards/ProviderDashboard";
import { UserDashboard } from "../dashboards/UserDashboard";

function DashboardContent() {
  const { role } = getAuthFromStorage();

  switch (role) {
    case "admin":
      return <AdminDashboard />;

    case "provider":
      return <ProviderDashboard />;

    case "user":
    default:
      return <UserDashboard />;
  }
}

export function DashboardPage() {
  const { role } = getAuthFromStorage();

  const title =
    role === "admin"
      ? "Admin Dashboard"
      : role === "provider"
      ? "Provider Dashboard"
      : "Dashboard";

  return (
    <div className="min-h-[70vh] bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 lg:p-8">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-xl border bg-white p-2 shadow-sm">
            <LayoutDashboard className="h-5 w-5 text-gray-800" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {title}
          </h1>
        </div>

        {/* Role-based dashboard */}
        <DashboardContent />
      </div>
    </div>
  );
}
