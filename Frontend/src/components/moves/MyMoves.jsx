import { useCallback } from "react";
import { MyMoveCard } from "./MyMoveCard";
import { getMyMovesPage } from "../../services/booking.service";
import { PaginationControls } from "../ui/PaginationControls";
import { usePaginatedData } from "../../hooks/usePaginatedData";

export function MyMoves() {
  const fetchPage = useCallback((page) => getMyMovesPage(page), []);
  const { items: moves, pagination, page, setPage, loading, error } = usePaginatedData(fetchPage);

  if (loading && !pagination) {
    return <p className="text-gray-500">Loading moves...</p>;
  }

  if (error) return <p role="alert" className="text-red-600">{error}</p>;

  if (!moves.length && !pagination?.total) {
    return <p className="text-gray-500">No moves yet.</p>;
  }

  return (
    <div className="space-y-4">
      {moves.map((move) => <MyMoveCard key={move._id} move={move} />)}
      {pagination && <PaginationControls pagination={pagination} page={page} onPageChange={setPage} disabled={loading} label="Move history pagination" />}
    </div>
  );
}
