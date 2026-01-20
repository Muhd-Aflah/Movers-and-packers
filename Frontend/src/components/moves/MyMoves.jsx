import { useEffect, useState } from "react";
import { MyMoveCard } from "./MyMoveCard";
import { getAuthFromStorage } from "../../utils/auth";

export function MyMoves() {
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMoves = async () => {
      try {
        const { token } = getAuthFromStorage();

        const res = await fetch("/api/moves/my", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setMoves(data);
      } catch (err) {
        console.error("Failed to load moves");
      } finally {
        setLoading(false);
      }
    };

    fetchMoves();
  }, []);

  if (loading) {
    return <p className="text-gray-500">Loading moves...</p>;
  }

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
