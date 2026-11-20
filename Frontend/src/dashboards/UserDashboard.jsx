import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, CalendarDays, MapPin, Package, Sparkles, Truck } from "lucide-react";
import { DashboardCards } from "./DashboardCards";
import { MyOrders } from "./MyOrders";
import { BalanceDashboard } from "./BalanceDashboard";
import { dashboardService } from "../services/dashboard.service";
import { getMyMovesPage } from "../services/booking.service";
import { getMyPaymentsPage } from "../services/payment.service";
import { usePaginatedData } from "../hooks/usePaginatedData";
import { ErrorState, LoadingSkeleton } from "../components/ui/StatePanel";
import { formatCurrency } from "../utils/currency";
import { formatMoveDate } from "../utils/moveDate";
import { getServiceModeLabel } from "../utils/serviceMode";
import { getAuthFromStorage } from "../utils/auth";
import { getIndiaToday } from "../components/booking/bookingContract";
import { summarizeCustomerMoves } from "./customerDashboardModel";
import { useSocketEvents } from "../hooks/useSocketEvents";
import { useSocketFallbackPolling } from "../hooks/useSocketFallbackPolling";
import { CUSTOMER_DASHBOARD_EVENTS } from "../realtime/events";
import { useSocket } from "../context/SocketContext";

const vehicleNames = {
  three_wheeler_eeco: "3-Wheeler / Eeco",
  tata_ace: "Tata Ace",
  pickup_bolero: "Pickup / Bolero",
  tata_407_14ft: "Tata 407 · 14 ft",
  truck_17ft: "17-ft Truck",
  truck_20_32ft: "20–32-ft Truck",
};

const greeting = () => {
  const hour = Number(new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
};

function movePlace(value, fallback) {
  if (typeof value === "string") return value;
  return value?.city || value?.address || fallback;
}

function UpcomingMove({ move }) {
  if (!move) {
    return (
      <div className="flex min-h-48 min-w-0 flex-col justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><CalendarDays className="h-5 w-5" aria-hidden="true" /></div>
        <h3 className="font-semibold">No upcoming move</h3>
        <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-400">Your next scheduled move will appear here.</p>
        <Link to="/booking" className="mt-4 inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Plan a move <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
    );
  }

  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">Next move</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">{formatMoveDate(move.moveDate)}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300"><StatusText move={move} /></p>
      <div className="my-4 space-y-3 border-y border-slate-100 py-4 dark:border-slate-800">
        <div className="flex gap-2.5 text-sm"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" /><p className="min-w-0 break-words text-slate-700 dark:text-slate-300"><span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Pickup</span>{movePlace(move.pickup, "Pickup location unavailable")}</p></div>
        <div className="flex gap-2.5 text-sm"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" aria-hidden="true" /><p className="min-w-0 break-words text-slate-700 dark:text-slate-300"><span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Delivery</span>{movePlace(move.dropoff, "Delivery location unavailable")}</p></div>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-400"><Truck className="h-4 w-4" aria-hidden="true" /><span>{vehicleNames[move.vehicleType] || "Vehicle unavailable"}</span><span aria-hidden="true">·</span><span>{getServiceModeLabel(move)}</span></div>
      <Link to="/dashboard/user#bookings" className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800">See in My Bookings</Link>
    </article>
  );
}

function StatusText({ move }) {
  return <span className="capitalize">{String(move.status || "Scheduled").replaceAll("_", " ")}</span>;
}

function EstimateAction({ moves }) {
  if (!moves?.length) return null;
  const move = moves[0];
  return (
    <article className="min-w-0 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-100">
      <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"><Package className="h-4 w-4" aria-hidden="true" /></span><div className="min-w-0"><h3 className="font-semibold">Estimate needs your review</h3><p className="mt-1 text-sm leading-5 text-amber-900/80 dark:text-amber-100/80">An updated estimate is ready for this move.</p></div></div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-amber-200 pt-3 text-sm dark:border-amber-900"><span className="break-all font-semibold">Move · {String(move._id || "").slice(-8).toUpperCase() || "ID unavailable"}</span><span className="font-bold">{Number.isFinite(move.price) ? formatCurrency(move.price, move.pricing?.currency) : "Estimate ready"}</span></div>
      <Link to={`/payment?moveId=${encodeURIComponent(move._id)}`} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Review Estimate</Link>
      {moves.length > 1 && <p className="mt-2 text-xs text-amber-900/80 dark:text-amber-100/80">{moves.length - 1} more estimate{moves.length === 2 ? "" : "s"} need review.</p>}
    </article>
  );
}

