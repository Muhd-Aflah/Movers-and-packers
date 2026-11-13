import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "../services/auth.service";
import { setAuth } from "../utils/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    try {
      const data = await login(email, password);

      if (data?.token && data?.user) {
        setAuth({
          token: data.token,
          user: data.user,
        });

        if (data.user.role === "mover" && data.user.moverApprovalStatus !== "approved") {
          navigate("/mover/application", { replace: true });
          return;
        }

        // 🔑 Always go to dashboard
        const redirectTo = location.state?.redirectTo;
        navigate(
          typeof redirectTo === "string" && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
            ? redirectTo
            : "/dashboard",
          { replace: true },
        );
      }
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <form onSubmit={handleSubmit} className="w-96 p-6 shadow-lg rounded">
        <h2 className="text-2xl font-bold mb-4">Sign In</h2>

        {error && (
          <p className="mb-3 text-red-600 text-sm text-center">{error}</p>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        />

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
        >
          Login
        </button>

        <p className="text-sm text-center mt-4">
          Don&apos;t have an account?{" "}
          <Link to="/signup" state={location.state} className="text-indigo-600 font-semibold">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}
