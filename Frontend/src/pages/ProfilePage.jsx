import { useEffect, useState } from "react";
import { getAuthFromStorage } from "../utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function ProfilePage() {
  const { token, userId, role } = getAuthFromStorage();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch logged-in user profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        setError("");

       await fetch(`${API_BASE_URL}/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await res.json();

        setProfile({
          name: data.name || "",
          email: data.email || "",
        });
      } catch (err) {
        console.error(err);
        setError("Unable to load profile information.");
      } finally {
        setLoading(false);
      }
    }

    if (token && userId) {
      fetchProfile();
    }
  }, [token, userId]);

  // Update profile
  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name,
        }),
      });

      if (!res.ok) {
        throw new Error("Update failed");
      }

      setSuccess("Profile updated successfully.");
    } catch (err) {
      console.error(err);
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-gray-600">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-600">Role: {role || "unknown"}</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Profile Card */}
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">
          Basic Information
        </h2>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your name"
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={profile.email}
            disabled
            className="w-full rounded-md border px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Role info */}
      <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
        {role === "admin" && (
          <>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">
              Admin Access
            </h2>
            <p className="text-sm text-gray-700">
              You have full access to manage users, services, and platform
              settings.
            </p>
          </>
        )}

        {role === "user" && (
          <>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">
              Customer Account
            </h2>
            <p className="text-sm text-gray-700">
              Manage your bookings, payments, and profile information here.
            </p>
          </>
        )}

        {role && role !== "admin" && role !== "user" && (
          <>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">
              {role.charAt(0).toUpperCase() + role.slice(1)} Account
            </h2>
            <p className="text-sm text-gray-700">
              Profile customization for this role can be added later.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
