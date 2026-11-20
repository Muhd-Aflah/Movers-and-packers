import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { io } from "socket.io-client";
import { APP_CONFIG } from "../constants/config";
import { clearAuthStorage, getAuthFromStorage } from "../utils/auth";

const SocketContext = createContext({ socket: null, connected: false });

export function SocketProvider({ children }) {
  const [token, setToken] = useState(() => getAuthFromStorage().token);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const syncToken = () => setToken(getAuthFromStorage().token);
    const onStorage = (event) => {
      if (event.key === "token" || event.key === null) syncToken();
    };
    window.addEventListener("swiftmove:auth-changed", syncToken);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("swiftmove:auth-changed", syncToken);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    setConnected(false);
    if (!token || !APP_CONFIG.socket.baseUrl) {
      setSocket(null);
      return undefined;
    }

    const client = io(APP_CONFIG.socket.baseUrl, {
      autoConnect: false,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10_000,
      timeout: 10_000,
    });
    let disposed = false;
    let appListener;
    setSocket(client);

    client.on("connect", () => setConnected(true));
    client.on("disconnect", () => setConnected(false));
    client.on("connect_error", (error) => {
      setConnected(false);
      const code = error?.data?.code;
      if (["TOKEN_INVALID", "ACCOUNT_UNAVAILABLE", "FORBIDDEN_ROLE"].includes(code)) {
        client.disconnect();
        clearAuthStorage();
      } else if (code === "MOVER_NOT_APPROVED") {
        client.disconnect();
      }
    });

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") client.connect();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    if (Capacitor.isNativePlatform()) {
      App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) client.connect();
        else client.disconnect();
      }).then((listener) => {
        if (disposed) listener.remove();
        else appListener = listener;
      }).catch(() => {});
    }

    client.connect();
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      appListener?.remove();
      client.removeAllListeners();
      client.disconnect();
    };
  }, [token]);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
