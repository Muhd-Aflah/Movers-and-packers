import { useEffect, useState } from "react";
import { getAuthFromStorage } from "../utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export function ProfilePage() {
  const { token, user, role } = getAuthFromStorage();
  const userId = user?._id;

  const [profile, setProfile] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch profile
  useEffect(() => {
    if (!token || !userId) return;

    async function fetchProfile() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error();

        const data = await res.json();
        setProfile({ name: data.name, email: data.email });
      } catch {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [token, userId]);

  // Save name only
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
        body: JSON.stringify({ name: profile.name }),
      });

      if (!res.ok) throw new Error();
      setSuccess("Profile updated.");
    } catch {
      setError("Update failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-gray-600">Loading…</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-1">Profile</h1>
      <p className="text-sm text-gray-500 mb-6">Role: {role}</p>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {success && <p className="mb-4 text-sm text-green-600">{success}</p>}

      <div className="bg-white border rounded-lg p-5 space-y-4">
        <div>
          <label className="text-sm text-gray-600">Name</label>
          <input
            value={profile.name}
            onChange={(e) =>
              setProfile({ ...profile, name: e.target.value })
            }
            className="mt-1 w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Email</label>
          <input
            value={profile.email}
            disabled
            className="mt-1 w-full border rounded px-3 py-2 text-sm bg-gray-100"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
