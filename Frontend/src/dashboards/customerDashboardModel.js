const terminalStatuses = new Set(["completed", "cancelled"]);

export const hasEstimateAction = (move) =>
  move?.pricingStatus === "pending_acceptance" && move?.pricingAcceptanceRequired === true;

const indiaDateKey = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

export const summarizeCustomerMoves = (moves, today) => {
  const records = Array.isArray(moves) ? moves : [];
  const actionRequiredMoves = records.filter(hasEstimateAction);
  const actionIds = new Set(actionRequiredMoves.map((move) => String(move._id)));
  const upcomingMoves = records
    .filter((move) => {
      const day = indiaDateKey(move.moveDate);
      return day && day >= today && !terminalStatuses.has(move.status) && !actionIds.has(String(move._id));
    })
    .sort((a, b) => indiaDateKey(a.moveDate).localeCompare(indiaDateKey(b.moveDate)));
  const completedCount = records.filter((move) => move.status === "completed").length;

  return {
    upcomingCount: upcomingMoves.length,
    actionRequiredCount: actionRequiredMoves.length,
    completedCount,
    upcomingMove: upcomingMoves[0] || null,
    actionRequiredMoves,
  };
};
