import { useCallback, useState } from "react";
import { providerService } from "../../services/provider.service";
import { PaginationControls } from "../ui/PaginationControls";
import { usePaginatedData } from "../../hooks/usePaginatedData";

function nextAction(job) {
  if (job.status === "accepted") return { value: { milestone: "pickup_started" }, label: "Confirm pickup / packing started" };
  if (job.status !== "in_progress") return null;
  const events = new Set((job.trackingEvents || []).map((event) => event.event));
  if (!events.has("in_transit")) return { value: { milestone: "in_transit" }, label: "Mark in transit" };
  return { value: { status: "completed" }, label: "Confirm delivery completed" };
}

export function ProviderJobs() {
  const [updatingId, setUpdatingId] = useState(null);
  const fetchPage = useCallback((page) => providerService.getMyJobsPage(page), []);
  const { items: jobs, setItems: setJobs, loading, error, setError, page, pagination, setPage } = usePaginatedData(fetchPage);

  async function advanceJob(job) {
    const transition = nextAction(job);
    if (!transition) return;
    setUpdatingId(job._id);
    setError("");
    try {
      const result = await providerService.updateJobStatus(job._id, transition.value);
      setJobs((current) => current.map((item) => item._id === job._id ? result.move : item));
    } catch (err) {
      setError(err.message || "Could not update job status");
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading && !pagination) return <p>Loading your jobs...</p>;
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">My Jobs</h2>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {!error && !jobs.length && <p className="text-gray-500">{loading ? "Loading your jobs..." : "No assigned jobs yet."}</p>}
      {jobs.map((job) => (
        <article key={job._id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-white p-4">
          <div>
            <p className="font-medium">{job.pickup?.city || job.pickup?.address || "Pickup"} → {job.dropoff?.city || job.dropoff?.address || "Dropoff"}</p>
            <p className="text-sm text-gray-500">Status: {job.status.replaceAll("_", " ")}</p>
            <p className="text-sm text-gray-500">Customer: {job.user?.name || "Unavailable"}</p>
          </div>
          {nextAction(job) && (
            <button
              className="min-h-11 rounded-control bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50 dark:focus-visible:ring-blue-400"
              disabled={updatingId !== null}
              onClick={() => advanceJob(job)}
            >
              {updatingId === job._id ? "Saving..." : nextAction(job).label}
            </button>
          )}
        </article>
      ))}
      {pagination && <PaginationControls pagination={pagination} page={page} onPageChange={setPage} disabled={loading || updatingId !== null} label="Assigned jobs pagination" />}
    </section>
  );
}
