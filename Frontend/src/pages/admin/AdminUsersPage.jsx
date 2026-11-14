import { useCallback } from "react";
import { adminService } from "../../services/admin.service";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { usePaginatedData } from "../../hooks/usePaginatedData";

export function AdminUsersPage() {
  const fetchPage = useCallback((page) => adminService.getAllUsersPage(page), []);
  const { items: users, loading, error, page, pagination, setPage } = usePaginatedData(fetchPage);

  if (loading && !pagination) return <div>Loading users...</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">All Users</h1>
      {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}

      {users.length === 0 && error ? null : users.length === 0 ? (
        <p>{loading ? "Loading users..." : "No users found."}</p>
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
      {pagination && <PaginationControls pagination={pagination} page={page} onPageChange={setPage} disabled={loading} label="Users pagination" />}
    </div>
  );
}
