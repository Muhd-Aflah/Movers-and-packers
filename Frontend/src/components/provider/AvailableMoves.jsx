import { useEffect, useState } from "react";
import { providerService } from "../../services/provider.service";

export function AvailableMoves() {
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acceptingId, setAcceptingId] = useState(null);

  useEffect(() => {
    let active = true;
    providerService
      .getAvailableMoves()
      .then((data) => active && setMoves(Array.isArray(data) ? data : []))
      .catch((err) => active && setError(err.message || "Could not load available moves"))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  async function acceptMove(id) {
    setAcceptingId(id);
    setError("");
    try {
      await providerService.acceptJob(id);
      setMoves((current) => current.filter((move) => move._id !== id));
    } catch (err) {
      setError(err.message || "Could not accept this move");
    } finally {
      setAcceptingId(null);
    }
  }

  if (loading) return <p>Loading available jobs...</p>;
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Available Moves</h2>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {!moves.length && <p className="text-gray-500">No available jobs right now.</p>}
      {moves.map((move) => (
        <article key={move._id} className="flex items-center justify-between gap-4 rounded-lg border bg-white p-4">
          <div>
            <p className="font-medium">
              {move.pickup?.city || move.pickup?.address || "Pickup"} → {move.dropoff?.city || move.dropoff?.address || "Dropoff"}
            </p>
            <p className="text-sm text-gray-500">
              {move.moveDate ? new Date(move.moveDate).toLocaleDateString() : "Date not set"}
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
    </section>
  );
}
