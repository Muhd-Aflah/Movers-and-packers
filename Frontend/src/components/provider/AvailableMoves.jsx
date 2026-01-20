import { useEffect, useState } from "react";
import { getAuthFromStorage } from "../../utils/auth";

export function AvailableMoves() {
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMoves = async () => {
      const { token } = getAuthFromStorage();

      const res = await fetch("/api/moves/available", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setMoves(data);
      setLoading(false);
    };

    fetchMoves();
  }, []);

  if (loading) return <p>Loading available jobs...</p>;

  if (!moves.length) {
    return <p className="text-gray-500">No available jobs right now.</p>;
  }

  return (
    <div className="space-y-4">
      {moves.map((move) => (
        <div
          key={move._id}
          className="rounded-lg border p-4 flex justify-between items-center"
        >
          <div>
            <p className="font-medium">
              {move.pickup.city} → {move.dropoff.city}
            </p>
            <p className="text-sm text-gray-500">
              {new Date(move.moveDate).toDateString()}
            </p>
          </div>

          <button
            className="rounded-md bg-blue-600 px-4 py-2 text-white text-sm"
            onClick={() => acceptMove(move._id)}
          >
            Accept Job
          </button>
        </div>
      ))}
    </div>
  );

  async function acceptMove(id) {
    const { token } = getAuthFromStorage();

    await fetch(`/api/moves/${id}/accept`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setMoves((prev) => prev.filter((m) => m._id !== id));
  }
}
