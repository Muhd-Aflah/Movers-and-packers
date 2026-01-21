import { useEffect, useState } from "react";
import { getAuthFromStorage } from "../utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export function ProfilePage() {
  const { token, user, role } = getAuthFromStorage();
  const userId = user?._id;

  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token || !userId) return;

    async function fetchProfile() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error();
        
        const data = await res.json();
        setProfile({ 
          name: data.name || "", 
          email: data.email || "",
          phone: data.phone || ""
        });
      } catch {
        setError("Could not load profile");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [token, userId]);

  async function handleSave() {
    if (!profile.name.trim()) {
      setError("Please enter your name");
      return;
    }

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
          phone: profile.phone 
        }),
      });

      if (!res.ok) throw new Error();
      setSuccess("Profile saved!");
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div>Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        <div className="mt-1 text-gray-600">
          {role === "admin" ? "Administrator" : 
           role === "mover" ? "Mover Staff" : "Customer"}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded border border-green-300">
          {success}
        </div>
      )}

      <div className="bg-white border rounded-lg p-5 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full p-2 border rounded bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Your contact number"
            />
            <p className="text-xs text-gray-500 mt-1">For delivery updates</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-6 bg-blue-600 text-white p-2.5 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded border">
        <h3 className="font-medium text-gray-700 mb-2">Account Details</h3>
        <p className="text-sm text-gray-600">User ID: {userId}</p>
        <p className="text-sm text-gray-600 mt-1">Account type: {role}</p>
      </div>
    </div>
  );
}