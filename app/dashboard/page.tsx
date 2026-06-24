"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const T = "#00b894";
const NAVY = "#0d2137";

type Account = {
  id: string; name: string; mt5Login: string; mt5Server: string;
  isActive: boolean; status: "pending" | "connected" | "failed"; createdAt: string;
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
    try { const res = await fetch("/api/accounts"); if (res.ok) setAccounts(await res.json()); } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  useEffect(() => {
    if (!pendingId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/accounts"); if (!res.ok) return;
        const list: Account[] = await res.json(); setAccounts(list);
        const acc = list.find((a) => a.id === pendingId);
        if (!acc) { setPendingId(null); return; }
        if (acc.status === "connected") { setPendingId(null); setMessage({ type: "success", text: `✅ Tài khoản "${acc.name}" đã kết nối MT5 thành công!` }); }
        else if (acc.status === "failed") { setPendingId(null); setMessage({ type: "error", text: `❌ Sai ID hoặc mật khẩu MT5. Vui lòng kiểm tra lại và xóa tài khoản này.` }); }
      } catch { /* ignore */ }
    }, 4000);
    const timeout = setTimeout(() => {
      clearInterval(interval); setPendingId(null);
      setMessage({ type: "error", text: "⏱ Kết nối MT5 mất quá lâu. Kiểm tra lại thông tin hoặc thử khởi động lại." });
    }, 120_000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [pendingId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMessage(null);
    try {
      const res = await fetch("/api/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: "success", text: "⏳ Đang kết nối tới MT5, vui lòng chờ..." });
      setForm({ name: "", mt5Login: "", mt5Password: "", mt5Server: "" });
      setShowForm(false); fetchAccounts(); setPendingId(data.id);
    } catch (err) { setMessage({ type: "error", text: (err as Error).message }); } finally { setLoading(false); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Xoá tài khoản "${name}"?`)) return;
    await fetch(`/api/accounts?id=${id}`, { method: "DELETE" }); fetchAccounts();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }); router.push("/");
  }

  const inputCls = "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#0d2137] placeholder-gray-400 focus:border-[#00b894] focus:outline-none focus:ring-2 focus:ring-[#00b894]/15 transition";
  const activeCount = accounts.filter((a) => a.isActive && a.status === "connected").length;

  return (
    <div className="min-h-screen bg-white text-[#0d2137]" style={{ fontFamily: "sans-serif" }}>
      {/* Background decoration */}
      <div className="pointer-events-none fixed top-0 right-0 w-1/2 h-full -z-10"
        style={{ background: "radial-gradient(ellipse at 90% 20%, rgba(0,184,148,0.08) 0%, transparent 65%)" }} />

      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-40 shadow-sm">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-black text-xl tracking-wide" style={{ color: NAVY }}>
            UTRAL BOT PRO
          </Link>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase"
                    style={{ background: T }}>
                    {user.name[0]}
                  </div>
                  <span className="text-gray-600 font-medium">{user.name}</span>
                </div>
                {user.isAdmin && (
                  <button onClick={() => router.push("/admin")}
                    className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-100 transition">
                    ⚙ Quản trị
                  </button>
                )}
                <button onClick={handleLogout}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:border-[#00b894] hover:text-[#00b894] transition">
                  Đăng xuất
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Tài khoản MT5",  value: accounts.length, color: NAVY },
            { label: "Đang hoạt động", value: activeCount,      color: T },
            { label: "Tốc độ đặt lệnh", value: "<1s",          color: "#f59e0b" },
            { label: "Hoạt động",       value: "24/7",          color: T },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left: Accounts */}
          <div className="lg:col-span-3 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: NAVY }}>Tài khoản MT5</h2>
              <button onClick={() => { setShowForm(!showForm); setMessage(null); }}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition"
                style={{ background: showForm ? "#6b7280" : T }}>
                {showForm ? "✕ Hủy" : "+ Thêm tài khoản"}
              </button>
            </div>

            {showForm && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold mb-5" style={{ color: NAVY }}>Thêm tài khoản MT5 mới</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { label: "Tên hiển thị", key: "name",        type: "text",     ph: "Tài khoản chính" },
                      { label: "MT5 Login",     key: "mt5Login",    type: "text",     ph: "123456789" },
                      { label: "MT5 Password",  key: "mt5Password", type: "password", ph: "••••••••" },
                      { label: "MT5 Server",    key: "mt5Server",   type: "text",     ph: "DupoinMarkets-Real" },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wide">{f.label}</label>
                        <input type={f.type} placeholder={f.ph}
                          value={form[f.key as keyof typeof form]}
                          onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                          required className={inputCls} />
                      </div>
                    ))}
                  </div>

                  {message && (
                    <div className={`rounded-xl px-4 py-3 text-sm border ${
                      message.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"
                    }`}>{message.text}</div>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white transition disabled:opacity-50"
                    style={{ background: T }}>
                    {loading ? "Đang xử lý..." : "Thêm tài khoản →"}
                  </button>
                </form>
              </div>
            )}

            {message && !showForm && (
              <div className={`rounded-xl px-4 py-3 text-sm border ${
                message.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"
              }`}>{message.text}</div>
            )}

            {accounts.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-gray-500 font-medium">Chưa có tài khoản MT5 nào</p>
                <p className="text-gray-400 text-sm mt-1">Nhấn "+ Thêm tài khoản" để bắt đầu</p>
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map((acc) => (
                  <div key={acc.id}
                    className="group bg-white border border-gray-200 hover:border-[#00b894]/50 rounded-2xl p-5 flex items-center justify-between gap-4 transition shadow-sm">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "rgba(0,184,148,0.08)", border: "1.5px solid rgba(0,184,148,0.2)" }}>
                        <span className="text-xs font-bold" style={{ color: T }}>MT5</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold" style={{ color: NAVY }}>{acc.name}</span>
                          {acc.status === "pending" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-xs font-medium text-orange-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />Đang kết nối...
                            </span>
                          ) : acc.status === "failed" ? (
                            <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-medium text-red-500">✕ Sai thông tin</span>
                          ) : acc.isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{ background: "rgba(0,184,148,0.08)", border: "1px solid rgba(0,184,148,0.25)", color: T }}>
                              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T }} />Hoạt động
                            </span>
                          ) : (
                            <span className="rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-400">○ Tắt</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">{acc.mt5Login} · {acc.mt5Server}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(acc.id, acc.name)}
                      className="opacity-0 group-hover:opacity-100 shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 transition">
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold mb-4 text-xs text-gray-400 uppercase tracking-wide">Cách hoạt động</h3>
              <div className="space-y-4">
                {[
                  { step: "1", text: "Thêm tài khoản MT5 của bạn bên trái" },
                  { step: "2", text: "Hệ thống tự động kết nối MT5 terminal" },
                  { step: "3", text: "Bot đặt lệnh trên tất cả tài khoản" },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "rgba(0,184,148,0.10)", border: "1.5px solid rgba(0,184,148,0.25)" }}>
                      <span className="text-xs font-bold" style={{ color: T }}>{s.step}</span>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-5"
              style={{ background: "rgba(0,184,148,0.06)", border: "1.5px solid rgba(0,184,148,0.2)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: T }} />
                <span className="text-sm font-semibold" style={{ color: T }}>Hệ thống đang hoạt động</span>
              </div>
              <p className="text-xs text-gray-500">
                Telegram bot đang lắng nghe tín hiệu 24/7. Tài khoản mới sẽ được kết nối trong vòng 30 giây.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold mb-3 text-xs text-gray-400 uppercase tracking-wide">Hỗ trợ</h3>
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
                <span style={{ color: T }}>💬</span>
                <span className="text-sm font-medium" style={{ color: NAVY }}>Zalo: 0397583137</span>
              </div>
              <p className="text-gray-400 text-xs mt-2">Hỗ trợ 24/7 • Chuyên nghiệp • Uy tín</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
