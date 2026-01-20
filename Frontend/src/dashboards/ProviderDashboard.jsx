import { AvailableMoves } from "../components/provider/AvailableMoves";
export function ProviderDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Provider Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          View and accept available moving jobs.
        </p>
      </div>

      {/* Available jobs */}
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          Available Jobs
        </h2>

        <AvailableMoves />
      </section>
    </div>
  );
}
