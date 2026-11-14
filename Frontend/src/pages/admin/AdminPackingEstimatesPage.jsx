import { useCallback, useEffect, useState } from "react";
import { adminService } from "../../services/admin.service";
import { formatCurrency } from "../../utils/currency";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { usePaginatedData } from "../../hooks/usePaginatedData";

const emptyEstimate = (move) => ({
  materials: [{ description: "", quantity: "1", unit: "", unitRate: "" }],
  labor: {
    packing: { workers: String(move.pricingDraft?.workers?.packing || 1), ratePerWorker: "" },
    loading: { workers: String(move.pricingDraft?.workers?.loading || 1), ratePerWorker: "" },
    unloading: { workers: String(move.pricingDraft?.workers?.unloading || 1), ratePerWorker: "" },
  },
  additionalCharges: [],
});

export function AdminPackingEstimatesPage() {
  const [forms, setForms] = useState({});
  const [savingId, setSavingId] = useState("");
  const [notice, setNotice] = useState("");

  const fetchPage = useCallback((page) => adminService.getPendingPackingEstimatesPage(page), []);
  const { items: moves, setItems: setMoves, loading, error, setError, page, pagination, setPage, reload: loadMoves } = usePaginatedData(fetchPage);

  useEffect(() => {
    setForms((current) => {
      const next = { ...current };
      moves.forEach((move) => { if (!next[move._id]) next[move._id] = emptyEstimate(move); });
      return next;
    });
  }, [moves]);

  const updateForm = (moveId, updater) => setForms((current) => ({ ...current, [moveId]: updater(current[moveId]) }));
  const updateMaterial = (moveId, index, key, value) => updateForm(moveId, (form) => ({
    ...form, materials: form.materials.map((line, i) => i === index ? { ...line, [key]: value } : line),
  }));
  const updateLabor = (moveId, key, field, value) => updateForm(moveId, (form) => ({
    ...form, labor: { ...form.labor, [key]: { ...form.labor[key], [field]: value } },
  }));

  const submitEstimate = async (move) => {
    const form = forms[move._id];
    if (!form?.materials?.length || form.materials.some((line) => !line.description.trim() || !line.unit.trim() || line.quantity === "" || line.unitRate === "")) {
      setError("Enter each material description, quantity, unit, and unit rate."); return;
    }
    if (Object.values(form.labor).some((line) => line.workers === "" || line.ratePerWorker === "")) {
      setError("Enter a worker count and rate for packing, loading, and unloading."); return;
    }
    if (form.additionalCharges.some((line) => !line.description.trim() || line.amount === "")) {
      setError("Complete or remove each additional charge line."); return;
    }
    setSavingId(move._id); setError(""); setNotice("");
    try {
      const updated = await adminService.savePackingEstimate(move._id, {
        materials: form.materials.map((line) => ({ ...line, quantity: Number(line.quantity), unitRate: Number(line.unitRate) })),
        labor: Object.fromEntries(Object.entries(form.labor).map(([key, line]) => [key, { workers: Number(line.workers), ratePerWorker: Number(line.ratePerWorker) }])),
        additionalCharges: form.additionalCharges.map((line) => ({ ...line, amount: Number(line.amount) })),
      });
      setMoves((current) => current.map((item) => item._id === updated._id ? { ...item, ...updated, user: item.user } : item));
      setNotice("Estimate saved. The customer must accept this version before payment.");
    } catch (requestError) { setError(requestError.message || "Could not save packing estimate"); }
    finally { setSavingId(""); }
  };

  if (loading && !pagination) return <div className="p-6">Loading pending estimates...</div>;
  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between gap-4"><div><h1 className="text-xl font-bold">Manual Packing Estimates</h1><p className="text-sm text-gray-600">Only admins can submit estimates. The backend calculates every line and total.</p></div><button onClick={loadMoves} className="rounded border px-3 py-2">Refresh</button></div>
      {error && <p role="alert" className="rounded bg-red-50 p-3 text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded bg-green-50 p-3 text-green-700">{notice}</p>}
      {!error && !moves.length && <p>{loading ? "Loading estimates..." : "No moves are awaiting a packing estimate or customer acceptance."}</p>}
      {moves.map((move) => {
        const form = forms[move._id] || emptyEstimate(move);
        const draft = move.pricingDraft;
        return <article key={move._id} className="space-y-4 rounded-lg border bg-white p-5 shadow-sm">
          <header><h2 className="font-semibold">Move {move._id}</h2><p className="text-sm text-gray-600">{move.user?.name} ({move.user?.email}) · {move.pickup?.address} → {move.dropoff?.address}</p><p className="text-sm">Status: {move.pricingStatus} · Inventory: {JSON.stringify(draft?.inventory || move.inventory)}</p><p className="text-sm">Transport baseline: {formatCurrency(draft?.breakdown?.transport, draft?.currency)} · {draft?.distanceKm} km · Vehicle {draft?.vehicle?.type}</p></header>
          {move.pricing && <div className="rounded bg-blue-50 p-3 text-sm"><b>Current estimate v{move.pricingVersion}:</b> {formatCurrency(move.price, move.pricing.currency)}. Customer acceptance {move.pricingStatus === "pending_acceptance" ? "pending" : "not yet submitted"}.</div>}
          <section><h3 className="mb-2 font-medium">Packing materials</h3><div className="space-y-2">{form.materials.map((line, index) => <div key={index} className="grid gap-2 sm:grid-cols-4">
            <input aria-label="Material description" placeholder="Description" value={line.description} onChange={(event) => updateMaterial(move._id, index, "description", event.target.value)} className="rounded border p-2" />
            <input aria-label="Material quantity" type="number" min="0.001" step="any" placeholder="Quantity" value={line.quantity} onChange={(event) => updateMaterial(move._id, index, "quantity", event.target.value)} className="rounded border p-2" />
            <input aria-label="Material unit" placeholder="Unit (for example, roll)" value={line.unit} onChange={(event) => updateMaterial(move._id, index, "unit", event.target.value)} className="rounded border p-2" />
            <input aria-label="Material unit rate" type="number" min="0" step="0.01" placeholder="Rate (INR per unit)" value={line.unitRate} onChange={(event) => updateMaterial(move._id, index, "unitRate", event.target.value)} className="rounded border p-2" />
          </div>)}</div><button onClick={() => updateForm(move._id, (current) => ({ ...current, materials: [...current.materials, { description: "", quantity: "1", unit: "", unitRate: "" }] }))} className="mt-2 text-sm text-blue-700">Add material line</button></section>
          <section><h3 className="mb-2 font-medium">Labour rates (INR per worker)</h3><div className="grid gap-3 sm:grid-cols-3">{["packing", "loading", "unloading"].map((key) => <div key={key} className="rounded border p-3"><b className="capitalize">{key}</b><label className="mt-2 block text-sm">Workers<input type="number" min="1" max="100" step="1" value={form.labor[key].workers} onChange={(event) => updateLabor(move._id, key, "workers", event.target.value)} className="mt-1 w-full rounded border p-2" /></label><label className="mt-2 block text-sm">Rate per worker<input type="number" min="0" step="0.01" value={form.labor[key].ratePerWorker} onChange={(event) => updateLabor(move._id, key, "ratePerWorker", event.target.value)} className="mt-1 w-full rounded border p-2" /></label></div>)}</div></section>
          <section><h3 className="mb-2 font-medium">Additional approved charges</h3>{form.additionalCharges.map((line, index) => <div key={index} className="mb-2 grid gap-2 sm:grid-cols-2"><input aria-label="Additional charge description" placeholder="Description" value={line.description} onChange={(event) => updateForm(move._id, (current) => ({ ...current, additionalCharges: current.additionalCharges.map((item, i) => i === index ? { ...item, description: event.target.value } : item) }))} className="rounded border p-2" /><input aria-label="Additional charge amount" type="number" min="0" step="0.01" placeholder="Amount (INR)" value={line.amount} onChange={(event) => updateForm(move._id, (current) => ({ ...current, additionalCharges: current.additionalCharges.map((item, i) => i === index ? { ...item, amount: event.target.value } : item) }))} className="rounded border p-2" /></div>)}<button onClick={() => updateForm(move._id, (current) => ({ ...current, additionalCharges: [...current.additionalCharges, { description: "", amount: "" }] }))} className="text-sm text-blue-700">Add charge</button></section>
          {move.pricingAudit?.length > 0 && <details><summary className="cursor-pointer text-sm font-medium">Estimate audit ({move.pricingAudit.length})</summary><ol className="mt-2 space-y-2 text-xs text-gray-600">{move.pricingAudit.map((entry, index) => <li key={`${entry.updatedVersion}-${index}`}>Admin {entry.admin} · {new Date(entry.at).toLocaleString()} · version {entry.previousVersion} → {entry.updatedVersion} · previous {entry.previousEstimate ? formatCurrency(entry.previousEstimate.total, entry.previousEstimate.currency) : "none"} · updated {formatCurrency(entry.updatedEstimate.total, entry.updatedEstimate.currency)}</li>)}</ol></details>}
          <button onClick={() => submitEstimate(move)} disabled={savingId === move._id} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{savingId === move._id ? "Saving..." : move.pricing ? "Update estimate" : "Save estimate"}</button>
        </article>;
      })}
      {pagination && <PaginationControls pagination={pagination} page={page} onPageChange={setPage} disabled={loading || Boolean(savingId)} label="Packing estimates pagination" />}
    </div>
  );
}
