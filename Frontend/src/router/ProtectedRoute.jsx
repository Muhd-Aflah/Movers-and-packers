import { Navigate } from "react-router-dom";
import { getAuthFromStorage } from "../utils/auth";

export function ProtectedRoute({ children, allowedRoles }) {
  const { token, role } = getAuthFromStorage();

  // Not logged in or corrupted auth
  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
