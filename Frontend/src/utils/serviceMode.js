export function getServiceModeLabel(move) {
  if (move?.serviceMode === "full_service") return "Full Service";
  if (move?.serviceMode === "transport_only") return "Transport Only";
  if (typeof move?.service === "string" && move.service.trim()) {
    return move.service.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
  return "Service unavailable";
}
