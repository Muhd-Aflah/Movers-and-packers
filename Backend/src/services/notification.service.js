const Move = require("../models/move.model");

const CUSTOMER_EVENT_COPY = {
  booking_requested: ["Booking requested", "Your move request was submitted."],
  payment_confirmed: ["Payment confirmed", "Your payment was verified and applied to the move."],
  booking_confirmed: ["Booking confirmed", "A mover accepted your move request."],
  mover_assigned: ["Mover assigned", "A mover has been assigned to your move."],
  pickup_started: ["Pickup started", "Pickup and packing have started."],
  in_transit: ["Move in transit", "Your move is in transit."],
  delivery_completed: ["Delivery completed", "Delivery has been completed."],
};

const MOVER_EVENT_COPY = {
  mover_assigned: ["Job assigned", "You are now assigned to this move."],
  pickup_started: ["Pickup recorded", "Pickup and packing have started."],
  in_transit: ["Move marked in transit", "You recorded this move as in transit."],
  delivery_completed: ["Delivery completed", "You recorded this delivery as completed."],
};

const getRecentNotifications = async ({ userId, role }) => {
  if (!userId || !["user", "mover"].includes(role)) return [];

  const filter = role === "user" ? { user: userId } : { provider: userId };
  const moves = await Move.find(filter)
    .select("trackingEvents")
    .sort({ updatedAt: -1, _id: -1 })
    .limit(50)
    .lean();
  const eventCopy = role === "user" ? CUSTOMER_EVENT_COPY : MOVER_EVENT_COPY;
  const notifications = [];
  const seen = new Set();

  for (const move of moves || []) {
    for (const event of move.trackingEvents || []) {
      const copy = eventCopy[event.event];
      if (!copy || !event.at || !Number.isFinite(new Date(event.at).getTime())) continue;
      const moveId = String(move._id);
      const id = `${moveId}:${event.event}`;
      if (seen.has(id)) continue;
      seen.add(id);
      notifications.push({
        id,
        moveId,
        event: event.event,
        title: copy[0],
        message: copy[1],
        at: new Date(event.at).toISOString(),
      });
    }
  }

  return notifications.sort((left, right) => right.at.localeCompare(left.at)).slice(0, 50);
};

module.exports = { getRecentNotifications };