function BookingBanner() {
  return (
    <section className="relative isolate overflow-hidden rounded-2xl bg-blue-700 px-5 py-5 text-white shadow-sm sm:px-7 sm:py-6 lg:px-8">
      <div className="relative z-10 max-w-xl xl:max-w-[56%]">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-100"><Sparkles className="h-4 w-4" aria-hidden="true" />SwiftMove planning</p>
        <h2 className="mt-1.5 text-xl font-extrabold tracking-tight sm:text-2xl">Planning a move?</h2>
        <p className="mt-1.5 max-w-md text-sm leading-5 text-blue-100">Get a clear route-based estimate for your home or office move.</p>
        <Link to="/booking" className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700">Book a Move <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-[40%] items-center justify-center xl:flex">
        <div className="relative flex h-24 w-52 items-center justify-center rounded-[1.5rem] bg-blue-600/70">
          <div className="absolute bottom-4 left-6 right-6 h-1 rounded-full bg-blue-200/70" />
          <Package className="absolute right-8 top-3 h-9 w-9 rotate-6 rounded-lg bg-amber-300 p-2 text-amber-900 shadow" />
          <Truck className="relative z-10 h-16 w-28 stroke-[1.4] text-white drop-shadow" />
          <span className="absolute bottom-1 left-10 h-4 w-4 rounded-full border-4 border-slate-900 bg-blue-100" />
          <span className="absolute bottom-1 right-10 h-4 w-4 rounded-full border-4 border-slate-900 bg-blue-100" />
        </div>
      </div>
    </section>
  );
}

