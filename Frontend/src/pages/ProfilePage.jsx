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
  const [isEditing, setIsEditing] = useState(false);

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
  <div className="min-h-[70vh] flex items-start justify-center px-4">
    <div className="w-full max-w-md bg-white border rounded-xl shadow-sm p-6">

      {/* Avatar + Basic Info */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold">
          {profile.name?.charAt(0)?.toUpperCase()}
        </div>

        <h1 className="mt-4 text-xl font-semibold text-gray-800">
          {profile.name}
        </h1>

        <p className="text-sm text-gray-500">{profile.email}</p>

        <span className="mt-2 inline-block text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700">
          {role}
        </span>
      </div>

      {/* Messages */}
      {error && (
        <p className="mb-4 text-sm text-red-600 text-center">{error}</p>
      )}
      {success && (
        <p className="mb-4 text-sm text-green-600 text-center">{success}</p>
      )}

      {/* Profile Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={profile.name}
            disabled={!isEditing}
            onChange={(e) =>
              setProfile({ ...profile, name: e.target.value })
            }
            className={`w-full border rounded-md px-3 py-2 text-sm
              ${!isEditing ? "bg-gray-100 cursor-not-allowed" : ""}`}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={profile.phone}
            disabled={!isEditing}
            onChange={(e) =>
              setProfile({ ...profile, phone: e.target.value })
            }
            placeholder="Your contact number"
            className={`w-full border rounded-md px-3 py-2 text-sm
              ${!isEditing ? "bg-gray-100 cursor-not-allowed" : ""}`}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end gap-3">
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm px-4 py-2 rounded-md border hover:bg-gray-50"
          >
            Edit Profile
          </button>
        ) : (
          <>
            <button
              onClick={() => {
                setIsEditing(false);
                setError("");
                setSuccess("");
              }}
              className="text-sm px-4 py-2 rounded-md border hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              onClick={async () => {
                await handleSave();
                setIsEditing(false);
              }}
              disabled={saving}
              className="text-sm px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </>
        )}
      </div>

      {/* Account Info */}
      <div className="mt-6 pt-4 border-t text-sm text-gray-600">
        <p>User ID: {userId}</p>
        <p className="mt-1">Account type: {role}</p>
      </div>
    </div>
  </div>
);
}