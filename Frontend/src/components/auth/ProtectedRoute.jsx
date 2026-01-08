import { Navigate } from "react-router-dom";
import { getAuthFromStorage } from "../../utils/auth";

export function ProtectedRoute({ children, allowedRoles }) {
  const { token, role } = getAuthFromStorage();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
