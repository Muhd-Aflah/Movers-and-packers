import { useEffect, useState } from "react";
import { Bell, LoaderCircle, RefreshCw, X } from "lucide-react";
import { Link } from "react-router-dom";
import { getMyNotifications } from "../../services/notification.service";

const DATE_FORMAT = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

export function NotificationCenter({ role }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const isMover = role === "mover";
  const updatesPath = isMover ? "/dashboard/provider/my-jobs" : "/dashboard/user";

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    setStatus("loading");
    setError("");
    getMyNotifications(role)
      .then((result) => {
        if (!active) return;
        setNotifications(Array.isArray(result?.notifications) ? result.notifications : []);
        setStatus("success");
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message || "Could not load updates.");
        setStatus("error");
      });
    return () => { active = false; };
  }, [open, role, retry]);

  const visibleCount = notifications.length > 9 ? "9+" : notifications.length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={notifications.length ? `Recent updates, ${notifications.length} items` : "Recent updates"}
        aria-expanded={open}
        aria-controls="portal-notifications"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-control border border-slate-200 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sm-primary dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {notifications.length > 0 && <span aria-hidden="true" className="absolute right-1 top-1 min-w-4 rounded-full bg-blue-600 px-1 text-[10px] font-bold leading-4 text-white">{visibleCount}</span>}
      </button>
      {open && (
        <section id="portal-notifications" aria-label="Recent updates" className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <div>
              <h2 className="font-semibold">Recent updates</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">Confirmed activity on your {isMover ? "assigned moves" : "moves"}</p>
            </div>
            <div className="flex items-center gap-1">
              {status === "error" && <button type="button" aria-label="Retry loading updates" onClick={() => setRetry((value) => value + 1)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:hover:bg-slate-800"><RefreshCw className="h-4 w-4" aria-hidden="true" /></button>}
              <button type="button" aria-label="Close updates" onClick={() => setOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:hover:bg-slate-800"><X className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          </header>
          <div className="max-h-[min(65vh,28rem)] overflow-y-auto">
            {status === "loading" && <p role="status" className="flex items-center gap-2 px-4 py-6 text-sm text-slate-600 dark:text-slate-300"><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading updates...</p>}
            {status === "error" && <p role="alert" className="px-4 py-5 text-sm text-red-700 dark:text-red-300">{error}</p>}
            {status === "success" && notifications.length === 0 && <p role="status" className="px-4 py-6 text-sm text-slate-600 dark:text-slate-300">No move updates yet.</p>}
            {status === "success" && notifications.length > 0 && (
              <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <Link to={updatesPath} onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 dark:hover:bg-slate-800">
                      <p className="text-sm font-semibold">{notification.title}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{notification.message}</p>
                      <time className="mt-1 block text-xs text-slate-500 dark:text-slate-400" dateTime={notification.at}>{DATE_FORMAT.format(new Date(notification.at))}</time>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
