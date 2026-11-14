import { formatCurrency } from "../utils/currency";
import { EmptyState } from "../components/ui/StatePanel";
import { StatusBadge } from "../components/ui/StatusBadge";
import { formatMoveDate } from "../utils/moveDate";
import { getServiceModeLabel } from "../utils/serviceMode";
import { PaginationControls } from "../components/ui/PaginationControls";
import { MoveTrackingTimeline } from "../components/moves/MoveTrackingTimeline";

export function MyOrders({ orders = [], pagination, page, onPageChange, loading = false, error = "" }) {
  // Empty first = realistic
  return (
    <div className="space-y-4">
      {error ? (
        <p role="alert" className="text-sm text-red-700">{error}</p>
      ) : orders?.length === 0 && loading ? (
        <p className="text-sm text-gray-500" aria-live="polite">Loading moves...</p>
      ) : orders?.length === 0 ? (
        <EmptyState title="No bookings yet" description="Create a booking to start your move." />
      ) : (
        <div className="space-y-3">
          {orders?.map((order) => (
            <article key={order._id} className="space-y-4 rounded-card border border-slate-200 bg-card p-4 shadow-sm dark:border-slate-700 sm:p-5">
              <p className="break-all text-md font-semibold">Order ID: {order._id}</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">Service: {getServiceModeLabel(order)}</p>
              <div className="mt-2"><StatusBadge status={order.status} /></div>
              <p className="text-sm text-slate-700 dark:text-slate-200">Price: {formatCurrency(order.price, order.pricing?.currency)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Move Date: {formatMoveDate(order.moveDate)}</p>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tracking</h3>
              <MoveTrackingTimeline events={order.trackingEvents || []} />
            </article>
          ))}
        </div>
      )}
      {pagination && <PaginationControls pagination={pagination} page={page} onPageChange={onPageChange} disabled={loading} label="Move history pagination" />}
    </div>
  );
}
