import { Navigate } from "react-router-dom";
import { getAuthFromStorage } from "../utils/auth";
import { roleHome } from "../utils/roleRedirect";

export function DashboardRedirect() {
  const { role } = getAuthFromStorage();

  return role && roleHome[role] ? (
    <Navigate to={roleHome[role]} replace />
  ) : (
    <Navigate to="/login" replace />
  );
}
