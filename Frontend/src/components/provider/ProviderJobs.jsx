import { useEffect, useState } from "react";
import { providerService } from "../../services/provider.service";

const nextStatus = {
  accepted: { value: "in_progress", label: "Start move" },
  in_progress: { value: "completed", label: "Complete move" },
};

export function ProviderJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    let active = true;
    providerService
      .getMyJobs()
      .then((data) => active && setJobs(Array.isArray(data) ? data : []))
      .catch((err) => active && setError(err.message || "Could not load your jobs"))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  async function advanceJob(job) {
    const transition = nextStatus[job.status];
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

  if (loading) return <p>Loading your jobs...</p>;
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">My Jobs</h2>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {!jobs.length && <p className="text-gray-500">No assigned jobs yet.</p>}
      {jobs.map((job) => (
        <article key={job._id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-white p-4">
          <div>
            <p className="font-medium">{job.pickup?.city || job.pickup?.address || "Pickup"} → {job.dropoff?.city || job.dropoff?.address || "Dropoff"}</p>
            <p className="text-sm text-gray-500">Status: {job.status.replaceAll("_", " ")}</p>
            <p className="text-sm text-gray-500">Customer: {job.user?.name || "Unavailable"}</p>
          </div>
          {nextStatus[job.status] && (
            <button
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              disabled={updatingId !== null}
              onClick={() => advanceJob(job)}
            >
              {updatingId === job._id ? "Saving..." : nextStatus[job.status].label}
            </button>
          )}
        </article>
      ))}
    </section>
  );
}
