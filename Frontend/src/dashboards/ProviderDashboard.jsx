import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { providerService } from "../services/provider.service"; // Assuming a provider service exists

export function ProviderDashboard() {
  const [currentJob, setCurrentJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCurrentJob = async () => {
      try {
        // This endpoint needs to be created on the backend
        const data = await providerService.getCurrentJob(); 
        setCurrentJob(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentJob();
  }, []);

  if (loading) return <div>Loading provider dashboard...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Provider Dashboard
        </h1>
        <p className="text-sm text-gray-600">
          Manage your assigned moves
        </p>
      </div>

      {/* Current Job */}
      <div className="rounded-lg border bg-white p-5">
        <h2 className="font-semibold text-gray-900 mb-2">
          Current Job
        </h2>
        {currentJob ? (
          <div>
            <p className="text-sm text-gray-700">Order ID: {currentJob._id}</p>
            <p className="text-sm text-gray-700">Status: {currentJob.status}</p>
            <p className="text-sm text-gray-700">Pickup: {currentJob.pickup.address}, {currentJob.pickup.city}</p>
            <p className="text-sm text-gray-700">Dropoff: {currentJob.dropoff.address}, {currentJob.dropoff.city}</p>
            <p className="text-sm text-gray-700">Move Date: {new Date(currentJob.moveDate).toLocaleDateString()}</p>
            {/* Add more job details as needed */}
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            No active job assigned
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActionCard
          title="Available Moves"
          description="View and accept new jobs"
          to="/provider/available-moves"
        />
        <ActionCard
          title="My Jobs"
          description="Track your accepted jobs"
          to="/provider/my-jobs"
        />
      </div>

      {/* Earnings (later) */}
      <div className="rounded-lg border bg-white p-5">
        <h2 className="font-semibold text-gray-900 mb-2">
          Earnings
        </h2>
        <p className="text-sm text-gray-600">
          Earnings summary will appear here
        </p>
      </div>
    </div>
  );
}

function ActionCard({ title, description, to }) {
  return (
    <Link
      to={to}
      className="rounded-lg border bg-white p-5 hover:shadow transition"
    >
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </Link>
  );
}
