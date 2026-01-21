import { useEffect, useState } from "react";
import { adminService } from "../../services/admin.service";

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const data = await adminService.getAllPayments();
        setPayments(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  if (loading) return <div>Loading payments...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">All Payments</h1>

      {payments.length === 0 ? (
        <p>No payments found.</p>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment._id} className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-md font-semibold">Payment ID: {payment._id}</p>
              <p className="text-sm text-gray-700">User: {payment.user?.name} ({payment.user?.email})</p>
              <p className="text-sm text-gray-700">Order: {payment.order?.service} (₹{payment.order?.price?.toLocaleString()})</p>
              <p className="text-sm text-gray-700">Amount: ₹{payment.amount?.toLocaleString()}</p>
              <p className="text-sm text-gray-700">Status: {payment.paymentStatus}</p>
              <p className="text-xs text-gray-500">Date: {new Date(payment.createdAt)?.toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}