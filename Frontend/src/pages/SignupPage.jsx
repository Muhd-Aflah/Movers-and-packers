import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signup } from "../services/auth.service";
import { setAuth } from "../utils/auth";

export function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const role = location.pathname.startsWith("/provider")
    ? "provider"
    : "user";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Please fill all fields");
      return;
    }

    try {
      const data = await signup(name, email, password, role);

      if (data?.token) {
        setAuth({
          token: data.token,
          user: data.user,
        });

        navigate(`/dashboard/${data.user.role}`);
      }
    } catch (err) {
      setError(err.message || "Signup failed");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <form onSubmit={handleSubmit} className="w-96 p-6 shadow-lg rounded">
        <h2 className="text-2xl font-bold mb-4">
          {role === "provider" ? "Provider Signup" : "Create Account"}
        </h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <input
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
        />

        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        />

        <button className="w-full bg-indigo-600 text-white py-2 rounded">
          Sign Up
        </button>

        {role === "user" && (
          <p className="text-sm text-center mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-600 font-semibold">
              Sign In
            </Link>
          </p>
        )}
      </form>
    </div>
  );
}
