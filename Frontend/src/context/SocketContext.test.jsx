import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";

const { mockIo, mockSocket } = vi.hoisted(() => {
  const listeners = new Map();
  const socket = {
    connected: false,
    on: vi.fn((event, handler) => {
      const current = listeners.get(event) || [];
      listeners.set(event, [...current, handler]);
      return socket;
    }),
    off: vi.fn((event, handler) => {
      listeners.set(event, (listeners.get(event) || []).filter((item) => item !== handler));
      return socket;
    }),
    connect: vi.fn(() => socket),
    disconnect: vi.fn(() => socket),
    removeAllListeners: vi.fn(() => { listeners.clear(); return socket; }),
    trigger: (event, payload) => {
      if (event === "connect") socket.connected = true;
      if (event === "disconnect") socket.connected = false;
      for (const handler of listeners.get(event) || []) handler(payload);
    },
    listenerCount: (event) => (listeners.get(event) || []).length,
    reset: () => {
      listeners.clear();
      socket.connected = false;
      for (const method of ["on", "off", "connect", "disconnect", "removeAllListeners"]) socket[method].mockClear();
    },
  };
  return { mockSocket: socket, mockIo: vi.fn(() => socket) };
});

vi.mock("socket.io-client", () => ({ io: mockIo }));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock("@capacitor/app", () => ({ App: { addListener: vi.fn() } }));
vi.mock("../constants/config", () => ({ APP_CONFIG: { socket: { baseUrl: "https://backend.test" } } }));

import { SocketProvider, useSocket } from "./SocketContext";
import { useSocketEvents } from "../hooks/useSocketEvents";
import { clearAuthStorage, setAuth } from "../utils/auth";

function Probe({ onEvent = vi.fn(), onReconnect = vi.fn() }) {
  const { connected } = useSocket();
  useSocketEvents(["estimate:created"], onEvent, onReconnect);
  return <span>{connected ? "connected" : "disconnected"}</span>;
}

const testToken = () => `header.${btoa(JSON.stringify({ id: "customer-1", role: "user", exp: Math.floor(Date.now() / 1000) + 600 }))}.signature`;

describe("SocketProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    mockSocket.reset();
    mockIo.mockClear();
  });

  afterEach(() => {
    cleanup();
    clearAuthStorage();
  });

  it("connects once with the stored JWT, delivers events, syncs after reconnect, and cleans listeners on logout", async () => {
    const onEvent = vi.fn();
    const onReconnect = vi.fn();
    render(<SocketProvider><Probe onEvent={onEvent} onReconnect={onReconnect} /></SocketProvider>);

    const token = testToken();
    await act(async () => { setAuth({ token, user: { _id: "customer-1", role: "user" } }); });

    expect(mockIo).toHaveBeenCalledTimes(1);
    expect(mockIo).toHaveBeenCalledWith("https://backend.test", expect.objectContaining({ auth: { token } }));
    expect(mockSocket.connect).toHaveBeenCalledTimes(1);
    expect(mockSocket.listenerCount("estimate:created")).toBe(1);

    act(() => mockSocket.trigger("connect"));
    expect(screen.getByText("connected")).toBeTruthy();
    act(() => mockSocket.trigger("estimate:created", { moveId: "move-1" }));
    expect(onEvent).toHaveBeenCalledWith("estimate:created", { moveId: "move-1" });

    act(() => mockSocket.trigger("disconnect"));
    act(() => mockSocket.trigger("connect"));
    expect(onReconnect).toHaveBeenCalledTimes(1);

    await act(async () => { clearAuthStorage(); await Promise.resolve(); });
    expect(mockSocket.disconnect).toHaveBeenCalled();
    expect(mockSocket.listenerCount("estimate:created")).toBe(0);
  });
});
