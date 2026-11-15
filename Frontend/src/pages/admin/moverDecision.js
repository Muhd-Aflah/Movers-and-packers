export async function runMoverDecision({
  moverId,
  setLoadingId,
  setError,
  setMessage,
  request,
  refresh,
  successFallback,
  errorFallback,
}) {
  setLoadingId(moverId);
  try {
    setError("");
    setMessage("");
    let result;
    try {
      result = await request();
    } catch (requestError) {
      setError(requestError?.message || errorFallback);
      return false;
    }

    setMessage(result?.message || successFallback);
    try {
      await refresh();
    } catch {
      setError("The mover decision succeeded, but the list could not be refreshed. Please refresh the list.");
    }
    return true;
  } finally {
    setLoadingId(null);
  }
}

export function getMoverDecisionButtonState(action, moverId, approvingMoverId, rejectingMoverId) {
  const isApproving = approvingMoverId === moverId;
  const isRejecting = rejectingMoverId === moverId;
  return {
    disabled: isApproving || isRejecting,
    label: action === "approve"
      ? isApproving ? "Saving..." : "Approve mover"
      : isRejecting ? "Rejecting..." : "Reject application",
  };
}
