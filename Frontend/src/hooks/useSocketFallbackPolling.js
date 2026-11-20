import { useEffect } from "react";

export function useSocketFallbackPolling({ connected, enabled = true, refresh, intervalMs = 12_000 }) {
  useEffect(() => {
    if (connected || !enabled) return undefined;

    let intervalId = null;
    const stopPolling = () => {
      if (intervalId === null) return;
      window.clearInterval(intervalId);
      intervalId = null;
    };
    const poll = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const startPolling = () => {
      if (intervalId !== null || document.visibilityState !== "visible") return;
      intervalId = window.setInterval(poll, intervalMs);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        poll();
        startPolling();
      } else {
        stopPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [connected, enabled, intervalMs, refresh]);
}
