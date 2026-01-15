import { LayoutDashboard } from "lucide-react";
import { getAuthFromStorage } from "../utils/auth";

import { AdminDashboard } from "../dashboards/AdminDashboard";
import { UserDashboard } from "../dashboards/UserDashboard";
import { ProviderDashboard } from "../dashboards/ProviderDashboard";

function DashboardContent({ role }) {
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

  return (
    <div className="min-h-[70vh] bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-xl border bg-white p-2 shadow-sm">
            <LayoutDashboard className="h-5 w-5 text-gray-800" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>

        <DashboardContent role={role} />
      </div>
    </div>
  );
}
