import { useEffect, useState } from "react";
import { adminService } from "../../services/admin.service";

export function AdminOrdersPage() {
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMoves = async () => {
      try {
        const data = await adminService.getAllMoves();
        setMoves(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMoves();
  }, []);

  if (loading) return <div>Loading orders...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">All Orders</h1>

      {moves.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="space-y-4">
          {moves.map((move) => (
            <div key={move._id} className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-md font-semibold">Order ID: {move._id}</p>
              <p className="text-sm text-gray-700">User: {move.user?.name} ({move.user?.email})</p>
              <p className="text-sm text-gray-700">Provider: {move.provider?.name || "Unassigned"}</p>
              <p className="text-sm text-gray-700">Service: {move.service}</p>
              <p className="text-sm text-gray-700">Status: {move.status}</p>
              <p className="text-sm text-gray-700">Price: ₹{move.price?.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Move Date: {new Date(move.moveDate)?.toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}