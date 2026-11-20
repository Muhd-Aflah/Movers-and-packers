import { useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";

export function useSocketEvents(events, onEvent, onReconnect, { coalesceMs = 0 } = {}) {
  const { socket } = useSocket();
  const eventHandler = useRef(onEvent);
  const reconnectHandler = useRef(onReconnect);
  eventHandler.current = onEvent;
  reconnectHandler.current = onReconnect;
  const eventKey = events.join("|");

  useEffect(() => {
    if (!socket) return undefined;
    let connectedBefore = socket.connected;
    let coalesceTimer;
    let pendingEvent;
    const listeners = events.map((event) => {
      const handler = (payload) => {
        if (!coalesceMs) {
          eventHandler.current?.(event, payload);
          return;
        }
        pendingEvent = [event, payload];
        window.clearTimeout(coalesceTimer);
        coalesceTimer = window.setTimeout(() => {
          if (pendingEvent) eventHandler.current?.(...pendingEvent);
          pendingEvent = null;
        }, coalesceMs);
      };
      socket.on(event, handler);
      return [event, handler];
    });
    const onConnect = () => {
      if (connectedBefore) reconnectHandler.current?.();
      connectedBefore = true;
    };
    socket.on("connect", onConnect);

    return () => {
      window.clearTimeout(coalesceTimer);
      for (const [event, handler] of listeners) socket.off(event, handler);
      socket.off("connect", onConnect);
    };
  // `eventKey` avoids re-subscribing when callers create an equivalent array.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, eventKey, coalesceMs]);
}
