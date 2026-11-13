import { Navigate } from "react-router-dom";
import { getAuthFromStorage } from "../../utils/auth";

export function ProtectedRoute({ children, allowedRoles, requireApprovedMover = false }) {
  const { token, role, user } = getAuthFromStorage();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/" replace />;
    }
  }

  if (requireApprovedMover && role === "mover" && user?.moverApprovalStatus !== "approved") {
    return <Navigate to="/mover/application" replace />;
  }

  return children;
}
