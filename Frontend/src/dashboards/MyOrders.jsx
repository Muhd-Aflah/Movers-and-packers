import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, CalendarDays, ClipboardList, Clock3, MapPin, Package, X } from "lucide-react";
import { EmptyState, ErrorState, LoadingSkeleton } from "../components/ui/StatePanel";
import { StatusBadge } from "../components/ui/StatusBadge";
import { formatCurrency } from "../utils/currency";
import { formatMoveDate } from "../utils/moveDate";
import { getServiceModeLabel } from "../utils/serviceMode";
import { PaginationControls } from "../components/ui/PaginationControls";
import { MoveTrackingTimeline } from "../components/moves/MoveTrackingTimeline";
import { canPayForMove, hasEstimateAction } from "./customerDashboardModel";

const EVENT_LABELS = {
  booking_requested: "Booking requested",
  payment_confirmed: "Payment confirmed",
  booking_confirmed: "Booking confirmed",
  mover_assigned: "Mover assigned",
  pickup_started: "Pickup or packing started",
  in_transit: "Move in transit",
  delivery_completed: "Delivery completed",
};

const stopLabel = (stop, fallback) => typeof stop === "string" ? stop : stop?.city || stop?.address || fallback;
const moveReference = (move) => String(move?._id || "").slice(-8).toUpperCase() || "ID unavailable";

function BookingCard({ move, onViewDetails }) {
  const route = `${stopLabel(move.pickup, "Pickup unavailable")} → ${stopLabel(move.dropoff, "Delivery unavailable")}`;
  const pendingEstimate = hasEstimateAction(move);
  const paymentEligible = canPayForMove(move);
  const priceText = pendingEstimate
    ? Number.isFinite(move.price) ? formatCurrency(move.price, move.pricing?.currency) : "Estimate ready"
    : Number.isFinite(move.price) ? formatCurrency(move.price, move.pricing?.currency) : "No final estimate";

  return (
    <article className="min-w-0 rounded-xl border border-slate-200 p-4 transition-shadow hover:shadow-sm dark:border-slate-700 sm:p-5">
      <div className="flex min-w-0 flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900 dark:text-white">Move · {moveReference(move)}</h3><StatusBadge status={pendingEstimate ? "pending_acceptance" : move.status} /></div>
          <p className="mt-2 flex min-w-0 items-start gap-2 text-sm text-slate-700 dark:text-slate-300"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" /><span className="min-w-0 break-words">{route}</span></p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400"><span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />{formatMoveDate(move.moveDate)}</span><span>{getServiceModeLabel(move)}</span></div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
          <p className="font-bold text-slate-900 dark:text-white">{priceText}</p>
          <StatusBadge status={move.paid ? "paid" : "pending"} className="text-[11px]" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <button type="button" onClick={() => onViewDetails(move)} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-slate-200 dark:hover:bg-slate-800">View Details <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
        {pendingEstimate
          ? <Link to={`/payment?moveId=${encodeURIComponent(move._id)}`} className="inline-flex min-h-10 items-center rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Review Estimate</Link>
          : paymentEligible
            ? <Link to={`/payment?moveId=${encodeURIComponent(move._id)}`} className="inline-flex min-h-10 items-center rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Pay Now</Link>
            : null}
      </div>
    </article>
  );
}

