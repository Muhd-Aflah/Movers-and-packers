const estimateError = (form) => {
  if (!form?.materials?.length || form.materials.some((line) => !line.description.trim() || !line.unit.trim() || line.quantity === "" || line.unitRate === "")) {
    return "Enter each material description, quantity, unit, and unit rate.";
  }
  if (Object.values(form.labor).some((line) => line.workers === "" || line.ratePerWorker === "")) {
    return "Enter a worker count and rate for packing, loading, and unloading.";
  }
  if (form.additionalCharges.some((line) => !line.description.trim() || line.amount === "")) {
    return "Complete or remove each additional charge line.";
  }
  return "";
};

const estimatePayload = (form) => ({
  materials: form.materials.map((line) => ({ ...line, quantity: Number(line.quantity), unitRate: Number(line.unitRate) })),
  labor: Object.fromEntries(Object.entries(form.labor).map(([key, line]) => [key, { workers: Number(line.workers), ratePerWorker: Number(line.ratePerWorker) }])),
  additionalCharges: form.additionalCharges.map((line) => ({ ...line, amount: Number(line.amount) })),
});

export async function runEstimateSubmission({ moveId, form, setSavingId, setError, setNotice, saveEstimate, updateMove }) {
  const validationMessage = estimateError(form);
  if (validationMessage) {
    setError(validationMessage);
    setNotice("");
    return false;
  }

  setSavingId(moveId);
  try {
    setError("");
    setNotice("");
    const updated = await saveEstimate(moveId, estimatePayload(form));
    if (!updated || typeof updated !== "object" || String(updated._id) !== String(moveId)) {
      throw new Error("The saved estimate response was incomplete. Refresh the list and try again.");
    }
    updateMove(updated);
    setNotice("Estimate saved. The customer must accept this version before payment.");
    return true;
  } catch (requestError) {
    setError(requestError?.message || "Could not save packing estimate");
    setNotice("");
    return false;
  } finally {
    setSavingId("");
  }
}
