import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentProfile } from "../services/auth.service";
import { clearAuthStorage, getAuthFromStorage, setAuth } from "../utils/auth";

export function MoverApplicationPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getAuthFromStorage().user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getCurrentProfile()
      .then(({ user: currentUser }) => {
        if (!active) return;
        setUser(currentUser);
        setAuth({ token: getAuthFromStorage().token, user: currentUser });
        if (currentUser.role === "mover" && currentUser.moverApprovalStatus === "approved") {
          navigate("/dashboard/provider", { replace: true });
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Could not refresh application status");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [navigate]);

  const status = user?.moverApprovalStatus || "pending";
  const logout = () => {
    clearAuthStorage();
    navigate("/login", { replace: true });
  };

  return (
    <main className="mx-auto my-12 max-w-xl rounded-xl border bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Mover application</p>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">
        {status === "rejected" ? "Application decision" : "Your application is under review"}
      </h1>
      {status === "rejected" ? (
        <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
          <p>Your mover application was not approved.</p>
          {user?.moverReviewReason && <p className="mt-2"><strong>Reason:</strong> {user.moverReviewReason}</p>}
          <p className="mt-2">Contact SwiftMove support if you have questions about this decision.</p>
        </div>
      ) : (
        <p className="mt-4 text-gray-700">
          Thanks for registering. An administrator must verify and approve your account before you can view or accept mover jobs.
        </p>
      )}
      {loading && <p className="mt-4 text-sm text-gray-500">Checking your latest application status…</p>}
      {error && <p role="alert" className="mt-4 text-sm text-amber-700">{error}. Sign in again later to refresh your status.</p>}
      <div className="mt-6 flex items-center gap-4">
        <button type="button" onClick={logout} className="rounded bg-gray-900 px-4 py-2 text-white">Sign out</button>
        <Link to="/" className="text-sm font-medium text-indigo-700">Return home</Link>
      </div>
    </main>
  );
}
