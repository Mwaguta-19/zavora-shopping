import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Trash2,
  UserCheck,
  UserX,
  ShieldCheck,
  Shield,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import { authApi } from "@/api/auth";
import type { User } from "@/types";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const response = await authApi.getAdminUsers();

      setUsers(response.data);
    } catch (error: any) {
      console.error("Failed to load users:", error);

      toast.error(error?.response?.data?.detail || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) => {
      return (
        user.email?.toLowerCase().includes(query) ||
        user.first_name?.toLowerCase().includes(query) ||
        user.last_name?.toLowerCase().includes(query) ||
        user.full_name?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query)
      );
    });
  }, [users, search]);

  const toggleUserStatus = async (user: User) => {
    try {
      setActionLoading(user.id);

      const response = await authApi.updateAdminUser(user.id, {
        is_active: !user.is_active,
      });

      setUsers((currentUsers) =>
        currentUsers.map((item) =>
          item.id === user.id ? response.data : item,
        ),
      );

      toast.success(
        response.data.is_active
          ? "User activated successfully."
          : "User deactivated successfully.",
      );
    } catch (error: any) {
      console.error("Failed to update user:", error);

      toast.error(error?.response?.data?.detail || "Failed to update user.");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (user: User) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.full_name || user.email}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(user.id);

      await authApi.deleteAdminUser(user.id);

      setUsers((currentUsers) =>
        currentUsers.filter((item) => item.id !== user.id),
      );

      toast.success("User deleted successfully.");
    } catch (error: any) {
      console.error("Failed to delete user:", error);

      toast.error(error?.response?.data?.detail || "Failed to delete user.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage registered users and account status.
            </p>
          </div>

          <div className="rounded-lg bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-gray-500">Total Users</p>

            <p className="text-xl font-bold text-gray-900">{users.length}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email or phone..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
          />
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-xl bg-white shadow-sm">
          <div className="flex items-center gap-3 text-gray-500">
            <Loader2 size={24} className="animate-spin" />
            Loading users...
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                    User
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                    Phone
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                    Role
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                    Joined
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => {
                  const busy = actionLoading === user.id;

                  return (
                    <tr
                      key={user.id}
                      className="border-b last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-semibold text-orange-600">
                            {(
                              user.first_name?.[0] ||
                              user.email?.[0] ||
                              "U"
                            ).toUpperCase()}
                          </div>

                          <div>
                            <p className="font-medium text-gray-900">
                              {user.full_name ||
                                `${user.first_name} ${user.last_name}`}
                            </p>

                            <p className="text-sm text-gray-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.phone || "—"}
                      </td>

                      <td className="px-6 py-4">
                        {user.is_superuser ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                            <ShieldCheck size={14} />
                            Super Admin
                          </span>
                        ) : user.is_staff ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            <Shield size={14} />
                            Staff
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                            Customer
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            <UserCheck size={14} />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                            <UserX size={14} />
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : "—"}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={busy || user.is_superuser}
                            onClick={() => toggleUserStatus(user)}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {busy ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : user.is_active ? (
                              "Deactivate"
                            ) : (
                              "Activate"
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={busy || user.is_superuser}
                            onClick={() => deleteUser(user)}
                            className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Delete user"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-4 p-4 md:hidden">
            {filteredUsers.map((user) => {
              const busy = actionLoading === user.id;

              return (
                <div
                  key={user.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-semibold text-orange-600">
                      {(
                        user.first_name?.[0] ||
                        user.email?.[0] ||
                        "U"
                      ).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">
                        {user.full_name || user.email}
                      </p>

                      <p className="truncate text-sm text-gray-500">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Phone:</span>{" "}
                      {user.phone || "—"}
                    </p>

                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      {user.is_active ? "Active" : "Inactive"}
                    </p>

                    <p>
                      <span className="font-medium">Joined:</span>{" "}
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      disabled={busy || user.is_superuser}
                      onClick={() => toggleUserStatus(user)}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium disabled:opacity-50"
                    >
                      {user.is_active ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      type="button"
                      disabled={busy || user.is_superuser}
                      onClick={() => deleteUser(user)}
                      className="rounded-lg bg-red-50 p-2 text-red-600 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty */}
          {filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <p className="font-medium text-gray-700">No users found</p>

              <p className="mt-1 text-sm text-gray-500">
                Try changing your search.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
