import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/auth.service";
import { setUserInStorage } from "../utils/auth";

export function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();

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

    localStorage.setItem("token", data.token);

    if (data) {
      setUserInStorage({
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
      });
    }

    console.log("Logged in user:", data);

    const redirectTo = location.state?.redirectTo || "/";
    navigate(redirectTo, {
      state: location.state?.bookingData || null,
    });
  } catch (err) {
    setError(err.message);
  }
};


  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <form
        onSubmit={handleSubmit}
        className="w-96 p-6 shadow-lg rounded"
      >
        <h2 className="text-2xl font-bold mb-4">Sign In</h2>

        {error && (
          <p className="mb-3 text-red-600 text-sm text-center">
            {error}
          </p>
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
          Don't have an account?{" "}
          <Link to="/signup" className="text-indigo-600 font-semibold">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}
