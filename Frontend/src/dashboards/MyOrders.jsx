export function MyOrders({ orders }) {
  return (
    <div className="space-y-4">
      
      {orders?.length === 0 ? (
        <div className="rounded-lg border bg-white p-6 text-gray-600">
          You don’t have any bookings yet.
          <div className="mt-2">
            Create a booking to start your move.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {orders?.map((order) => (
            <div key={order._id} className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-md font-semibold">Order ID: {order._id}</p>
              <p className="text-sm text-gray-700">Service: {order.service}</p>
              <p className="text-sm text-gray-700">Status: {order.status}</p>
              <p className="text-sm text-gray-700">Price: ₹{order.price?.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Move Date: {new Date(order.moveDate)?.toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
