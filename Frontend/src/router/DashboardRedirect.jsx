import { Navigate } from "react-router-dom";
import { getAuthFromStorage } from "../utils/auth";
import { roleHome } from "../utils/roleRedirect";

export function DashboardRedirect() {
  const { role, user } = getAuthFromStorage();

  if (role === "mover" && user?.moverApprovalStatus !== "approved") {
    return <Navigate to="/mover/application" replace />;
  }

  return role && roleHome[role] ? (
    <Navigate to={roleHome[role]} replace />
  ) : (
    <Navigate to="/login" replace />
  );
}
