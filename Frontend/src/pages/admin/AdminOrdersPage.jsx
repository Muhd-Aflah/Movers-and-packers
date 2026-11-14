import { useCallback } from "react";
import { adminService } from "../../services/admin.service";
import { formatCurrency } from "../../utils/currency";
import { formatMoveDate } from "../../utils/moveDate";
import { getServiceModeLabel } from "../../utils/serviceMode";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { usePaginatedData } from "../../hooks/usePaginatedData";

export function AdminOrdersPage() {
  const fetchPage = useCallback((page) => adminService.getAllMovesPage(page), []);
  const { items: moves, loading, error, page, pagination, setPage } = usePaginatedData(fetchPage);

  if (loading && !pagination) return <div>Loading orders...</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">All Orders</h1>
      {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}

      {moves.length === 0 && error ? null : moves.length === 0 ? (
        <p>{loading ? "Loading orders..." : "No orders found."}</p>
      ) : (
        <div className="space-y-4">
          {moves.map((move) => (
            <div key={move._id} className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-md font-semibold">Order ID: {move._id}</p>
              <p className="text-sm text-gray-700">User: {move.user?.name} ({move.user?.email})</p>
              <p className="text-sm text-gray-700">Provider: {move.provider?.name || "Unassigned"}</p>
              <p className="text-sm text-gray-700">Service: {getServiceModeLabel(move)}</p>
              <p className="text-sm text-gray-700">Status: {move.status}</p>
              <p className="text-sm text-gray-700">Price: {formatCurrency(move.price, move.pricing?.currency)}</p>
              <p className="text-xs text-gray-500">Move Date: {formatMoveDate(move.moveDate)}</p>
            </div>
          ))}
        </div>
      )}
      {pagination && <PaginationControls pagination={pagination} page={page} onPageChange={setPage} disabled={loading} label="Moves pagination" />}
    </div>
  );
}