export function UserDashboard() {
  const [statsState, setStatsState] = useState({ status: "loading", data: null, error: "" });
  const [summaryState, setSummaryState] = useState({ status: "loading", data: null, error: "" });
  const [statsRetry, setStatsRetry] = useState(0);
  const [summaryRetry, setSummaryRetry] = useState(0);
  const fetchMoves = useCallback((page) => getMyMovesPage(page), []);
  const fetchPayments = useCallback((page) => getMyPaymentsPage(page), []);
  const moves = usePaginatedData(fetchMoves);
  const payments = usePaginatedData(fetchPayments);
  const { socket, connected: socketConnected } = useSocket();
  const summaryRequestId = useRef(0);
  const refreshInFlight = useRef(false);
  const refreshPending = useRef(false);
  const refreshTimer = useRef(null);
  const lastRefreshAt = useRef(0);
  const dashboardMounted = useRef(false);
  const authUser = getAuthFromStorage().user;
  const firstName = authUser?.name?.trim().split(/\s+/)[0] || "there";

  useEffect(() => {
    let active = true;
    setStatsState({ status: "loading", data: null, error: "" });
    dashboardService.getUserDashboard()
      .then((data) => { if (active) setStatsState({ status: "success", data: data.stats || {}, error: "" }); })
      .catch((error) => { if (active) setStatsState({ status: "error", data: null, error: error.message || "Could not load your booking statistics." }); });
    return () => { active = false; };
  }, [statsRetry]);

  const loadMoveSummary = useCallback(async () => {
    const firstPage = await getMyMovesPage(1, 50);
    const allMoves = Array.isArray(firstPage?.data) ? [...firstPage.data] : [];
    const totalPages = Number.isSafeInteger(firstPage?.pagination?.totalPages) ? firstPage.pagination.totalPages : 1;
    for (let firstPageNumber = 2; firstPageNumber <= totalPages; firstPageNumber += 4) {
      const pages = Array.from({ length: Math.min(4, totalPages - firstPageNumber + 1) }, (_, index) => firstPageNumber + index);
      const results = await Promise.all(pages.map((page) => getMyMovesPage(page, 50)));
      for (const result of results) {
        if (!Array.isArray(result?.data)) throw new Error("The move list response was incomplete.");
        allMoves.push(...result.data);
      }
    }
    return summarizeCustomerMoves(allMoves, getIndiaToday());
  }, []);

  useEffect(() => {
    dashboardMounted.current = true;
    return () => {
      dashboardMounted.current = false;
      window.clearTimeout(refreshTimer.current);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const requestId = ++summaryRequestId.current;
    setSummaryState({ status: "loading", data: null, error: "" });
    loadMoveSummary()
      .then((data) => {
        if (active && requestId === summaryRequestId.current) setSummaryState({ status: "success", data, error: "" });
      })
      .catch((error) => {
        if (active && requestId === summaryRequestId.current) setSummaryState({ status: "error", data: null, error: error.message || "Could not load your move summary." });
      });
    return () => { active = false; };
  }, [loadMoveSummary, summaryRetry]);

  const refreshCustomerMoves = useCallback(async (force = false) => {
    if (!dashboardMounted.current || document.visibilityState === "hidden") return;
    const now = Date.now();
    if (moves.loading) {
      refreshPending.current = true;
      return;
    }
    if (refreshInFlight.current) {
      if (now - lastRefreshAt.current >= 1000) refreshPending.current = true;
      return;
    }
    // Visibility and focus can fire together on mobile browsers and WebViews.
    if (!force && now - lastRefreshAt.current < 1000) return;
    lastRefreshAt.current = now;
    refreshPending.current = false;
    refreshInFlight.current = true;
    const requestId = ++summaryRequestId.current;
    try {
      const [summary] = await Promise.all([loadMoveSummary(), moves.refresh()]);
      if (dashboardMounted.current && requestId === summaryRequestId.current) {
        setSummaryState({ status: "success", data: summary, error: "" });
      }
    } catch {
      // Keep the last displayed data during transient event or polling failures.
    } finally {
      refreshInFlight.current = false;
      if (refreshPending.current && dashboardMounted.current && document.visibilityState === "visible") {
        refreshPending.current = false;
        refreshTimer.current = window.setTimeout(() => refreshCustomerMoves(true), 0);
      }
    }
  }, [loadMoveSummary, moves.loading, moves.refresh]);

  useEffect(() => {
    if (!moves.loading && refreshPending.current && document.visibilityState === "visible") {
      refreshPending.current = false;
      refreshCustomerMoves();
    }
  }, [moves.loading, refreshCustomerMoves]);

  const onRealtimeUpdate = useCallback(() => refreshCustomerMoves(), [refreshCustomerMoves]);
  useSocketEvents(CUSTOMER_DASHBOARD_EVENTS, onRealtimeUpdate, onRealtimeUpdate);
  useSocketFallbackPolling({
    connected: Boolean(socket && socketConnected),
    enabled: !moves.loading && summaryState.status !== "loading",
    refresh: refreshCustomerMoves,
  });

  const upcomingMove = summaryState.data?.upcomingMove;
  const actionMoves = summaryState.data?.actionRequiredMoves || [];

  return (
    <div className="mx-auto min-w-0 w-full max-w-[1600px] space-y-5 sm:space-y-6">
      <header className="flex min-w-0 flex-wrap items-end justify-between gap-3">
        <div className="min-w-0"><p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Your customer portal</p><h1 className="mt-1 break-words text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">{greeting()}, {firstName}</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Manage your bookings, estimates, and payments in one place.</p></div>
      </header>

      <BookingBanner />

      {statsState.status === "error" && <ErrorState title="Booking totals are unavailable" description={statsState.error} action={<button type="button" onClick={() => setStatsRetry((value) => value + 1)} className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">Retry</button>} />}
      {summaryState.status === "error" && <ErrorState title="Move summary is unavailable" description={summaryState.error} action={<button type="button" onClick={() => setSummaryRetry((value) => value + 1)} className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">Retry</button>} />}

      <DashboardCards
        stats={statsState.data || {}}
        summary={summaryState.data || {}}
        statsLoading={statsState.status === "loading"}
        summaryLoading={summaryState.status === "loading" || summaryState.status === "error"}
      />

      <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.9fr)] xl:gap-6">
        <section id="bookings" className="min-w-0 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <MyOrders
            orders={moves.items}
            pagination={moves.pagination}
            page={moves.page}
            onPageChange={moves.setPage}
            loading={moves.loading}
            error={moves.error}
            onRetry={moves.reload}
          />
        </section>

        <aside className="min-w-0 space-y-4">
          <section className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-display text-lg font-bold">Upcoming move</h2><Activity className="h-4 w-4 text-blue-600 dark:text-blue-300" aria-hidden="true" /></div>
            {summaryState.status === "loading" ? <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900" aria-busy="true"><LoadingSkeleton lines={4} /></div> : summaryState.status === "error" ? <p className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">Retry the move summary to see your next scheduled booking.</p> : <UpcomingMove move={upcomingMove} />}
          </section>

          {summaryState.status === "success" && actionMoves.length > 0 && <EstimateAction moves={actionMoves} />}

          <section aria-labelledby="payments-title" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <h2 id="payments-title" className="mb-3 font-display text-lg font-bold">My Payments</h2>
            <BalanceDashboard
              payments={payments.items}
              pagination={payments.pagination}
              page={payments.page}
              onPageChange={payments.setPage}
              loading={payments.loading}
              error={payments.error}
              onRetry={payments.reload}
              compact
            />
          </section>
        </aside>
      </div>
    </div>
  );
}
