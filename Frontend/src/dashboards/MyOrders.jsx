export function MyOrders() {
  // Empty first = realistic
  const orders = [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        My Orders
      </h2>

      {orders.length === 0 ? (
        <div className="rounded-lg border bg-white p-6 text-gray-600">
          You don’t have any bookings yet.
          <div className="mt-2">
            Create a booking to start your move.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id}>{order.service}</div>
          ))}
        </div>
      )}
    </div>
  );
}
