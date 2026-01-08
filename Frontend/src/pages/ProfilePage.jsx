import { getAuthFromStorage } from "../utils/auth";

export function ProfilePage() {
  const { role, name, email } = getAuthFromStorage();

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Profile</h1>
      <p className="text-sm text-gray-600 mb-6">Role: {role || "unknown"}</p>

      <div className="border rounded-lg p-4 space-y-2">
        <div className="text-sm">
          <span className="font-semibold">Name:</span> {name || "-"}
        </div>
        <div className="text-sm">
          <span className="font-semibold">Email:</span> {email || "-"}
        </div>
      </div>

      <div className="mt-6">
        {role === "admin" && (
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Admin Profile</h2>
            <p className="text-sm text-gray-700">
              You have admin access. You can manage users, services, and platform settings.
            </p>
          </div>
        )}

        {role === "user" && (
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Customer Profile</h2>
            <p className="text-sm text-gray-700">
              View your bookings, addresses, and saved preferences here.
            </p>
          </div>
        )}

        {role && role !== "admin" && role !== "user" && (
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">{role} Profile</h2>
            <p className="text-sm text-gray-700">
              This profile page is ready; customize fields for the {role} role as needed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
