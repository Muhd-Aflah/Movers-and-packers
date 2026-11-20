import { AlertTriangle, CalendarDays, CheckCircle2, Truck } from "lucide-react";

const METRICS = [
  { key: "totalMoves", title: "Total bookings", subtitle: "All your move requests", icon: CalendarDays, color: "blue" },
  { key: "upcomingMoves", title: "Upcoming moves", subtitle: "Scheduled and in progress", icon: Truck, color: "sky" },
  { key: "actionRequired", title: "Action required", subtitle: "Estimates waiting for you", icon: AlertTriangle, color: "amber" },
  { key: "completedMoves", title: "Completed", subtitle: "Successfully delivered", icon: CheckCircle2, color: "green" },
];

const ICON_COLORS = {
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  green: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
};

function MetricCard({ title, value, subtitle, icon: Icon, color, loading }) {
  return (
    <article className="flex min-h-28 min-w-0 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 sm:text-sm">{title}</p>
        {loading ? <div className="mt-2 h-7 w-14 animate-pulse rounded bg-slate-200 dark:bg-slate-700" aria-hidden="true" /> : <p className="mt-1 break-words text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">{value ?? "—"}</p>}
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ICON_COLORS[color]}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
    </article>
  );
}

export function DashboardCards({ stats = {}, summary = {}, statsLoading = false, summaryLoading = false }) {
  const values = {
    totalMoves: stats.totalMoves,
    upcomingMoves: summary.upcomingCount,
    actionRequired: summary.actionRequiredCount,
    completedMoves: summary.completedCount,
  };
  return (
    <section aria-label="Booking statistics" className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-4 sm:gap-4">
      {METRICS.map((metric) => (
        <MetricCard
          key={metric.key}
          {...metric}
          value={values[metric.key]}
          loading={metric.key === "totalMoves" ? statsLoading : summaryLoading}
        />
      ))}
    </section>
  );
}
