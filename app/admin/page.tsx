"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Mt5Account = {
  id: string;
  name: string;
  mt5Login: string;
  mt5Server: string;
  isActive: boolean;
  createdAt: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  accounts: Mt5Account[];
};

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403 || res.redirected) { router.push("/dashboard"); return; }
      if (res.ok) setUsers(await res.json());
    } catch {
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Xóa người dùng "${name}" và toàn bộ tài khoản MT5 của họ?`)) return;
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchUsers();
    else {
      const d = await res.json();
      alert(d.error);
    }
  }

  async function deleteAccount(id: string, name: string) {
    if (!confirm(`Xóa tài khoản MT5 "${name}"? Terminal sẽ tự đóng trong vòng 30 giây.`)) return;
    const res = await fetch(`/api/admin/accounts?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchUsers();
  }

  async function toggleAccount(id: string, isActive: boolean) {
    await fetch(`/api/admin/accounts?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchUsers();
  }

  const totalAccounts = users.reduce((s, u) => s + u.accounts.length, 0);
  const totalActive = users.reduce((s, u) => s + u.accounts.filter((a) => a.isActive).length, 0);

  return (
    <div className="min-h-screen bg-[#060d1a] text-white">
      <div className="pointer-events-none fixed top-0 right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />

      {/* Navbar */}
      <nav className="border-b border-white/5 bg-[#060d1a]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight">Giao Dịch Tự Động</span>
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-sm text-yellow-400 font-medium">Quản trị</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:border-gray-500 hover:text-white transition"
            >
              ← Dashboard
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Người dùng", value: users.length, color: "text-white" },
            { label: "Tài khoản MT5", value: totalAccounts, color: "text-emerald-400" },
            { label: "Đang hoạt động", value: totalActive, color: "text-blue-400" },
            { label: "Đã tắt", value: totalAccounts - totalActive, color: "text-gray-500" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <h2 className="text-lg font-bold mb-5">Danh sách người dùng</h2>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center text-gray-500 py-16">Chưa có người dùng nào</div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden transition hover:border-gray-700"
              >
                {/* User row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <button
                    onClick={() => toggleExpand(user.id)}
                    className="text-gray-500 hover:text-white transition text-sm w-5 text-center shrink-0"
                  >
                    {expanded.has(user.id) ? "▾" : "▸"}
                  </button>

                  <div className="w-9 h-9 rounded-xl bg-gray-700 flex items-center justify-center shrink-0 font-bold text-sm uppercase">
                    {user.name[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">{user.name}</span>
                      {user.isAdmin && (
                        <span className="rounded-full bg-yellow-500/15 border border-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-400">
                          Admin
                        </span>
                      )}
                      <span className="rounded-full bg-gray-700/60 px-2 py-0.5 text-xs text-gray-400">
                        {user.accounts.length} MT5
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
                  </div>

                  <span className="text-xs text-gray-600 hidden sm:block shrink-0">
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </span>

                  {!user.isAdmin && (
                    <button
                      onClick={() => deleteUser(user.id, user.name)}
                      className="rounded-xl border border-red-800/50 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/20 transition shrink-0"
                    >
                      Xóa user
                    </button>
                  )}
                </div>

                {/* Accounts */}
                {expanded.has(user.id) && (
                  <div className="border-t border-gray-800 bg-gray-950/40">
                    {user.accounts.length === 0 ? (
                      <p className="px-14 py-4 text-sm text-gray-600">Chưa có tài khoản MT5</p>
                    ) : (
                      <div className="divide-y divide-gray-800/50">
                        {user.accounts.map((acc) => (
                          <div key={acc.id} className="flex items-center gap-4 px-14 py-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                              <span className="text-emerald-400 text-xs font-bold">MT5</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-white">{acc.name}</span>
                              <p className="text-xs text-gray-500 font-mono mt-0.5">
                                {acc.mt5Login} · {acc.mt5Server}
                              </p>
                            </div>
                            <button
                              onClick={() => toggleAccount(acc.id, acc.isActive)}
                              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                                acc.isActive
                                  ? "bg-emerald-500/15 text-emerald-400 hover:bg-red-500/15 hover:text-red-400"
                                  : "bg-gray-700/60 text-gray-400 hover:bg-emerald-500/15 hover:text-emerald-400"
                              }`}
                            >
                              {acc.isActive ? "● Hoạt động" : "○ Tắt"}
                            </button>
                            <button
                              onClick={() => deleteAccount(acc.id, acc.name)}
                              className="text-xs text-red-400 hover:text-red-300 transition px-2"
                            >
                              Xóa
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 text-xs text-gray-700 text-center">
          Xóa tài khoản MT5 → terminal tự đóng trong vòng 30 giây.
        </p>
      </main>
    </div>
  );
}
