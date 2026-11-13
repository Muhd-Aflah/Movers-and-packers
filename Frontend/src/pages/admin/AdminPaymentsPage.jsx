import { useEffect, useState } from "react";
import { adminService } from "../../services/admin.service";
import { formatCurrency } from "../../utils/currency";

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    adminService.getAllPayments()
      .then((data) => active && setPayments(Array.isArray(data) ? data : []))
      .catch((err) => active && setError(err.message || "Could not load payments"))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  if (loading) return <div>Loading payments...</div>;
  if (error) return <div role="alert">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-bold">All Payments</h1>
      {payments.length === 0 ? (
        <p>No payments found.</p>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment._id} className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="font-semibold">Payment ID: {payment._id}</p>
              <p className="text-sm text-gray-700">
                User: {payment.user?.name || "Unknown"} ({payment.user?.email || "No email"})
              </p>
              <p className="text-sm text-gray-700">
                Move: {payment.move?._id || payment.move || "Unavailable"}
              </p>
              <p className="text-sm text-gray-700">Amount: {formatCurrency(payment.amount, payment.currency)}</p>
              <p className="text-sm text-gray-700">Status: {payment.paymentStatus}</p>
              <p className="text-xs text-gray-500">
                Date: {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : "Unknown"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
