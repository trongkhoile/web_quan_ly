"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TurnstileWidget from "@/app/components/TurnstileWidget";

const T = "#00b894";
const NAVY = "#0d2137";

type Captcha = { question: string; token: string };

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", captchaAnswer: "" });
  const [captcha, setCaptcha] = useState<Captcha | null>(null);
  const [captchaError, setCaptchaError] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCaptcha = useCallback(async () => {
    setCaptcha(null); setCaptchaError(false);
    try {
      const res = await fetch("/api/auth/captcha");
      if (res.ok) setCaptcha(await res.json()); else setCaptchaError(true);
    } catch { setCaptchaError(true); }
  }, []);

  // Nếu đã đăng nhập thì chuyển thẳng vào dashboard
  useEffect(() => {
    fetch("/api/auth/me").then(r => { if (r.ok) router.replace("/dashboard"); });
  }, [router]);

  useEffect(() => { if (mode === "register") fetchCaptcha(); }, [mode, fetchCaptcha]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    if (mode === "register") {
      if (form.password !== form.confirmPassword) { setError("Mật khẩu nhập lại không khớp"); return; }
      if (!form.captchaAnswer.trim()) { setError("Vui lòng nhập kết quả phép tính"); return; }
    }
    setLoading(true);
    const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = mode === "login"
      ? { email: form.email, password: form.password }
      : { name: form.name, email: form.email, password: form.password, captchaToken: captcha?.token, captchaAnswer: Number(form.captchaAnswer), turnstileToken };
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes("captcha") || data.error?.includes("phép tính")) { fetchCaptcha(); setForm((f) => ({ ...f, captchaAnswer: "" })); }
        throw new Error(data.error);
      }
      if (data.pending) {
        setError("");
        switchMode("login");
        alert("Đăng ký thành công! Tài khoản của bạn đang chờ admin duyệt. Vui lòng chờ.");
        return;
      }
      if (data.isAdmin) { router.push("/admin"); router.refresh(); return; }
      router.push("/dashboard"); router.refresh();
    } catch (err) { setError((err as Error).message); } finally { setLoading(false); }
  }

  function switchMode(m: "login" | "register") {
    setMode(m); setError(null); setTurnstileToken("");
    setForm({ name: "", email: "", password: "", confirmPassword: "", captchaAnswer: "" });
  }

  const inputCls = "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#0d2137] placeholder-gray-400 focus:border-[#00b894] focus:outline-none focus:ring-2 focus:ring-[#00b894]/15 transition";

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4" style={{ fontFamily: "sans-serif" }}>
      {/* Background decoration */}
      <div className="pointer-events-none fixed top-0 right-0 w-1/2 h-full -z-10"
        style={{ background: "radial-gradient(ellipse at 90% 20%, rgba(0,184,148,0.10) 0%, transparent 65%)" }} />
      <div className="pointer-events-none fixed bottom-0 left-0 w-64 h-64 rounded-full -z-10 blur-3xl"
        style={{ background: "rgba(0,184,148,0.06)" }} />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-1 group">
            <span className="font-black text-2xl tracking-wide" style={{ color: NAVY }}>UTRAL BOT PRO</span>
            <span className="text-xs font-semibold tracking-widest" style={{ color: T }}>PREMIUM TRADING</span>
          </Link>
          <p className="text-sm text-gray-500 mt-3">
            {mode === "login" ? "Đăng nhập để quản lý tài khoản MT5" : "Tạo tài khoản miễn phí"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg shadow-gray-100/80">
          {/* Tab switcher */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-7">
            {(["login", "register"] as const).map((m) => (
              <button key={m} onClick={() => switchMode(m)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                  mode === m ? "bg-[#00b894] text-white shadow-sm" : "text-gray-500 hover:text-[#0d2137]"
                }`}>
                {m === "login" ? "Đăng nhập" : "Đăng ký"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Họ tên</label>
                <input type="text" placeholder="Nguyễn Văn A" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputCls} />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {mode === "register" ? "Email" : "Email / Tên đăng nhập"}
              </label>
              <input
                type={mode === "register" ? "email" : "text"}
                placeholder="@gmail.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Mật khẩu</label>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} className={inputCls} />
            </div>

            {mode === "register" && (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Nhập lại mật khẩu</label>
                  <input type="password" placeholder="••••••••" value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required
                    className={`${inputCls} ${form.confirmPassword && form.password !== form.confirmPassword ? "!border-red-400 focus:!border-red-400" : ""}`} />
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">Mật khẩu không khớp</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Xác thực toán học</label>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm">
                      {captchaError
                        ? <button type="button" onClick={fetchCaptcha} className="text-red-500 hover:text-red-400 underline">Lỗi — nhấn để thử lại</button>
                        : captcha
                          ? <span className="font-mono font-bold" style={{ color: T }}>{captcha.question}</span>
                          : <span className="text-gray-400">Đang tải...</span>}
                    </div>
                    <input type="number" placeholder="=" value={form.captchaAnswer}
                      onChange={(e) => setForm({ ...form, captchaAnswer: e.target.value })} required
                      className="w-20 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-center text-[#0d2137] placeholder-gray-400 focus:border-[#00b894] focus:outline-none transition" />
                    <button type="button" onClick={() => { fetchCaptcha(); setForm((f) => ({ ...f, captchaAnswer: "" })); }}
                      className="w-10 h-11 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:border-[#00b894] hover:text-[#00b894] transition" title="Đổi phép tính">
                      ↻
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Xác thực Cloudflare</label>
                  <TurnstileWidget
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA"}
                    onSuccess={setTurnstileToken} onExpired={() => setTurnstileToken("")} onError={() => setTurnstileToken("")} />
                </div>
              </>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white transition mt-2 disabled:opacity-50"
              style={{ background: T }}>
              {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập →" : "Tạo tài khoản →"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link href="/" className="hover:text-[#00b894] transition">← Về trang chủ</Link>
        </p>
      </div>
    </div>
  );
}
