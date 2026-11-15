import { useCallback, useEffect, useRef, useState } from "react";
import { adminService } from "../../services/admin.service";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { usePaginatedData } from "../../hooks/usePaginatedData";
import { getMoverDecisionButtonState, runMoverDecision } from "./moverDecision";

const tabs = [
  { id: "pending", label: "Pending applications" },
  { id: "approved", label: "Approved movers" },
  { id: "rejected", label: "Rejected movers" },
];

export function AdminProvidersPage() {
  const [status, setStatus] = useState("pending");
  const [reasons, setReasons] = useState({});
  const [approvingMoverId, setApprovingMoverId] = useState(null);
  const [rejectingMoverId, setRejectingMoverId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedMover, setSelectedMover] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [detailsTarget, setDetailsTarget] = useState(null);
  const detailsRequestId = useRef(0);
  const detailsDialogRef = useRef(null);
  const detailsCloseRef = useRef(null);
  const detailsTriggerRef = useRef(null);

  const fetchPage = useCallback((page) => adminService.getMoversPage(status, page), [status]);
  const { items: movers, loading, error, page, pagination, setPage, reload: loadMovers } = usePaginatedData(fetchPage);

  useEffect(() => {
    if (!detailsOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDetails();
        return;
      }
      if (event.key !== "Tab" || !detailsDialogRef.current) return;

      const focusable = detailsDialogRef.current.querySelectorAll("button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex='-1'])");
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    detailsCloseRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [detailsOpen]);

  const closeDetails = () => {
    detailsRequestId.current += 1;
    setDetailsOpen(false);
    setDetailsLoading(false);
    setDetailsError("");
    setSelectedMover(null);
    setDetailsTarget(null);
    detailsTriggerRef.current?.focus();
  };

  const approve = async (mover) => {
    if (approvingMoverId === mover._id || rejectingMoverId === mover._id) return;
    if (!window.confirm(`Approve ${mover.name} as a SwiftMove mover?`)) return;
    await runMoverDecision({
      moverId: mover._id,
      setLoadingId: setApprovingMoverId,
      setError: setActionError,
      setMessage,
      request: () => adminService.approveMover(mover._id),
      refresh: loadMovers,
      successFallback: "Mover approved",
      errorFallback: "Could not approve mover",
    });
  };

  const reject = async (mover) => {
    if (approvingMoverId === mover._id || rejectingMoverId === mover._id) return;
    const reason = (reasons[mover._id] || "").trim();
    if (!reason) {
      setActionError(`Enter a rejection reason for ${mover.name}.`);
      setMessage("");
      return;
    }
    if (!window.confirm(`Reject ${mover.name}'s mover application?`)) return;
    await runMoverDecision({
      moverId: mover._id,
      setLoadingId: setRejectingMoverId,
      setError: setActionError,
      setMessage,
      request: () => adminService.rejectMover(mover._id, reason),
      refresh: loadMovers,
      successFallback: "Mover application rejected",
      errorFallback: "Could not reject mover",
    });
  };

  const viewDetails = async (mover) => {
    if (detailsLoading) return;
    const moverId = typeof mover?._id === "string" ? mover._id : "";
    const currentRequest = ++detailsRequestId.current;
    if (!detailsOpen) detailsTriggerRef.current = document.activeElement;
    setDetailsTarget(moverId ? mover : null);
    setDetailsOpen(true);
    setSelectedMover(null);
    setDetailsError("");
    setDetailsLoading(true);
    try {
      if (!moverId) throw new Error("This mover record has no valid ID. Refresh the verification list and try again.");
      const profile = await adminService.getMoverApplication(moverId);
      if (currentRequest !== detailsRequestId.current) return;
      if (!profile || typeof profile !== "object" || String(profile._id) !== moverId) {
        throw new Error("The mover profile response was incomplete. Please try again.");
      }
      setSelectedMover(profile);
    } catch (requestError) {
      if (currentRequest === detailsRequestId.current) {
        setDetailsError(requestError.message || "Could not load mover profile");
      }
    } finally {
      if (currentRequest === detailsRequestId.current) setDetailsLoading(false);
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
            onClick={() => { setStatus(tab.id); setPage(1); setMessage(""); setActionError(""); }}
            className={`rounded px-3 py-2 text-sm font-medium ${status === tab.id ? "bg-indigo-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {(actionError || error) && <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{actionError || error}</p>}
      {message && <p role="status" className="mb-4 rounded bg-green-50 p-3 text-sm text-green-700">{message}</p>}
      {loading ? (
        <p className="py-6 text-sm text-gray-500">Loading mover accounts…</p>
      ) : movers.length === 0 && !error ? (
        <p className="py-6 text-sm text-gray-500">No {status} mover accounts.</p>
      ) : (
        <div className="space-y-4">
          {movers.map((mover) => {
            const approveButton = getMoverDecisionButtonState("approve", mover._id, approvingMoverId, rejectingMoverId);
            const rejectButton = getMoverDecisionButtonState("reject", mover._id, approvingMoverId, rejectingMoverId);
            return (
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
              <button type="button" disabled={detailsLoading} onClick={(event) => { detailsTriggerRef.current = event.currentTarget; viewDetails(mover); }} className="mt-3 min-h-11 rounded px-2 text-sm font-medium text-indigo-700 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:cursor-wait disabled:opacity-60 dark:text-indigo-300 dark:focus-visible:ring-indigo-300">
                {detailsLoading && detailsTarget?._id === mover._id ? "Loading profile…" : "View profile details"}
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
                    <button type="button" disabled={approveButton.disabled} onClick={() => approve(mover)} className="rounded bg-green-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                      {approveButton.label}
                    </button>
                    <button type="button" disabled={rejectButton.disabled} onClick={() => reject(mover)} className="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                      {rejectButton.label}
                    </button>
                  </div>
                </div>
              )}
            </article>
            );
          })}
        </div>
      )}

      {pagination && <PaginationControls pagination={pagination} page={page} onPageChange={setPage} disabled={loading} label="Mover applications pagination" />}

      {detailsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDetails(); }}>
          <section ref={detailsDialogRef} role="dialog" aria-modal="true" aria-labelledby="mover-profile-title" aria-busy={detailsLoading} className="max-h-[min(85vh,48rem)] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="mover-profile-title" className="text-lg font-semibold">Mover profile details</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{selectedMover?.name || "Application details"}</p>
              </div>
              <button ref={detailsCloseRef} type="button" onClick={closeDetails} className="min-h-11 shrink-0 rounded px-3 text-sm font-medium text-slate-700 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-slate-200 dark:focus-visible:ring-indigo-300">Close</button>
            </div>

            {detailsLoading && <p role="status" className="mt-5 text-sm text-slate-600 dark:text-slate-300">Loading mover profile…</p>}
            {detailsError && <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{detailsError}</div>}
            {!detailsLoading && !detailsError && selectedMover && (
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div className="min-w-0"><dt className="font-medium text-slate-600 dark:text-slate-300">Name</dt><dd className="break-words">{selectedMover.name || "Not provided"}</dd></div>
                <div className="min-w-0"><dt className="font-medium text-slate-600 dark:text-slate-300">Email</dt><dd className="break-words">{selectedMover.email || "Not provided"}</dd></div>
                <div><dt className="font-medium text-slate-600 dark:text-slate-300">Phone</dt><dd>{selectedMover.phone || "Not provided"}</dd></div>
                <div><dt className="font-medium text-slate-600 dark:text-slate-300">Status</dt><dd className="capitalize">{selectedMover.moverApprovalStatus || "pending"}</dd></div>
                <div><dt className="font-medium text-slate-600 dark:text-slate-300">Joined</dt><dd>{selectedMover.createdAt ? new Date(selectedMover.createdAt).toLocaleString() : "Unavailable"}</dd></div>
                {selectedMover.moverReviewedBy && <div><dt className="font-medium text-slate-600 dark:text-slate-300">Reviewed by</dt><dd>{selectedMover.moverReviewedBy.name || selectedMover.moverReviewedBy.email || "Admin"}</dd></div>}
                {selectedMover.moverReviewedAt && <div><dt className="font-medium text-slate-600 dark:text-slate-300">Reviewed on</dt><dd>{new Date(selectedMover.moverReviewedAt).toLocaleString()}</dd></div>}
                {selectedMover.moverReviewReason && <div className="sm:col-span-2"><dt className="font-medium text-slate-600 dark:text-slate-300">Review reason</dt><dd className="break-words">{selectedMover.moverReviewReason}</dd></div>}
              </dl>
            )}

            {detailsError && (
              <button type="button" disabled={detailsLoading || !detailsTarget} onClick={() => detailsTarget && viewDetails(detailsTarget)} className="mt-4 min-h-11 rounded bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-60 dark:bg-indigo-400 dark:text-slate-950 dark:hover:bg-indigo-300">
                Try again
              </button>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
