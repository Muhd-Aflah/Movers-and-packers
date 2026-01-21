import { useEffect, useState } from "react";
import { adminService } from "../../services/admin.service";

export function AdminProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const data = await adminService.getAllProviders();
        setProviders(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProviders();
  }, []);

  if (loading) return <div>Loading providers...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">All Providers</h1>

      {providers.length === 0 ? (
        <p>No providers found.</p>
      ) : (
        <div className="space-y-4">
          {providers.map((provider) => (
            <div key={provider._id} className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-md font-semibold">Name: {provider.name}</p>
              <p className="text-sm text-gray-700">Email: {provider.email}</p>
              <p className="text-sm text-gray-700">Status: {provider.status || "N/A"}</p>
              <p className="text-xs text-gray-500">Joined: {new Date(provider.createdAt)?.toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}