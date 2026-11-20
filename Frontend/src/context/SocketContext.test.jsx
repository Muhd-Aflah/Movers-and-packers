import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

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
vi.mock("../services/notification.service", () => ({
  getMyNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
}));

import { SocketProvider, useSocket } from "./SocketContext";
import { useSocketEvents } from "../hooks/useSocketEvents";
import { useSocketFallbackPolling } from "../hooks/useSocketFallbackPolling";
import { NotificationCenter, mergeNotifications } from "../components/layout/NotificationCenter";
import { getMyNotifications } from "../services/notification.service";
import { clearAuthStorage, setAuth } from "../utils/auth";

function Probe({ onEvent = vi.fn(), onReconnect = vi.fn() }) {
  const { connected } = useSocket();
  useSocketEvents(["estimate:created"], onEvent, onReconnect);
  return <span>{connected ? "connected" : "disconnected"}</span>;
}

function PollingProbe({ connected, enabled = true, refresh }) {
  useSocketFallbackPolling({ connected, enabled, refresh, intervalMs: 12_000 });
  return null;
}

function RealtimeRefreshProbe({ refresh }) {
  const { socket, connected } = useSocket();
  const isConnected = Boolean(socket && connected);
  useSocketEvents([], undefined, refresh);
  useSocketFallbackPolling({ connected: isConnected, refresh, intervalMs: 12_000 });
  return null;
}

const testToken = () => `header.${btoa(JSON.stringify({ id: "customer-1", role: "user", exp: Math.floor(Date.now() / 1000) + 600 }))}.signature`;

describe("SocketProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    mockSocket.reset();
    mockIo.mockClear();
    getMyNotifications.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
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

  it("switches from fallback polls to immediate socket refresh and back without overlapping intervals", async () => {
    vi.useFakeTimers();
    const refresh = vi.fn();
    render(<SocketProvider><RealtimeRefreshProbe refresh={refresh} /></SocketProvider>);
    await act(async () => {
      setAuth({ token: testToken(), user: { _id: "customer-1", role: "user" } });
    });

    act(() => { vi.advanceTimersByTime(12_000); });
    expect(refresh).toHaveBeenCalledTimes(1);

    act(() => mockSocket.trigger("connect"));
    act(() => { vi.advanceTimersByTime(24_000); });
    expect(refresh).toHaveBeenCalledTimes(1);

    act(() => mockSocket.trigger("disconnect"));
    act(() => { vi.advanceTimersByTime(12_000); });
    expect(refresh).toHaveBeenCalledTimes(2);

    act(() => mockSocket.trigger("connect"));
    expect(refresh).toHaveBeenCalledTimes(3);
    act(() => { vi.advanceTimersByTime(24_000); });
    expect(refresh).toHaveBeenCalledTimes(3);
  });

  it("runs fallback polling only while disconnected and visible, and cleans it up on reconnect and unmount", () => {
    vi.useFakeTimers();
    let visibility = "visible";
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
    const refresh = vi.fn();
    const view = render(<PollingProbe connected={false} refresh={refresh} />);

    act(() => { vi.advanceTimersByTime(12_000); });
    expect(refresh).toHaveBeenCalledTimes(1);

    visibility = "hidden";
    act(() => { document.dispatchEvent(new Event("visibilitychange")); });
    act(() => { vi.advanceTimersByTime(24_000); });
    expect(refresh).toHaveBeenCalledTimes(1);

    visibility = "visible";
    act(() => { document.dispatchEvent(new Event("visibilitychange")); });
    expect(refresh).toHaveBeenCalledTimes(2);
    view.rerender(<PollingProbe connected refresh={refresh} />);
    act(() => { vi.advanceTimersByTime(24_000); });
    expect(refresh).toHaveBeenCalledTimes(2);

    view.rerender(<PollingProbe connected={false} refresh={refresh} />);
    view.unmount();
    act(() => { vi.advanceTimersByTime(24_000); });
    expect(refresh).toHaveBeenCalledTimes(2);
    delete document.visibilityState;
  });
});

describe("NotificationCenter read-state merging", () => {
  const notificationId = "64b000000000000000000001";
  const readAt = "2026-11-20T10:00:00.000Z";
  const unreadItem = {
    id: notificationId,
    title: "Move updated",
    message: "The booking changed.",
    at: "2026-11-20T09:00:00.000Z",
    readAt: null,
    isRead: false,
  };

  beforeEach(() => {
    localStorage.clear();
    mockSocket.reset();
    mockIo.mockClear();
    getMyNotifications.mockReset();
  });

  afterEach(() => {
    cleanup();
    clearAuthStorage();
  });

  it("uses fetched read state for duplicate IDs and keeps local-only notification details", () => {
    const localOnly = { ...unreadItem, id: "64b000000000000000000002", title: "Socket-only update", extra: "preserve me" };
    const serverRead = { ...unreadItem, isRead: true, readAt, message: "Latest server message." };
    const merged = mergeNotifications([serverRead, serverRead], [unreadItem, localOnly]);

    expect(merged).toHaveLength(2);
    expect(merged.find((item) => item.id === notificationId)).toMatchObject({
      isRead: true,
      readAt,
      message: "Latest server message.",
    });
    expect(merged.find((item) => item.id === localOnly.id)).toMatchObject({ extra: "preserve me" });
  });

  it("keeps the read socket event through a stale duplicate and a subsequent server refresh", async () => {
    const serverRead = { ...unreadItem, isRead: true, readAt };
    getMyNotifications
      .mockResolvedValueOnce({ notifications: [unreadItem] })
      .mockResolvedValueOnce({ notifications: [serverRead] });
    await act(async () => {
      setAuth({ token: testToken(), user: { _id: "customer-1", role: "user" } });
    });

    render(<SocketProvider><MemoryRouter><NotificationCenter role="user" /></MemoryRouter></SocketProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Recent updates" }));
    await screen.findByText("Move updated");
    expect(screen.getByRole("button", { name: "Recent updates, 1 unread" })).toBeTruthy();

    act(() => mockSocket.trigger("notification:read", { notificationId, readAt }));
    expect(screen.getByRole("button", { name: "Recent updates" })).toBeTruthy();

    act(() => mockSocket.trigger("notification:new", { ...unreadItem, at: "2026-11-20T10:30:00.000Z" }));
    expect(screen.getAllByText("Move updated")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Recent updates" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Close updates" }));
    fireEvent.click(screen.getByRole("button", { name: "Recent updates" }));
    await waitFor(() => expect(getMyNotifications).toHaveBeenCalledTimes(2));
    await screen.findByText("The booking changed.");
    expect(screen.getByRole("button", { name: "Recent updates" })).toBeTruthy();
  });
});
