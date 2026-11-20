import { useCallback } from "react";
import { adminService } from "../../services/admin.service";
import { formatCurrency } from "../../utils/currency";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { usePaginatedData } from "../../hooks/usePaginatedData";
import { useSocketEvents } from "../../hooks/useSocketEvents";

const PAYMENT_EVENTS = ["payment:initiated", "payment:success", "payment:failed", "payment:refunded"];

export function AdminPaymentsPage() {
  const fetchPage = useCallback((page) => adminService.getAllPaymentsPage(page), []);
  const { items: payments, loading, error, page, pagination, setPage, refresh } = usePaginatedData(fetchPage);
  useSocketEvents(PAYMENT_EVENTS, () => refresh(), () => refresh(), { coalesceMs: 50 });

  if (loading && !pagination) return <div>Loading payments...</div>;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-bold">All Payments</h1>
      {error && <p role="alert" className="mb-4 text-red-700">Error: {error}</p>}
      <p className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-100">
        The status below is SwiftMove’s payment record. Refunds made in Razorpay are not synchronized automatically; verify refund status in Razorpay before treating a payment as settled.
      </p>
      {payments.length === 0 && error ? null : payments.length === 0 ? (
        <p>{loading ? "Loading payments..." : "No payments found."}</p>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment._id} className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="font-semibold">Payment ID: {payment._id}</p>
              <p className="text-sm text-gray-700">
                User: {payment.user?.name || "Unknown"} ({payment.user?.email || "No email"})
              </p>
              <p className="text-sm text-gray-700">
                Move: {payment.move?._id || payment.move || "Unavailable"}
              </p>
              <p className="text-sm text-gray-700">Amount: {formatCurrency(payment.amount, payment.currency)}</p>
              <p className="text-sm text-gray-700">SwiftMove payment record: {payment.paymentStatus}</p>
              <p className="text-sm text-amber-800 dark:text-amber-200">Razorpay refund state: not synchronized; verify in Razorpay.</p>
              <p className="text-xs text-gray-500">
                Date: {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : "Unknown"}
              </p>
            </div>
          ))}
        </div>
      )}
      {pagination && <PaginationControls pagination={pagination} page={page} onPageChange={setPage} disabled={loading} label="Payments pagination" />}
    </div>
  );
}
