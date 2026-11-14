import { useCallback, useState } from "react";
import { providerService } from "../../services/provider.service";
import { formatMoveDate } from "../../utils/moveDate";
import { PaginationControls } from "../ui/PaginationControls";
import { usePaginatedData } from "../../hooks/usePaginatedData";

export function AvailableMoves() {
  const [acceptingId, setAcceptingId] = useState(null);
  const fetchPage = useCallback((page) => providerService.getAvailableMovesPage(page), []);
  const { items: moves, setItems: setMoves, loading, error, setError, page, pagination, setPage, reload } = usePaginatedData(fetchPage);

  async function acceptMove(id) {
    setAcceptingId(id);
    setError("");
    try {
      await providerService.acceptJob(id);
      setMoves((current) => current.filter((move) => move._id !== id));
      await reload();
    } catch (err) {
      setError(err.message || "Could not accept this move");
    } finally {
      setAcceptingId(null);
    }
  }

  if (loading && !pagination) return <p>Loading available jobs...</p>;
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Available Moves</h2>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {!error && !moves.length && <p className="text-gray-500">{loading ? "Loading available jobs..." : "No available jobs right now."}</p>}
      {moves.map((move) => (
        <article key={move._id} className="flex items-center justify-between gap-4 rounded-lg border bg-white p-4">
          <div>
            <p className="font-medium">
              {move.pickup?.city || move.pickup?.address || "Pickup"} → {move.dropoff?.city || move.dropoff?.address || "Dropoff"}
            </p>
            <p className="text-sm text-gray-500">
              {formatMoveDate(move.moveDate)}
            </p>
          </div>
          <button
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            disabled={acceptingId !== null}
            onClick={() => acceptMove(move._id)}
          >
            {acceptingId === move._id ? "Accepting..." : "Accept Job"}
          </button>
        </article>
      ))}
      {pagination && <PaginationControls pagination={pagination} page={page} onPageChange={setPage} disabled={loading || acceptingId !== null} label="Available moves pagination" />}
    </section>
  );
}
