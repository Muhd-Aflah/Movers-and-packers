const Move = require("../models/move.model");
const User = require("../models/User.model");
const Notification = require("../models/notification.model");
const mongoose = require("mongoose");
const { emitToAdmins, emitToUser } = require("../realtime/socket");

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

const idOf = (value) => value?._id ? String(value._id) : value ? String(value) : "";

const publicNotification = (record) => ({
  id: String(record._id),
  type: record.type,
  event: record.type,
  title: record.title,
  message: record.message,
  moveId: record.relatedMove ? idOf(record.relatedMove) : null,
  at: new Date(record.createdAt).toISOString(),
  readAt: record.readAt ? new Date(record.readAt).toISOString() : null,
  isRead: Boolean(record.readAt),
});

const persistNotification = async ({ recipient, recipientRole, eventKey, type, title, message, relatedMove = null, sourceTrackingEvent = null }) => {
  try {
    const record = await Notification.create({
      recipient,
      recipientRole,
      eventKey,
      type,
      title,
      message,
      relatedMove,
      sourceTrackingEvent,
    });
    return { record, created: true };
  } catch (error) {
    if (error?.code !== 11000) throw error;
    return {
      record: await Notification.findOne({ recipient, eventKey }),
      created: false,
    };
  }
};

const notifyRecipients = async ({ recipients, eventKey, type, title, message, moveId, sourceTrackingEvent }) => {
  const created = [];
  for (const recipient of recipients) {
    try {
      const result = await persistNotification({
        ...recipient,
        eventKey,
        type,
        title,
        message,
        relatedMove: moveId || null,
        sourceTrackingEvent: sourceTrackingEvent || null,
      });
      if (result?.created && result.record) {
        const notification = publicNotification(result.record);
        emitToUser(recipient.recipient, "notification:new", notification);
        created.push(notification);
      }
    } catch (error) {
      // A notification storage problem must not roll back a completed booking,
      // estimate, or payment. The caller still emits the non-notification event.
      console.error("Notification persistence failed", {
        code: Number.isSafeInteger(error?.code) ? error.code : null,
        name: typeof error?.name === "string" ? error.name.slice(0, 40) : "Error",
      });
    }
  }
  return created;
};

const publishMoveEvent = async ({
  move,
  eventKey,
  events,
  customer = true,
  admins = true,
  mover = false,
  notification,
  adminNotification,
}) => {
  const moveId = idOf(move?._id);
  if (!moveId || mongoose.connection.readyState !== 1) return;
  const payload = {
    moveId,
    ...(Number.isSafeInteger(move.pricingVersion) ? { pricingVersion: move.pricingVersion } : {}),
    ...(typeof move.status === "string" ? { status: move.status } : {}),
    at: new Date().toISOString(),
  };
  const recipients = [];
  const customerId = idOf(move.user);
  const moverId = idOf(move.provider);

  if (notification && customerId) {
    recipients.push({ recipient: customerId, recipientRole: "user" });
  }
  if (adminNotification) {
    try {
      const adminsList = await User.find({ role: "admin", isActive: { $ne: false } }).select("_id").lean();
      recipients.push(...adminsList.map((admin) => ({ recipient: String(admin._id), recipientRole: "admin" })));
    } catch (error) {
      console.error("Admin notification recipients unavailable", {
        code: Number.isSafeInteger(error?.code) ? error.code : null,
        name: typeof error?.name === "string" ? error.name.slice(0, 40) : "Error",
      });
    }
  }
  if (notification && customerId) {
    await notifyRecipients({
      recipients: recipients.filter((recipient) => recipient.recipientRole === "user"),
      eventKey,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      moveId,
      sourceTrackingEvent: notification.sourceTrackingEvent,
    });
  }
  if (adminNotification && recipients.some((recipient) => recipient.recipientRole === "admin")) {
    const adminRecipients = recipients.filter((recipient) => recipient.recipientRole === "admin");
    await notifyRecipients({
      recipients: adminRecipients,
      eventKey,
      type: adminNotification.type,
      title: adminNotification.title,
      message: adminNotification.message,
      moveId,
      sourceTrackingEvent: adminNotification.sourceTrackingEvent,
    });
  }

  for (const event of events || []) {
    if (customer && customerId) emitToUser(customerId, event, payload);
    if (admins) emitToAdmins(event, payload);
    if (mover && moverId) emitToUser(moverId, event, payload);
  }
};

