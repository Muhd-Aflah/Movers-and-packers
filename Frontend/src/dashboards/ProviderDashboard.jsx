import { Truck, MapPin, PlayCircle, CheckCircle } from "lucide-react";

function JobCard({ icon: Icon, title, value }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-2 text-gray-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function ProviderDashboard() {
  // Dummy job data (MongoDB-ready)
  const job = {
    status: "Not started",
    address: "No job assigned",
    date: "Today",
  };

  return (
    <div className="space-y-6">
      {/* Job info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <JobCard icon={Truck} title="Job Status" value={job.status} />
        <JobCard icon={MapPin} title="Pickup Address" value={job.address} />
        <JobCard icon={Truck} title="Scheduled" value={job.date} />
      </div>

      {/* Actions */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Actions</h2>

        <div className="mt-4 flex gap-3">
          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <PlayCircle className="h-4 w-4" />
            Start Job
          </button>

          <button className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <CheckCircle className="h-4 w-4" />
            Complete Job
          </button>
        </div>
      </div>

      {/* Info message */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-600">
          This dashboard shows today’s assigned job for the provider. Job data
          is static for now and can be connected to MongoDB later.
        </p>
      </div>
    </div>
  );
}
