import { Check, Circle, Clock3 } from "lucide-react";
import { EmptyState } from "../ui/StatePanel";

const TRACKING_STAGES = [
  ["booking_requested", "Booking requested"],
  ["payment_confirmed", "Payment confirmed"],
  ["booking_confirmed", "Booking confirmed"],
  ["mover_assigned", "Mover assigned"],
  ["pickup_started", "Pickup / packing started"],
  ["in_transit", "In transit"],
  ["delivery_completed", "Delivery completed"],
];

const INDIA_TIME = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

function eventActor(event) {
  const name = typeof event.actor === "object" ? event.actor?.name : null;
  if (name) return name;
  if (event.actorRole === "system") return "SwiftMove payment processing";
  if (event.actorRole === "mover") return "Assigned mover";
  if (event.actorRole === "admin") return "SwiftMove administrator";
  if (event.actorRole === "user") return "Customer";
  return "SwiftMove";
}

export function MoveTrackingTimeline({ events = [] }) {
  const trackingEvents = Array.isArray(events) ? events : [];
  const eventsByType = new Map(trackingEvents.map((event) => [event.event, event]));

  if (trackingEvents.length === 0) {
    return (
      <div className="rounded-card border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
        <EmptyState
          title="No tracking updates yet"
          description="This move has no recorded tracking events. Updates will appear here as actions are confirmed."
        />
      </div>
    );
  }

  return (
    <ol aria-label="Move tracking history" className="space-y-0 rounded-card border border-slate-200 bg-card p-4 dark:border-slate-700 sm:p-5">
      {TRACKING_STAGES.map(([eventType, label], index) => {
        const event = eventsByType.get(eventType);
        const date = event?.at ? new Date(event.at) : null;
        const hasValidDate = date && Number.isFinite(date.getTime());
        return (
          <li key={eventType} className="relative flex min-h-16 gap-3 pb-4 last:min-h-0 last:pb-0">
            {index < TRACKING_STAGES.length - 1 && (
              <span aria-hidden="true" className={`absolute left-[0.6875rem] top-6 h-full w-px ${event ? "bg-blue-300 dark:bg-blue-800" : "bg-slate-200 dark:bg-slate-700"}`} />
            )}
            <span aria-hidden="true" className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${event ? "bg-blue-600 text-white dark:bg-blue-500" : "border border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-900"}`}>
              {event ? <Check className="h-4 w-4" /> : <Circle className="h-2.5 w-2.5 fill-current" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`font-medium ${event ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}>{label}</p>
              {event ? (
                <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-slate-600 dark:text-slate-300">
                  <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
                  <span>{hasValidDate ? INDIA_TIME.format(date) : "Time unavailable"}</span>
                  <span aria-hidden="true">·</span>
                  <span>{eventActor(event)}</span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Awaiting update</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
