import { useCallback, useEffect, useRef, useState } from "react";
import { adminService } from "../../services/admin.service";
import { formatCurrency } from "../../utils/currency";
import { PaginationControls } from "../../components/ui/PaginationControls";

const PAGE_SIZE = "20";
const statusOptions = ["pending_review", "resolved", "failed", "refunded", "credited", "all"];
const titleFor = (status) => status.replaceAll("_", " ");

const formatMinorAmount = (amount, currency) => {
  const digits = new Intl.NumberFormat("en", { style: "currency", currency: currency || "INR" }).resolvedOptions().maximumFractionDigits;
  return formatCurrency(Number(amount) / (10 ** digits), currency);
};

export function AdminPaymentReconciliationPage() {
  const [status, setStatus] = useState("pending_review");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [intentPage, setIntentPage] = useState(1);
  const [records, setRecords] = useState({ items: [], total: 0, page: 1, limit: 20 });
  const [intents, setIntents] = useState({ items: [], total: 0, page: 1, limit: 20 });
  const [notes, setNotes] = useState({});
  const [references, setReferences] = useState({});
  const [absenceConfirmations, setAbsenceConfirmations] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loadedKey, setLoadedKey] = useState("");
  const requestSequence = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestSequence.current;
    const requestKey = JSON.stringify([status, search, page, intentPage]);
    setLoading(true);
    setError("");
    try {
      const params = { page: String(page), limit: PAGE_SIZE, status, ...(search ? { search } : {}) };
      const [nextRecords, nextIntents] = await Promise.all([
        adminService.getPaymentReconciliations(params),
        adminService.getPaymentOrderIntents({ page: String(intentPage), limit: PAGE_SIZE, ...(search ? { search } : {}) }),
      ]);
      if (requestId !== requestSequence.current) return;
      setRecords(nextRecords);
      setIntents(nextIntents);
      setLoadedKey(requestKey);
      const maxRecordPage = Math.max(1, nextRecords.pagination?.totalPages ?? Math.ceil(nextRecords.total / nextRecords.limit));
      const maxIntentPage = Math.max(1, nextIntents.pagination?.totalPages ?? Math.ceil(nextIntents.total / nextIntents.limit));
      if (page > maxRecordPage) setPage(maxRecordPage);
      if (intentPage > maxIntentPage) setIntentPage(maxIntentPage);
    } catch (requestError) {
      if (requestId === requestSequence.current) setError(requestError.message || "Could not load payment reconciliation records");
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }, [intentPage, page, search, status]);

  const resultsAreCurrent = loadedKey === JSON.stringify([status, search, page, intentPage]);

  useEffect(() => {
    load();
    return () => { requestSequence.current += 1; };
  }, [load]);

  const submitReview = async (kind, item) => {
    const key = `${kind}:${item._id}`;
    const reason = notes[key]?.trim() || "";
    if (reason.length < 5) { setError("Enter a review note of at least 5 characters."); return; }
    const action = notes[`${key}:action`] || "review_note";
    const externalReference = references[key]?.trim() || "";
    if (["manual_resolution_reported", "verified_absent_manual"].includes(action) && !externalReference) {
      setError("Enter the external evidence reference for this manual outcome."); return;
    }
    if (action === "verified_absent_manual" && !absenceConfirmations[key]) {
      setError("Confirm that you checked Razorpay and verified no order exists."); return;
    }
    setSaving(key); setError(""); setNotice("");
    try {
      const payload = {
        action,
        reason,
        ...(externalReference ? { externalReference } : {}),
        ...(action === "verified_absent_manual" ? { confirmNoGatewayOrder: true } : {}),
      };
      const response = kind === "order_intent"
        ? await adminService.reviewPaymentOrderIntent(item._id, payload)
        : await adminService.reviewPaymentReconciliation(item._id, payload);
      setNotice(response.message || "Review action recorded.");
      await load();
    } catch (requestError) {
      setError(requestError.message || "Could not save the review action");
    } finally {
      setSaving("");
    }
  };

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold">Payment reconciliation</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Review captured payments and uncertain order creation. All actions are audited. This page does not issue refunds or credit moves from an admin click.</p>
      </header>

      <section className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-100">
        Verify gateway records in Razorpay before deciding an outcome. SwiftMove does not currently automate refunds. A manual resolution note records an admin-reported external action; it does not prove a refund or release an unresolved order intent.
      </section>

      <form className="flex flex-col gap-3 sm:flex-row" onSubmit={(event) => { event.preventDefault(); setPage(1); setIntentPage(1); setSearch(searchInput.trim()); }}>
        <label className="flex-1 text-sm">Search payment, order, move, customer or reason
          <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="mt-1 w-full rounded border bg-white p-2 dark:bg-slate-900" />
        </label>
        <label className="text-sm">Reconciliation status
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="mt-1 block rounded border bg-white p-2 dark:bg-slate-900">
            {statusOptions.map((option) => <option key={option} value={option}>{titleFor(option)}</option>)}
          </select>
        </label>
        <button className="self-end rounded bg-blue-700 px-4 py-2 text-white">Search</button>
        <button type="button" onClick={load} className="self-end rounded border px-4 py-2">Refresh</button>
      </form>

      {error && <p role="alert" className="rounded bg-red-50 p-3 text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded bg-green-50 p-3 text-green-800">{notice}</p>}
      {loading && <p>Loading reconciliation records...</p>}

      <section className="space-y-4">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Captured payment reconciliations ({!resultsAreCurrent ? "…" : records.total})</h2><span className="text-sm text-slate-500">{!resultsAreCurrent ? "Updating…" : `Page ${page} of ${Math.max(1, records.pagination?.totalPages ?? Math.ceil(records.total / records.limit))}`}</span></div>
        {resultsAreCurrent && records.items.length === 0 && <p className="rounded border p-4 text-sm">No records match this filter.</p>}
        {resultsAreCurrent && records.items.map((record) => {
          const key = `reconciliation:${record._id}`;
          return <article key={record._id} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-900">
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p><b>Status:</b> {titleFor(record.status)}</p><p><b>Reason:</b> {record.reason}</p>
              <p><b>Payment ID:</b> <span className="break-all">{record.razorpayPaymentId}</span></p><p><b>Order ID:</b> <span className="break-all">{record.razorpayOrderId}</span></p>
              <p><b>Move:</b> {record.move?._id || "Unavailable"} (quote v{record.quoteVersion ?? "?"}; current v{record.currentQuoteVersion ?? "?"})</p>
              <p><b>Customer:</b> {record.user?.name || "Unavailable"} {record.user?.email ? `(${record.user.email})` : ""}</p>
              <p><b>Captured amount:</b> {formatMinorAmount(record.amountMinorUnits, record.currency)}</p>
              <p><b>Expected amount:</b> {record.expectedAmountMinorUnits == null ? "Unavailable" : formatMinorAmount(record.expectedAmountMinorUnits, record.expectedCurrency || record.currency)}</p>
              <p><b>Received:</b> {record.receivedAt ? new Date(record.receivedAt).toLocaleString() : "Unavailable"}</p>
              <p><b>Source / event:</b> {record.source} / {record.webhookEventId || "checkout"}</p>
            </div>
            <details className="text-sm"><summary className="cursor-pointer font-medium">Review history ({record.reviewHistory?.length || 0})</summary>
              <ol className="mt-2 space-y-2">{(record.reviewHistory || []).map((entry, index) => <li key={`${entry.at}-${index}`} className="rounded bg-slate-50 p-2 dark:bg-slate-800"><b>{entry.action}</b> by {entry.admin?.name || entry.admin} · {new Date(entry.at).toLocaleString()}<p>{entry.reason}</p>{entry.externalReference && <p>External reference: {entry.externalReference}</p>}</li>)}</ol>
            </details>
            {record.status === "pending_review" && <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-sm">Admin review note<textarea value={notes[key] || ""} onChange={(event) => setNotes((current) => ({ ...current, [key]: event.target.value }))} maxLength={1000} className="mt-1 w-full rounded border p-2 dark:bg-slate-950" /></label>
              <div className="space-y-2">
                <label className="text-sm">Action<select value={notes[`${key}:action`] || "review_note"} onChange={(event) => setNotes((current) => ({ ...current, [`${key}:action`]: event.target.value }))} className="mt-1 block rounded border p-2 dark:bg-slate-950"><option value="review_note">Add review note</option><option value="mark_failed">Mark review as failed</option><option value="manual_resolution_reported">Record manual outcome (no app refund/credit)</option></select></label>
                {notes[`${key}:action`] === "manual_resolution_reported" && <label className="text-sm">External refund or case reference<input value={references[key] || ""} onChange={(event) => setReferences((current) => ({ ...current, [key]: event.target.value }))} maxLength={240} className="mt-1 block w-full rounded border p-2 dark:bg-slate-950" /></label>}
                <button disabled={saving === key} onClick={() => submitReview("reconciliation", record)} className="rounded bg-blue-700 px-3 py-2 text-white disabled:opacity-50">{saving === key ? "Saving..." : "Save audited review"}</button>
              </div>
            </div>}
          </article>;
        })}
        {records.pagination && <PaginationControls pagination={records.pagination} page={page} onPageChange={setPage} disabled={loading} label="Payment reconciliations pagination" />}
      </section>

      <section className="space-y-4 border-t pt-6">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Unresolved order intents ({!resultsAreCurrent ? "…" : intents.total})</h2><span className="text-sm text-slate-500">{!resultsAreCurrent ? "Updating…" : `Page ${intentPage} of ${Math.max(1, intents.pagination?.totalPages ?? Math.ceil(intents.total / intents.limit))}`}</span></div>
        <p className="text-sm text-amber-800 dark:text-amber-200">These intents block new orders and estimate revisions. SwiftMove cannot infer that an order was not created when the gateway response was lost. A note does not release the hold.</p>
        {resultsAreCurrent && intents.items.length === 0 && <p className="rounded border p-4 text-sm">No unresolved order intents.</p>}
        {resultsAreCurrent && intents.items.map((intent) => {
          const key = `order_intent:${intent._id}`;
          return <article key={intent._id} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-900">
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p><b>Status:</b> {titleFor(intent.status)}</p><p><b>Gateway order ID:</b> <span className="break-all">{intent.razorpayOrderId || "Unknown; investigate gateway by receipt/notes"}</span></p>
              <p><b>Move:</b> {intent.move?._id || intent.move} · quote v{intent.pricingVersion} · accepted v{intent.acceptedPricingVersion ?? "not required"}</p>
              <p><b>Customer:</b> {intent.user?.name || "Unavailable"} {intent.user?.email ? `(${intent.user.email})` : ""}</p>
              <p><b>Amount:</b> {formatCurrency(intent.amount, intent.currency)}</p><p><b>Receipt reference:</b> {intent.receipt}</p>
              <p><b>Created:</b> {new Date(intent.requestedAt).toLocaleString()}</p><p><b>Last attempt:</b> {intent.lastAttemptAt ? new Date(intent.lastAttemptAt).toLocaleString() : "Not recorded"}</p>
            </div>
            <details className="text-sm"><summary className="cursor-pointer font-medium">Review history ({intent.reviewHistory?.length || 0})</summary><ol className="mt-2 space-y-2">{(intent.reviewHistory || []).map((entry, index) => <li key={`${entry.at}-${index}`} className="rounded bg-slate-50 p-2 dark:bg-slate-800"><b>{entry.action}</b> by {entry.admin?.name || entry.admin} · {new Date(entry.at).toLocaleString()}<p>{entry.reason}</p></li>)}</ol></details>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-sm">Review action<select value={notes[`${key}:action`] || "review_note"} onChange={(event) => setNotes((current) => ({ ...current, [`${key}:action`]: event.target.value }))} className="mt-1 block rounded border p-2 dark:bg-slate-950"><option value="review_note">Save review note</option>{!intent.razorpayOrderId && !intent.paymentOrder && <option value="verified_absent_manual">Confirm no Razorpay order exists</option>}</select></label>
              {notes[`${key}:action`] === "verified_absent_manual" && <label className="text-sm">Gateway evidence / support reference<input value={references[key] || ""} onChange={(event) => setReferences((current) => ({ ...current, [key]: event.target.value }))} maxLength={240} className="mt-1 block w-full rounded border p-2 dark:bg-slate-950" /></label>}
              <label className="text-sm sm:col-span-2">Admin reason<textarea aria-label="Order intent admin review note" value={notes[key] || ""} onChange={(event) => setNotes((current) => ({ ...current, [key]: event.target.value }))} maxLength={1000} placeholder="Record the external investigation and next step" className="mt-1 w-full rounded border p-2 dark:bg-slate-950" /></label>
              {notes[`${key}:action`] === "verified_absent_manual" && <label className="flex items-start gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={Boolean(absenceConfirmations[key])} onChange={(event) => setAbsenceConfirmations((current) => ({ ...current, [key]: event.target.checked }))} /><span>I checked Razorpay and verified that no gateway order was created for this receipt.</span></label>}
              <div className="sm:col-span-2"><button disabled={saving === key} onClick={() => submitReview("order_intent", intent)} className="rounded bg-blue-700 px-3 py-2 text-white disabled:opacity-50">{saving === key ? "Saving..." : notes[`${key}:action`] === "verified_absent_manual" ? "Record verified absence" : "Save review note"}</button></div>
            </div>
          </article>;
        })}
        {intents.pagination && <PaginationControls pagination={intents.pagination} page={intentPage} onPageChange={setIntentPage} disabled={loading} label="Unresolved payment intents pagination" />}
      </section>
    </main>
  );
}
