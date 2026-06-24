"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const T = "#00b894";
const NAVY = "#0d2137";

type Account = {
  id: string; name: string; mt5Login: string; mt5Server: string;
  isActive: boolean; signalMode: "simple" | "dca" | "both";
  lot: number;
  status: "pending" | "connected" | "failed"; createdAt: string;
};
type User = { name: string; email: string; isAdmin: boolean };
type Trade = {
  id: string; symbol: string; type: string; lot: number;
  openPrice: number; closePrice: number; profit: number;
  openTime: string; closeTime: string;
  account: { name: string };
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tab, setTab] = useState<"accounts" | "history">("accounts");
  const [form, setForm] = useState({ name: "", mt5Login: "", mt5Password: "", mt5Server: "DupoinMarkets-Real" });
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [changingMode, setChangingMode] = useState<string | null>(null);
  const [editingLot, setEditingLot] = useState<string | null>(null);
  const [lotInputs, setLotInputs] = useState<Record<string, string>>({});
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

  const fetchTrades = useCallback(async () => {
    try { const res = await fetch("/api/trades"); if (res.ok) setTrades(await res.json()); } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchAccounts(); fetchTrades(); }, [fetchAccounts, fetchTrades]);

  useEffect(() => {
    if (!pendingId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/accounts"); if (!res.ok) return;
        const list: Account[] = await res.json(); setAccounts(list);
        const acc = list.find((a) => a.id === pendingId);
        if (!acc) { setPendingId(null); return; }
        if (acc.status === "connected") { setPendingId(null); setMessage({ type: "success", text: `Tài khoản "${acc.name}" đã kết nối MT5 thành công!` }); }
        else if (acc.status === "failed") { setPendingId(null); setMessage({ type: "error", text: `Sai ID hoặc mật khẩu MT5. Vui lòng kiểm tra lại và xóa tài khoản này.` }); }
      } catch { /* ignore */ }
    }, 4000);
    const timeout = setTimeout(() => {
      clearInterval(interval); setPendingId(null);
      setMessage({ type: "error", text: "Kết nối MT5 mất quá lâu. Kiểm tra lại thông tin hoặc thử khởi động lại." });
    }, 120_000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [pendingId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pendingId) return;
    setLoading(true); setMessage(null);
    try {
      const res = await fetch("/api/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: "success", text: "Đang kết nối tới MT5, vui lòng chờ kết quả trước khi thêm tài khoản mới..." });
      setForm({ name: "", mt5Login: "", mt5Password: "", mt5Server: "DupoinMarkets-Real" });
      setShowForm(false); fetchAccounts(); setPendingId(data.id);
    } catch (err) { setMessage({ type: "error", text: (err as Error).message }); } finally { setLoading(false); }
  }

  async function handleToggle(acc: Account) {
    setToggling(acc.id);
    try {
      const res = await fetch(`/api/accounts?id=${acc.id}`, { method: "PATCH" });
      if (res.ok) fetchAccounts();
    } finally { setToggling(null); }
  }

  async function handleSignalMode(acc: Account, mode: string) {
    setChangingMode(acc.id);
    try {
      const res = await fetch(`/api/accounts?id=${acc.id}&signalMode=${mode}`, { method: "PATCH" });
      if (res.ok) fetchAccounts();
    } finally { setChangingMode(null); }
  }

  async function handleLotSave(acc: Account) {
    const val = parseFloat(lotInputs[acc.id] ?? "");
    if (isNaN(val) || val <= 0) return;
    try {
      const res = await fetch(`/api/accounts?id=${acc.id}&lot=${val}`, { method: "PATCH" });
      if (res.ok) { fetchAccounts(); setEditingLot(null); }
    } catch { /* ignore */ }
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
  const totalProfit = trades.reduce((s, t) => s + t.profit, 0);

  return (
    <div className="min-h-screen bg-white text-[#0d2137]" style={{ fontFamily: "sans-serif" }}>
      <div className="pointer-events-none fixed top-0 right-0 w-1/2 h-full -z-10"
        style={{ background: "radial-gradient(ellipse at 90% 20%, rgba(0,184,148,0.08) 0%, transparent 65%)" }} />

      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-40 shadow-sm">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-black text-xl tracking-wide" style={{ color: NAVY }}>UTRAL BOT PRO</Link>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase" style={{ background: T }}>
                    {user.name[0]}
                  </div>
                  <span className="text-gray-600 font-medium">{user.name}</span>
                </div>
                {user.isAdmin && (
                  <button onClick={() => router.push("/admin")}
                    className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-100 transition">
                    Quản trị
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

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Tài khoản MT5",   value: accounts.length,                          color: NAVY },
            { label: "Đang hoạt động",  value: activeCount,                               color: T },
            { label: "Tổng lệnh",        value: trades.length,                             color: NAVY },
            { label: "Lợi nhuận",        value: (totalProfit >= 0 ? "+" : "") + totalProfit.toFixed(2), color: totalProfit >= 0 ? T : "#ef4444" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {([["accounts", "Tài khoản MT5"], ["history", "Lịch sử lệnh"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${tab === key ? "bg-white text-[#0d2137] shadow-sm" : "text-gray-500 hover:text-[#0d2137]"}`}>
              {label}
              {key === "history" && trades.length > 0 && (
                <span className="ml-1.5 text-xs rounded-full px-1.5 py-0.5 font-bold" style={{ background: "rgba(0,184,148,0.12)", color: T }}>
                  {trades.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB: ACCOUNTS ── */}
        {tab === "accounts" && (
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold" style={{ color: NAVY }}>Tài khoản MT5</h2>
                {pendingId ? (
                  <div className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold bg-gray-100 text-gray-400 cursor-not-allowed select-none shrink-0">
                    <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse shrink-0" />
                    <span className="hidden sm:inline">Đang kết nối...</span>
                    <span className="sm:hidden">Chờ...</span>
                  </div>
                ) : (
                  <button onClick={() => { setShowForm(!showForm); setMessage(null); }}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white transition shrink-0"
                    style={{ background: showForm ? "#6b7280" : T }}>
                    {showForm ? "✕ Hủy" : <><span className="sm:hidden">+ Thêm</span><span className="hidden sm:inline">+ Thêm tài khoản</span></>}
                  </button>
                )}
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
                      <div className={`rounded-xl px-4 py-3 text-sm border ${message.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"}`}>
                        {message.text}
                      </div>
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
                <div className={`rounded-xl px-4 py-3 text-sm border ${message.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"}`}>
                  {message.text}
                </div>
              )}

              {accounts.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
                  <p className="text-gray-500 font-medium">Chưa có tài khoản MT5 nào</p>
                  <p className="text-gray-400 text-sm mt-1">Nhấn "+ Thêm tài khoản" để bắt đầu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts.map((acc) => (
                    <div key={acc.id}
                      className="group bg-white border border-gray-200 hover:border-[#00b894]/50 rounded-2xl p-4 transition shadow-sm">
                      {/* Hàng trên: icon + info + toggle + xóa */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "rgba(0,184,148,0.08)", border: "1.5px solid rgba(0,184,148,0.2)" }}>
                            <span className="text-xs font-bold" style={{ color: T }}>MT5</span>
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-sm" style={{ color: NAVY }}>{acc.name}</span>
                            <div className="mt-1">
                              {acc.status === "pending" ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-xs font-medium text-orange-600">
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />Đang kết nối...
                                </span>
                              ) : acc.status === "failed" ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-medium text-red-500">Sai thông tin</span>
                              ) : acc.isActive ? (
                                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                                  style={{ background: "rgba(0,184,148,0.08)", border: "1px solid rgba(0,184,148,0.25)", color: T }}>
                                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T }} />Hoạt động
                                </span>
                              ) : (
                                <span className="rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-400">Tắt</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5 font-mono truncate">{acc.mt5Login} · {acc.mt5Server}</p>
                          </div>
                        </div>
                        {/* Toggle + Xóa */}
                        <div className="flex items-center gap-2 shrink-0">
                          {acc.status === "connected" && (
                            <button onClick={() => handleToggle(acc)} disabled={toggling === acc.id}
                              title={acc.isActive ? "Tắt bot" : "Bật bot"}
                              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${acc.isActive ? "bg-[#00b894]" : "bg-gray-200"} ${toggling === acc.id ? "opacity-50" : ""}`}>
                              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${acc.isActive ? "translate-x-5" : "translate-x-0"}`} />
                            </button>
                          )}
                          <button onClick={() => handleDelete(acc.id, acc.name)}
                            className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 transition md:opacity-0 md:group-hover:opacity-100">
                            Xóa
                          </button>
                        </div>
                      </div>
                      {/* Hàng dưới: signal mode + lot */}
                      {acc.status === "connected" && (
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                          {/* Signal mode */}
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className="text-xs text-gray-400 shrink-0">Tín hiệu:</span>
                            {(["simple", "dca", "both"] as const).map((m) => (
                              <button key={m} onClick={() => handleSignalMode(acc, m)}
                                disabled={changingMode === acc.id}
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition ${acc.signalMode === m
                                  ? "text-white border-transparent"
                                  : "text-gray-400 border-gray-200 hover:border-[#00b894] hover:text-[#00b894]"}`}
                                style={acc.signalMode === m ? { background: T } : {}}>
                                {m === "simple" ? "Lệnh đơn" : m === "dca" ? "DCA" : "Cả hai"}
                              </button>
                            ))}
                          </div>
                          {/* Lot */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 shrink-0">Lot:</span>
                            {editingLot === acc.id ? (
                              <>
                                <input
                                  type="number" step="0.01" min="0.01" max="100"
                                  value={lotInputs[acc.id] ?? ""}
                                  onChange={e => setLotInputs(p => ({ ...p, [acc.id]: e.target.value }))}
                                  onKeyDown={e => { if (e.key === "Enter") handleLotSave(acc); if (e.key === "Escape") setEditingLot(null); }}
                                  className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#00b894]"
                                  autoFocus
                                />
                                <button onClick={() => handleLotSave(acc)}
                                  className="text-xs px-2 py-1 rounded-lg text-white"
                                  style={{ background: T }}>Lưu</button>
                                <button onClick={() => setEditingLot(null)}
                                  className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50">Hủy</button>
                              </>
                            ) : (
                              <button onClick={() => { setEditingLot(acc.id); setLotInputs(p => ({ ...p, [acc.id]: String(acc.lot ?? 0.01) })); }}
                                className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full border border-gray-200 hover:border-[#00b894] hover:text-[#00b894] transition"
                                style={{ color: NAVY }}>
                                {acc.lot ?? 0.01}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
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
            </div>
          </div>
        )}

        {/* ── TAB: HISTORY ── */}
        {tab === "history" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: NAVY }}>Lịch sử lệnh</h2>
              <button onClick={fetchTrades} className="text-xs text-gray-400 hover:text-[#00b894] transition border border-gray-200 rounded-lg px-3 py-1.5">
                Làm mới
              </button>
            </div>

            {trades.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center">
                <p className="text-gray-500 font-medium">Chưa có lệnh nào được ghi nhận</p>
                <p className="text-gray-400 text-sm mt-1">Lịch sử sẽ xuất hiện tại đây sau khi bot đặt lệnh</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Summary */}
                <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                  {[
                    { label: "Tổng lệnh", value: trades.length },
                    { label: "Lãi",  value: trades.filter(t => t.profit > 0).length },
                    { label: "Lỗ",   value: trades.filter(t => t.profit < 0).length },
                  ].map((s) => (
                    <div key={s.label} className="p-4 text-center">
                      <div className="font-black text-lg" style={{ color: NAVY }}>{s.value}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                        <th className="text-left px-4 py-3">Tài khoản</th>
                        <th className="text-left px-4 py-3">Symbol</th>
                        <th className="text-left px-4 py-3">Loại</th>
                        <th className="text-right px-4 py-3">Lot</th>
                        <th className="text-right px-4 py-3">Mở</th>
                        <th className="text-right px-4 py-3">Đóng</th>
                        <th className="text-right px-4 py-3">Lợi nhuận</th>
                        <th className="text-right px-4 py-3">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {trades.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 text-xs text-gray-500">{t.account.name}</td>
                          <td className="px-4 py-3 font-semibold" style={{ color: NAVY }}>{t.symbol}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${t.type === "buy" ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-500 border border-red-200"}`}>
                              {t.type === "buy" ? "Mua" : "Bán"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">{t.lot}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{t.openPrice}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{t.closePrice}</td>
                          <td className={`px-4 py-3 text-right font-bold ${t.profit >= 0 ? "text-[#00b894]" : "text-red-500"}`}>
                            {t.profit >= 0 ? "+" : ""}{t.profit.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-gray-400">
                            {new Date(t.closeTime).toLocaleDateString("vi-VN", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-100 bg-gray-50">
                        <td colSpan={6} className="px-4 py-3 text-xs font-semibold text-gray-500 text-right">Tổng lợi nhuận</td>
                        <td className={`px-4 py-3 text-right font-black ${totalProfit >= 0 ? "text-[#00b894]" : "text-red-500"}`}>
                          {totalProfit >= 0 ? "+" : ""}{totalProfit.toFixed(2)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
