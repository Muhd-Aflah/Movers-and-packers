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
  <div className="max-w-xl mx-auto p-6">
    {/* Profile Header */}
    <div className="flex items-center gap-4 mb-8">
      <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
        {profile.name?.charAt(0)?.toUpperCase()}
      </div>
      <div>
        <h1 className="text-xl font-semibold">{profile.name}</h1>
        <p className="text-sm text-gray-500">{profile.email}</p>
        <span className="inline-block mt-1 text-xs bg-gray-100 px-2 py-1 rounded">
          {role}
        </span>
      </div>
    </div>

    {/* Messages */}
    {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
    {success && <p className="mb-4 text-sm text-green-600">{success}</p>}

    {/* Profile Form */}
    <div className="bg-white border rounded-lg p-6 space-y-4">
      <h2 className="text-sm font-medium text-gray-700">
        Profile Information
      </h2>

      <div>
        <label className="text-sm text-gray-600">Full Name</label>
        <input
          value={profile.name}
          onChange={(e) =>
            setProfile({ ...profile, name: e.target.value })
          }
          className="mt-1 w-full border rounded px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm text-gray-600">Phone Number</label>
        <input
          value={profile.phone}
          onChange={(e) =>
            setProfile({ ...profile, phone: e.target.value })
          }
          className="mt-1 w-full border rounded px-3 py-2 text-sm"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm disabled:opacity-50 transition"
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  </div>
);
}