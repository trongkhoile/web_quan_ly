"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Account = {
  id: string;
  name: string;
  mt5Login: string;
  mt5Server: string;
  isActive: boolean;
  status: "pending" | "connected" | "failed";
  createdAt: string;
};

type User = { name: string; email: string; isAdmin: boolean };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState({ name: "", mt5Login: "", mt5Password: "", mt5Server: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => {
      if (!r.ok) { router.push("/login"); return; }
      return r.json();
    }).then((data) => data && setUser(data));
  }, [router]);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) setAccounts(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  // Poll khi có tài khoản đang pending
  useEffect(() => {
    if (!pendingId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/accounts");
        if (!res.ok) return;
        const list: Account[] = await res.json();
        setAccounts(list);
        const acc = list.find((a) => a.id === pendingId);
        if (!acc) { setPendingId(null); return; }
        if (acc.status === "connected") {
          setPendingId(null);
          setMessage({ type: "success", text: `✅ Tài khoản "${acc.name}" đã kết nối MT5 thành công!` });
        } else if (acc.status === "failed") {
          setPendingId(null);
          setMessage({ type: "error", text: `❌ Sai ID hoặc mật khẩu MT5. Vui lòng kiểm tra lại và xóa tài khoản này.` });
        }
      } catch { /* ignore poll errors */ }
    }, 4000);
    // Timeout sau 120s
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setPendingId(null);
      setMessage({ type: "error", text: "⏱ Kết nối MT5 mất quá lâu. Kiểm tra lại thông tin hoặc thử khởi động lại." });
    }, 120_000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [pendingId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: "success", text: "⏳ Đang kết nối tới MT5, vui lòng chờ..." });
      setForm({ name: "", mt5Login: "", mt5Password: "", mt5Server: "" });
      setShowForm(false);
      fetchAccounts();
      setPendingId(data.id);
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Xoá tài khoản "${name}"?`)) return;
    await fetch(`/api/accounts?id=${id}`, { method: "DELETE" });
    fetchAccounts();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  const inputCls =
    "w-full rounded-xl border border-gray-700 bg-gray-800/60 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition";

  const activeCount = accounts.filter((a) => a.isActive && a.status === "connected").length;

  return (
    <div className="min-h-screen bg-[#060d1a] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed top-0 left-1/3 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />

      {/* Navbar */}
      <nav className="border-b border-white/5 bg-[#060d1a]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight">Giao Dịch Tự Động</span>
          </Link>

          <div className="flex items-center gap-3">
            {user && (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {user.name[0]}
                  </div>
                  <span>{user.name}</span>
                </div>
                {user.isAdmin && (
                  <button
                    onClick={() => router.push("/admin")}
                    className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 text-xs font-medium text-yellow-400 hover:bg-yellow-500/20 transition"
                  >
                    ⚙ Quản trị
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:border-gray-500 hover:text-white transition"
                >
                  Đăng xuất
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Tài khoản MT5", value: accounts.length, color: "text-white" },
            { label: "Đang hoạt động", value: activeCount, color: "text-emerald-400" },
            { label: "Tốc độ đặt lệnh", value: "<1s", color: "text-blue-400" },
            { label: "Hoạt động", value: "24/7", color: "text-purple-400" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left: Accounts list */}
          <div className="lg:col-span-3 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Tài khoản MT5</h2>
              <button
                onClick={() => { setShowForm(!showForm); setMessage(null); }}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  showForm
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-emerald-500 text-black hover:bg-emerald-400"
                }`}
              >
                {showForm ? "✕ Hủy" : "+ Thêm tài khoản"}
              </button>
            </div>

            {/* Add account form */}
            {showForm && (
              <div className="bg-gray-900/80 border border-gray-700 rounded-2xl p-6">
                <h3 className="font-semibold mb-5 text-white">Thêm tài khoản MT5 mới</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Tên hiển thị
                      </label>
                      <input
                        type="text"
                        placeholder="Tài khoản chính"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-400 uppercase tracking-wide">
                        MT5 Login
                      </label>
                      <input
                        type="text"
                        placeholder="123456789"
                        value={form.mt5Login}
                        onChange={(e) => setForm({ ...form, mt5Login: e.target.value })}
                        required
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-400 uppercase tracking-wide">
                        MT5 Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={form.mt5Password}
                        onChange={(e) => setForm({ ...form, mt5Password: e.target.value })}
                        required
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-400 uppercase tracking-wide">
                        MT5 Server
                      </label>
                      <input
                        type="text"
                        placeholder="DupoinMarkets-Real"
                        value={form.mt5Server}
                        onChange={(e) => setForm({ ...form, mt5Server: e.target.value })}
                        required
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {message && (
                    <div
                      className={`rounded-xl px-4 py-3 text-sm ${
                        message.type === "success"
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                          : "bg-red-500/10 border border-red-500/20 text-red-400"
                      }`}
                    >
                      {message.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 px-4 py-3 text-sm font-bold text-black transition"
                  >
                    {loading ? "Đang xử lý..." : "Thêm tài khoản →"}
                  </button>
                </form>
              </div>
            )}

            {/* Message outside form */}
            {message && !showForm && (
              <div
                className={`rounded-xl px-4 py-3 text-sm ${
                  message.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Accounts */}
            {accounts.length === 0 ? (
              <div className="border border-dashed border-gray-700 rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-gray-400 font-medium">Chưa có tài khoản MT5 nào</p>
                <p className="text-gray-600 text-sm mt-1">Nhấn "+ Thêm tài khoản" để bắt đầu</p>
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="group bg-gray-900/60 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 flex items-center justify-between gap-4 transition"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <span className="text-emerald-400 font-bold text-sm">MT5</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white">{acc.name}</span>
                          {acc.status === "pending" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs font-medium text-yellow-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                              Đang kết nối...
                            </span>
                          ) : acc.status === "failed" ? (
                            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-400">
                              ✕ Sai thông tin
                            </span>
                          ) : acc.isActive ? (
                            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                              ● Hoạt động
                            </span>
                          ) : (
                            <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-400">
                              ○ Tắt
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 font-mono">
                          {acc.mt5Login} · {acc.mt5Server}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(acc.id, acc.name)}
                      className="opacity-0 group-hover:opacity-100 shrink-0 rounded-lg border border-red-800/50 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/20 transition"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info panel */}
          <div className="lg:col-span-2 space-y-5">
            {/* How it works */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
              <h3 className="font-semibold mb-4 text-sm text-gray-300 uppercase tracking-wide">
                Cách hoạt động
              </h3>
              <div className="space-y-4">
                {[
                  { step: "1", text: "Thêm tài khoản MT5 của bạn bên trái" },
                  { step: "2", text: "Hệ thống tự động kết nối MT5 terminal" },
                  { step: "3", text: "Đăng tín hiệu vào Telegram group" },
                  { step: "4", text: "Bot đặt lệnh trên tất cả tài khoản" },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-emerald-400 text-xs font-bold">{s.step}</span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-semibold text-emerald-400">Hệ thống đang hoạt động</span>
              </div>
              <p className="text-xs text-gray-500">
                Telegram bot đang lắng nghe tín hiệu 24/7. Tài khoản mới sẽ được kết nối trong vòng 30 giây.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
