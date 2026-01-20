import { Navigate } from "react-router-dom";
import { getAuthFromStorage } from "../../utils/auth";
import { roleHome } from "../../utils/roleRedirect";

export function ProtectedRoute({ children, allowedRoles }) {
  const { token, role } = getAuthFromStorage();

  // Not authenticated
  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but wrong role
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={roleHome[role]} replace />;
  }

  return children;
}
