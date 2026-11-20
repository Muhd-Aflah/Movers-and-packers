export const CUSTOMER_DASHBOARD_EVENTS = [
  "booking:created",
  "booking:updated",
  "booking:status_changed",
  "booking:cancelled",
  "estimate:created",
  "estimate:updated",
  "estimate:accepted",
  "estimate:rejected",
  "payment:initiated",
  "payment:success",
  "payment:failed",
  "payment:refunded",
];

export const ADMIN_DASHBOARD_EVENTS = CUSTOMER_DASHBOARD_EVENTS;
