"use client";

import {
  addUserToClan,
  createTestUser,
  deleteAllTestUsers,
  deleteTestUser,
  impersonateUser,
} from "@/app/actions/dev";
import {
  AlertTriangle,
  Loader2,
  LogIn,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface User {
  id: string;
  email: string | undefined;
  username: string;
  created_at: string;
}

interface Clan {
  id: string;
  name: string;
}

export function DevShellClient({
  initialUsers,
  clans,
}: {
  initialUsers: User[];
  clans: Clan[];
}) {
  const [newUsername, setNewUsername] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername) return;
    setLoading("creating");
    try {
      const res = await createTestUser(newUsername);
      if (res.error) {
        alert(res.error);
      } else {
        setNewUsername("");
        router.refresh();
      }
    } catch (err) {
      alert("Error creating user");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this test user?")) return;
    setLoading(`deleting-${userId}`);
    try {
      const res = await deleteTestUser(userId);
      if (res.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      alert("Error deleting user");
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteAll = async () => {
    if (
      !confirm(
        "CRITICAL: Are you sure you want to delete ALL test users? This cannot be undone.",
      )
    )
      return;
    setLoading("deleting-all");
    try {
      const res = (await deleteAllTestUsers()) as any;
      if (res.error) {
        alert(res.error);
      } else {
        alert(`Deleted ${res.count} test users.`);
        router.refresh();
      }
    } catch (err) {
      alert("Error deleting all users");
    } finally {
      setLoading(null);
    }
  };

  const handleImpersonate = async (userId: string) => {
    setLoading(`login-${userId}`);
    try {
      const res = await impersonateUser(userId);
      if (res.error) {
        alert(res.error);
      } else if (res.link) {
        window.location.href = res.link;
      }
    } catch (err) {
      alert("Error logging in");
    } finally {
      setLoading(null);
    }
  };

  const handleAddToClan = async (userId: string, clanId: string) => {
    if (!clanId) return;
    setLoading(`clan-${userId}`);
    try {
      const res = await addUserToClan(userId, clanId);
      if (res.error) {
        alert(res.error);
      } else {
        alert("Added to clan!");
        router.refresh();
      }
    } catch (err) {
      alert("Error adding to clan");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create User Section */}
      <section className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <UserPlus className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Create Test User</h2>
        </div>

        <form
          onSubmit={handleCreate}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Enter username (e.g. TestPlayer1)"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            disabled={!!loading}
          />
          <button
            type="submit"
            disabled={!!loading || !newUsername}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-blue-950 font-bold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 min-w-[140px]"
          >
            {loading === "creating" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Create
              </>
            )}
          </button>
        </form>
      </section>

      {/* Users List Section */}
      <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white">
              Test Users ({initialUsers.length})
            </h2>
          </div>

          {initialUsers.length > 0 && (
            <button
              onClick={handleDeleteAll}
              disabled={!!loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            >
              {loading === "deleting-all" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Cleanup All
                </>
              )}
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 text-left text-white/50 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">User Info</th>
                <th className="px-6 py-4 font-semibold text-center">
                  Group Management
                </th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {initialUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-white font-bold">
                        {user.username}
                      </span>
                      <span className="text-white/40 text-xs truncate max-w-[200px]">
                        {user.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <select
                        onChange={(e) =>
                          handleAddToClan(user.id, e.target.value)
                        }
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                        defaultValue=""
                        disabled={!!loading}
                      >
                        <option value="" disabled className="bg-blue-900">
                          Add to Clan...
                        </option>
                        {clans.map((clan) => (
                          <option
                            key={clan.id}
                            value={clan.id}
                            className="bg-blue-900"
                          >
                            {clan.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleImpersonate(user.id)}
                        disabled={!!loading}
                        className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-all"
                        title="Login as user"
                      >
                        {loading === `login-${user.id}` ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <LogIn className="w-5 h-5" />
                        )}
                      </button>

                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={!!loading}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                        title="Delete user"
                      >
                        {loading === `deleting-${user.id}` ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {initialUsers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-white/30">
                      <Users className="w-12 h-12 opacity-20" />
                      <p>No test users found. Create your first one above!</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