const publishPaymentSuccess = async ({ move, paymentId }) => {
  if (!move?._id || !paymentId) return;
  await publishMoveEvent({
    move,
    eventKey: `payment:success:${paymentId}`,
    events: ["payment:success", "booking:updated"],
    notification: {
      type: "payment:success",
      title: "Payment confirmed",
      message: "Your payment was verified and applied to the move.",
      sourceTrackingEvent: "payment_confirmed",
    },
    adminNotification: {
      type: "payment:success",
      title: "Payment completed",
      message: "A customer payment was verified and applied to a move.",
    },
  });
};

const publishMoveEventSafely = async (options) => {
  try {
    await publishMoveEvent(options);
  } catch (error) {
    console.error("Realtime event publication failed", {
      code: Number.isSafeInteger(error?.code) ? error.code : null,
      name: typeof error?.name === "string" ? error.name.slice(0, 40) : "Error",
    });
  }
};

const publishPaymentSuccessSafely = async (options) => {
  try {
    await publishPaymentSuccess(options);
  } catch (error) {
    console.error("Realtime payment event publication failed", {
      code: Number.isSafeInteger(error?.code) ? error.code : null,
      name: typeof error?.name === "string" ? error.name.slice(0, 40) : "Error",
    });
  }
};

const getRecentNotifications = async ({ userId, role }) => {
  if (!userId || !["user", "mover", "admin"].includes(role)) return [];
  const stored = mongoose.connection.readyState === 1
    ? await Notification.find({ recipient: userId, recipientRole: role })
      .sort({ createdAt: -1, _id: -1 })
      .limit(50)
      .lean()
    : [];
  const notifications = stored.map(publicNotification);
  if (role === "admin") return notifications;

  const filter = role === "user" ? { user: userId } : { provider: userId };
  const moves = await Move.find(filter)
    .select("trackingEvents")
    .sort({ updatedAt: -1, _id: -1 })
    .limit(50)
    .lean();
  const copy = role === "user" ? CUSTOMER_EVENT_COPY : MOVER_EVENT_COPY;
  const storedTrackingEvents = new Set(stored
    .filter((record) => record.relatedMove && record.sourceTrackingEvent)
    .map((record) => `${idOf(record.relatedMove)}:${record.sourceTrackingEvent}`));
  const seen = new Set(notifications.map((notification) => notification.id));

  for (const move of moves || []) {
    for (const event of move.trackingEvents || []) {
      const text = copy[event.event];
      const moveId = String(move._id);
      const id = `${moveId}:${event.event}:${new Date(event.at).toISOString()}`;
      if (!text || !event.at || !Number.isFinite(new Date(event.at).getTime()) || seen.has(id) || storedTrackingEvents.has(`${moveId}:${event.event}`)) continue;
      seen.add(id);
      notifications.push({
        id,
        moveId,
        event: event.event,
        type: event.event,
        title: text[0],
        message: text[1],
        at: new Date(event.at).toISOString(),
        readAt: new Date(event.at).toISOString(),
        isRead: true,
      });
    }
  }
  return notifications.sort((left, right) => right.at.localeCompare(left.at)).slice(0, 50);
};

module.exports = {
  getRecentNotifications,
  notifyRecipients,
  publishMoveEvent,
  publishMoveEventSafely,
  publishPaymentSuccess,
  publishPaymentSuccessSafely,
};
