// src/routes/RoleRoute.jsx
import { Navigate } from "react-router-dom";
import { getAuthFromStorage } from "../utils/auth";

export function RoleRoute({ allowedRoles, children }) {
  const { role } = getAuthFromStorage();

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