function BookingDetailsDialog({ move, onClose }) {
  useEffect(() => {
    if (!move) return undefined;
    const onKeyDown = (event) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [move, onClose]);

  if (!move) return null;
  const pendingEstimate = hasEstimateAction(move);
  const paymentEligible = canPayForMove(move);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-3 sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="booking-details-title" className="max-h-[min(88vh,50rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:p-7">
        <header className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Move · {moveReference(move)}</p><h2 id="booking-details-title" className="mt-1 break-words text-xl font-bold">Booking details</h2></div><button type="button" aria-label="Close booking details" onClick={onClose} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-slate-300 dark:hover:bg-slate-800"><X className="h-5 w-5" aria-hidden="true" /></button></header>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Pickup</p><p className="mt-1 break-words text-sm font-medium">{stopLabel(move.pickup, "Unavailable")}</p></div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Delivery</p><p className="mt-1 break-words text-sm font-medium">{stopLabel(move.dropoff, "Unavailable")}</p></div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Move date</p><p className="mt-1 text-sm font-medium">{formatMoveDate(move.moveDate)}</p></div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Service and status</p><p className="mt-1 text-sm font-medium">{getServiceModeLabel(move)} · {String(move.status || "Status unavailable").replaceAll("_", " ")}</p></div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Payment</p><p className="mt-1 text-sm font-medium">{move.paid ? "Paid" : "Not paid"}</p></div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estimate</p><p className="mt-1 text-sm font-medium">{pendingEstimate ? "Updated estimate awaiting your acceptance" : Number.isFinite(move.price) ? formatCurrency(move.price, move.pricing?.currency) : move.pricingStatus === "manual_review" ? "Waiting for an admin estimate" : "No final estimate available"}</p></div>
        </div>
        <div className="mt-6"><h3 className="mb-3 flex items-center gap-2 font-semibold"><Clock3 className="h-4 w-4 text-blue-600" aria-hidden="true" />Tracking</h3><MoveTrackingTimeline events={move.trackingEvents || []} /></div>
        {pendingEstimate && <Link to={`/payment?moveId=${encodeURIComponent(move._id)}`} onClick={onClose} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">Review Estimate</Link>}
        {!pendingEstimate && paymentEligible && <Link to={`/payment?moveId=${encodeURIComponent(move._id)}`} onClick={onClose} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">Pay Now</Link>}
      </section>
    </div>
  );
}

function ActivityList({ orders }) {
  const entries = orders.flatMap((move) => (Array.isArray(move.trackingEvents) ? move.trackingEvents : []).map((event) => ({ move, event })))
    .filter(({ event }) => Number.isFinite(new Date(event.at).getTime()))
    .sort((a, b) => new Date(b.event.at) - new Date(a.event.at))
    .slice(0, 6);
  if (!entries.length) return <EmptyState icon={Clock3} title="No recent activity" description="Confirmed updates for your moves will appear here." />;
  return <ol className="space-y-3">{entries.map(({ move, event }, index) => <li key={`${move._id}-${event.event}-${event.at}-${index}`} className="flex min-w-0 gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Clock3 className="h-4 w-4" aria-hidden="true" /></span><div className="min-w-0"><p className="break-words text-sm font-semibold">{EVENT_LABELS[event.event] || "Move update"}</p><p className="mt-0.5 break-all text-xs text-slate-600 dark:text-slate-400">Move · {moveReference(move)}</p><time className="mt-1 block text-xs text-slate-500 dark:text-slate-500" dateTime={event.at}>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(event.at))}</time></div></li>)}</ol>;
}

export function MyOrders({ orders = [], pagination, page, onPageChange, loading = false, error = "", onRetry }) {
  const [activeTab, setActiveTab] = useState("bookings");
  const [selectedMove, setSelectedMove] = useState(null);
  const location = useLocation();

  useEffect(() => { if (location.hash === "#bookings") setActiveTab("bookings"); }, [location.hash]);

  const hasBookings = orders.length > 0 || (pagination?.total || 0) > 0;
  return (
    <>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
        <div role="tablist" aria-label="Customer bookings content" className="flex min-w-0 flex-wrap items-center gap-4">
          <button type="button" role="tab" aria-selected={activeTab === "bookings"} onClick={() => setActiveTab("bookings")} className={`min-h-10 border-b-2 px-1 text-sm font-semibold ${activeTab === "bookings" ? "border-blue-600 text-blue-700 dark:text-blue-300" : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"}`}>My Bookings</button>
          <button type="button" role="tab" aria-selected={activeTab === "activity"} onClick={() => setActiveTab("activity")} className={`min-h-10 border-b-2 px-1 text-sm font-semibold ${activeTab === "activity" ? "border-blue-600 text-blue-700 dark:text-blue-300" : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"}`}>Recent Activity</button>
        </div>
        <Link to="/dashboard/user#bookings" onClick={() => setActiveTab("bookings")} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-blue-300 dark:hover:bg-blue-950">View All <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>

      <div className="mt-4 min-w-0">
        {error ? <ErrorState title="Could not load your bookings" description={error} action={<button type="button" onClick={onRetry} className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">Retry</button>} /> : loading && !orders.length ? <LoadingSkeleton lines={4} className="py-2" /> : !hasBookings ? <EmptyState icon={ClipboardList} title="No bookings yet" description="When you plan a move, its schedule and updates will show up here." action={<Link to="/booking" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">Book a Move <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>} /> : activeTab === "activity" ? <ActivityList orders={orders} /> : <div className="space-y-3">{orders.map((move) => <BookingCard key={move._id} move={move} onViewDetails={setSelectedMove} />)}</div>}
      </div>
      {activeTab === "bookings" && !error && pagination && <div className="mt-4"><PaginationControls pagination={pagination} page={page} onPageChange={onPageChange} disabled={loading} label="My bookings pagination" /></div>}
      <BookingDetailsDialog move={selectedMove} onClose={() => setSelectedMove(null)} />
    </>
  );
}
