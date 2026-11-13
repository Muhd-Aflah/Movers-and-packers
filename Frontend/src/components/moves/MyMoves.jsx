import { useEffect, useState } from "react";
import { MyMoveCard } from "./MyMoveCard";
import { apiRequest } from "../../services/api";

export function MyMoves() {
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMoves = async () => {
      try {
        const data = await apiRequest("/api/moves/my");
        setMoves(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to load moves");
      } finally {
        setLoading(false);
      }
    };

    fetchMoves();
  }, []);

  if (loading) {
    return <p className="text-gray-500">Loading moves...</p>;
  }

  if (error) return <p role="alert" className="text-red-600">{error}</p>;

  if (!moves.length) {
    return <p className="text-gray-500">No moves yet.</p>;
  }

  return (
    <div className="space-y-4">
      {moves.map((move) => (
        <MyMoveCard key={move._id} move={move} />
      ))}
    </div>
  );
}
