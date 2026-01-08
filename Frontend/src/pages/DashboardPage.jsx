import { getAuthFromStorage } from "../utils/auth";

import {
  Activity,
  BadgeCheck,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Package,
  Settings,
  Truck,
  Users,
} from "lucide-react";

function RoleBadge({ role }) {
  const label = role || "unknown";
  const isAdmin = role === "admin";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
        isAdmin
          ? "bg-amber-50 text-amber-800 border-amber-200"
          : "bg-blue-50 text-blue-800 border-blue-200"
      }`}
    >
      <BadgeCheck className="h-4 w-4" />
      {label}
    </span>
  );
}

function StatCard({ icon: Icon, title, value, subtext }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          {subtext ? <p className="mt-1 text-xs text-gray-600">{subtext}</p> : null}
        </div>
        <div className="rounded-lg bg-gray-50 p-2 text-gray-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, href }) {
  return (
    <a
      href={href}
      className="group flex items-center justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm transition hover:border-gray-300"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-gray-50 p-2 text-gray-700 group-hover:bg-gray-100">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="text-xs text-gray-600">Open</p>
        </div>
      </div>
      <span className="text-xs text-gray-500">→</span>
    </a>
  );
}

function SectionCard({ title, subtitle, icon: Icon, children }) {
  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs text-gray-600">{subtitle}</p> : null}
        </div>
        <div className="rounded-lg bg-gray-50 p-2 text-gray-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function RoleDashboard({ role }) {
  if (role === "admin") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard
          title="Operations"
          subtitle="Manage and monitor daily activity"
          icon={Activity}
        >
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <span>Pending bookings</span>
              <span className="font-semibold text-gray-900">12</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Active moves</span>
              <span className="font-semibold text-gray-900">5</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Support tickets</span>
              <span className="font-semibold text-gray-900">3</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="User Management"
          subtitle="Roles, access and verification"
          icon={Users}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">New signups</p>
                <p className="text-xs text-gray-600">Last 7 days</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">24</p>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Verified accounts</p>
                <p className="text-xs text-gray-600">Total</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">1,240</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Settings"
          subtitle="Platform configuration and policies"
          icon={Settings}
        >
          <div className="space-y-2 text-sm text-gray-700">
            <p>Update pricing rules</p>
            <p>Manage service areas</p>
            <p>Configure notifications</p>
          </div>
        </SectionCard>
      </div>
    );
  }

  if (role === "user") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard
          title="Upcoming Booking"
          subtitle="Your next scheduled move"
          icon={CalendarDays}
        >
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-sm font-semibold text-gray-900">No booking scheduled</p>
            <p className="mt-1 text-xs text-gray-600">
              Create a booking to see your timeline here.
            </p>
          </div>
        </SectionCard>

        <SectionCard
          title="Move Status"
          subtitle="Track progress and updates"
          icon={Truck}
        >
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <span>Current stage</span>
              <span className="font-semibold text-gray-900">Not started</span>
            </div>
            <div className="flex items-center justify-between">
              <span>ETA</span>
              <span className="font-semibold text-gray-900">-</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Payments"
          subtitle="Invoices and receipts"
          icon={CreditCard}
        >
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <span>Outstanding</span>
              <span className="font-semibold text-gray-900">₹0</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last payment</span>
              <span className="font-semibold text-gray-900">-</span>
            </div>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SectionCard
        title="Overview"
        subtitle="Role-aware dashboard shell"
        icon={LayoutDashboard}
      >
        <p className="text-sm text-gray-700">
          This dashboard is ready for the <span className="font-semibold">{role || "current"}</span> role.
          Add your widgets, KPIs, and quick actions based on what this user should do most.
        </p>
      </SectionCard>

      <SectionCard
        title="Next Actions"
        subtitle="Suggested actions"
        icon={Package}
      >
        <div className="space-y-2 text-sm text-gray-700">
          <p>Complete your profile</p>
          <p>Review recent activity</p>
          <p>Check notifications</p>
        </div>
      </SectionCard>
    </div>
  );
}

export function DashboardPage() {
  const { role } = getAuthFromStorage();

  return (
    <div className="min-h-[70vh] bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 lg:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white p-2 border shadow-sm">
                <LayoutDashboard className="h-5 w-5 text-gray-800" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Welcome back. Here’s a quick overview and shortcuts for your account.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <RoleBadge role={role} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Truck}
            title={role === "admin" ? "Active Moves" : "Active Booking"}
            value={role === "admin" ? "5" : "0"}
            subtext={role === "admin" ? "Currently in progress" : "No active booking"}
          />
          <StatCard
            icon={CalendarDays}
            title={role === "admin" ? "Today’s Bookings" : "Upcoming"}
            value={role === "admin" ? "12" : "0"}
            subtext={role === "admin" ? "Scheduled today" : "Next 7 days"}
          />
          <StatCard
            icon={CreditCard}
            title={role === "admin" ? "Revenue (MTD)" : "Outstanding"}
            value={role === "admin" ? "₹1.2L" : "₹0"}
            subtext={role === "admin" ? "Month to date" : "No dues"}
          />
          <StatCard
            icon={Activity}
            title={role === "admin" ? "Support Tickets" : "Status"}
            value={role === "admin" ? "3" : "—"}
            subtext={role === "admin" ? "Needs attention" : "Track your move"}
          />
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-900">Quick actions</h2>
          <p className="mt-1 text-xs text-gray-600">Jump to the most common tasks.</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionButton icon={LayoutDashboard} label="Dashboard" href="/dashboard" />
            <ActionButton icon={BadgeCheck} label="Profile" href="/profile" />
            {role === "admin" ? (
              <>
                <ActionButton icon={Users} label="Users" href="/dashboard" />
                <ActionButton icon={Settings} label="Settings" href="/dashboard" />
              </>
            ) : (
              <>
                <ActionButton icon={Package} label="Bookings" href="/dashboard" />
                <ActionButton icon={Truck} label="Track Move" href="/dashboard" />
              </>
            )}
          </div>
        </div>

        <div className="mt-6">
          <RoleDashboard role={role} />
        </div>
      </div>
    </div>
  );
}
