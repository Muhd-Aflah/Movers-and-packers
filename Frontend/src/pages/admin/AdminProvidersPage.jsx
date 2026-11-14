import { useCallback, useState } from "react";
import { adminService } from "../../services/admin.service";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { usePaginatedData } from "../../hooks/usePaginatedData";

const tabs = [
  { id: "pending", label: "Pending applications" },
  { id: "approved", label: "Approved movers" },
  { id: "rejected", label: "Rejected movers" },
];

export function AdminProvidersPage() {
  const [status, setStatus] = useState("pending");
  const [reasons, setReasons] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");
  const [selectedMover, setSelectedMover] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchPage = useCallback((page) => adminService.getMoversPage(status, page), [status]);
  const { items: movers, loading, error, setError, page, pagination, setPage, reload: loadMovers } = usePaginatedData(fetchPage);

  const approve = async (mover) => {
    if (!window.confirm(`Approve ${mover.name} as a SwiftMove mover?`)) return;
    setBusyId(mover._id);
    setError("");
    setMessage("");
    try {
      const result = await adminService.approveMover(mover._id);
      setMessage(result.message || "Mover approved");
      await loadMovers();
    } catch (requestError) {
      setError(requestError.message || "Could not approve mover");
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (mover) => {
    const reason = (reasons[mover._id] || "").trim();
    if (!reason) {
      setError(`Enter a rejection reason for ${mover.name}.`);
      return;
    }
    if (!window.confirm(`Reject ${mover.name}'s mover application?`)) return;
    setBusyId(mover._id);
    setError("");
    setMessage("");
    try {
      const result = await adminService.rejectMover(mover._id, reason);
      setMessage(result.message || "Mover application rejected");
      await loadMovers();
    } catch (requestError) {
      setError(requestError.message || "Could not reject mover");
    } finally {
      setBusyId(null);
    }
  };

  const viewDetails = async (mover) => {
    setDetailsLoading(true);
    setError("");
    try {
      setSelectedMover(await adminService.getMoverApplication(mover._id));
    } catch (requestError) {
      setError(requestError.message || "Could not load mover profile");
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">Mover verification</h2>
        <p className="mt-1 text-sm text-gray-600">Review each mover account before enabling job access.</p>
      </div>

      <div role="tablist" aria-label="Mover approval status" className="mb-5 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={status === tab.id}
            onClick={() => { setStatus(tab.id); setPage(1); setMessage(""); setError(""); }}
            className={`rounded px-3 py-2 text-sm font-medium ${status === tab.id ? "bg-indigo-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="mb-4 rounded bg-green-50 p-3 text-sm text-green-700">{message}</p>}
      {loading ? (
        <p className="py-6 text-sm text-gray-500">Loading mover accounts…</p>
      ) : movers.length === 0 && !error ? (
        <p className="py-6 text-sm text-gray-500">No {status} mover accounts.</p>
      ) : (
        <div className="space-y-4">
          {movers.map((mover) => (
            <article key={mover._id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{mover.name}</h3>
                  <p className="text-sm text-gray-700">{mover.email}</p>
                  {mover.phone && <p className="text-sm text-gray-700">Phone: {mover.phone}</p>}
                  <p className="mt-1 text-xs text-gray-500">Applied: {mover.createdAt ? new Date(mover.createdAt).toLocaleDateString() : "Date unavailable"}</p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold capitalize text-gray-700">
                  {mover.moverApprovalStatus || "pending"}
                </span>
              </div>
              <button type="button" onClick={() => viewDetails(mover)} className="mt-3 text-sm font-medium text-indigo-700 underline">
                View profile details
              </button>

              {mover.moverReviewReason && (
                <p className="mt-3 rounded bg-gray-50 p-3 text-sm text-gray-700">
                  <strong>Review reason:</strong> {mover.moverReviewReason}
                </p>
              )}
              {mover.moverReviewedBy && (
                <p className="mt-2 text-xs text-gray-500">
                  Reviewed by {mover.moverReviewedBy.name || mover.moverReviewedBy.email || "admin"}
                  {mover.moverReviewedAt ? ` on ${new Date(mover.moverReviewedAt).toLocaleString()}` : ""}
                </p>
              )}

              {status === "pending" && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700" htmlFor={`reason-${mover._id}`}>
                    Rejection reason (required to reject)
                  </label>
                  <textarea
                    id={`reason-${mover._id}`}
                    maxLength={500}
                    rows={2}
                    value={reasons[mover._id] || ""}
                    onChange={(event) => setReasons((current) => ({ ...current, [mover._id]: event.target.value }))}
                    className="w-full rounded border p-2 text-sm"
                    placeholder="Explain why this application cannot be approved"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={busyId === mover._id} onClick={() => approve(mover)} className="rounded bg-green-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                      {busyId === mover._id ? "Saving…" : "Approve mover"}
                    </button>
                    <button type="button" disabled={busyId === mover._id} onClick={() => reject(mover)} className="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                      Reject application
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {detailsLoading && <p className="mt-4 text-sm text-gray-500">Loading mover profile…</p>}
      {pagination && <PaginationControls pagination={pagination} page={page} onPageChange={setPage} disabled={loading} label="Mover applications pagination" />}

      {selectedMover && (
        <aside className="mt-5 rounded-lg border border-indigo-200 bg-indigo-50 p-4" aria-live="polite">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-indigo-950">Profile details: {selectedMover.name}</h3>
            <button type="button" onClick={() => setSelectedMover(null)} className="text-sm text-indigo-800 underline">Close</button>
          </div>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="font-medium">Email</dt><dd>{selectedMover.email}</dd></div>
            <div><dt className="font-medium">Phone</dt><dd>{selectedMover.phone || "Not provided"}</dd></div>
            <div><dt className="font-medium">Status</dt><dd className="capitalize">{selectedMover.moverApprovalStatus}</dd></div>
            <div><dt className="font-medium">Joined</dt><dd>{selectedMover.createdAt ? new Date(selectedMover.createdAt).toLocaleString() : "Unavailable"}</dd></div>
            {selectedMover.moverReviewReason && <div className="sm:col-span-2"><dt className="font-medium">Review reason</dt><dd>{selectedMover.moverReviewReason}</dd></div>}
          </dl>
        </aside>
      )}
    </section>
  );
}
