import { useEffect, useState } from "react";
import { adminService } from "../../services/admin.service";

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await adminService.getAllUsers();
        setUsers(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) return <div>Loading users...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">All Users</h1>

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user._id} className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-md font-semibold">Name: {user.name}</p>
              <p className="text-sm text-gray-700">Email: {user.email}</p>
              <p className="text-sm text-gray-700">Role: {user.role}</p>
              <p className="text-xs text-gray-500">Joined: {new Date(user.createdAt)?.toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}