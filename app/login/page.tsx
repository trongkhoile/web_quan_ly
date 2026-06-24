"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TurnstileWidget from "@/app/components/TurnstileWidget";

type Captcha = { question: string; token: string };

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    captchaAnswer: "",
  });
  const [captcha, setCaptcha] = useState<Captcha | null>(null);
  const [captchaError, setCaptchaError] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCaptcha = useCallback(async () => {
    setCaptcha(null);
    setCaptchaError(false);
    try {
      const res = await fetch("/api/auth/captcha");
      if (res.ok) setCaptcha(await res.json());
      else setCaptchaError(true);
    } catch {
      setCaptchaError(true);
    }
  }, []);

  useEffect(() => {
    if (mode === "register") fetchCaptcha();
  }, [mode, fetchCaptcha]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "register") {
      if (form.password !== form.confirmPassword) {
        setError("Mật khẩu nhập lại không khớp");
        return;
      }
      if (!form.captchaAnswer.trim()) {
        setError("Vui lòng nhập kết quả phép tính");
        return;
      }
    }

    setLoading(true);
    const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body =
      mode === "login"
        ? { email: form.email, password: form.password }
        : {
            name: form.name,
            email: form.email,
            password: form.password,
            captchaToken: captcha?.token,
            captchaAnswer: Number(form.captchaAnswer),
            turnstileToken,
          };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes("captcha") || data.error?.includes("phép tính")) {
          fetchCaptcha();
          setForm((f) => ({ ...f, captchaAnswer: "" }));
        }
        throw new Error(data.error);
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode(m: "login" | "register") {
    setMode(m);
    setError(null);
    setTurnstileToken("");
    setForm({ name: "", email: "", password: "", confirmPassword: "", captchaAnswer: "" });
  }

  const inputCls =
    "w-full rounded-xl border border-[#1e3558] bg-[#0a1628] px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-[#14b8c8] focus:outline-none focus:ring-1 focus:ring-[#14b8c8]/30 transition";

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-4">
      <div className="pointer-events-none fixed top-1/4 left-1/4 w-96 h-96 bg-[#14b8c8]/8 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed bottom-1/4 right-1/4 w-64 h-64 bg-orange-500/8 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-1 group">
            <div className="flex items-center gap-2">
              <img src="/logo.jpg" alt="UTRAL BOT PRO" className="h-10 w-auto rounded-lg" />
              <span className="text-[#14b8c8] font-black text-xl tracking-wide group-hover:opacity-80 transition">
                UTRAL BOT PRO
              </span>
            </div>
            <span className="text-orange-400 text-[10px] font-bold tracking-widest">PREMIUM TRADING</span>
          </Link>
          <p className="text-sm text-gray-500 mt-3">
            {mode === "login" ? "Đăng nhập để quản lý tài khoản MT5" : "Tạo tài khoản miễn phí"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0d1f3c] border border-[#1e3558] rounded-2xl p-8 shadow-2xl">
          {/* Tab switcher */}
          <div className="flex rounded-xl bg-[#0a1628] p-1 mb-7">
            <button
              onClick={() => switchMode("login")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-[#14b8c8] text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => switchMode("register")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                mode === "register"
                  ? "bg-[#14b8c8] text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Đăng ký
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Họ tên
                </label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className={inputCls}
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400 uppercase tracking-wide">
                Mật khẩu
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                className={inputCls}
              />
            </div>

            {mode === "register" && (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Nhập lại mật khẩu
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                    className={`${inputCls} ${
                      form.confirmPassword && form.password !== form.confirmPassword
                        ? "!border-red-500 focus:!border-red-500"
                        : ""
                    }`}
                  />
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="mt-1 text-xs text-red-400">Mật khẩu không khớp</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Xác thực toán học
                  </label>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 bg-[#0a1628] border border-[#1e3558] rounded-xl px-4 py-3 text-sm">
                      {captchaError ? (
                        <button
                          type="button"
                          onClick={fetchCaptcha}
                          className="text-red-400 hover:text-red-300 underline"
                        >
                          Lỗi — nhấn để thử lại
                        </button>
                      ) : captcha ? (
                        <span className="text-[#14b8c8] font-mono font-bold">{captcha.question}</span>
                      ) : (
                        <span className="text-gray-500">Đang tải...</span>
                      )}
                    </div>
                    <input
                      type="number"
                      placeholder="="
                      value={form.captchaAnswer}
                      onChange={(e) => setForm({ ...form, captchaAnswer: e.target.value })}
                      required
                      className="w-20 rounded-xl border border-[#1e3558] bg-[#0a1628] px-3 py-3 text-sm text-white text-center placeholder-gray-500 focus:border-[#14b8c8] focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => { fetchCaptcha(); setForm((f) => ({ ...f, captchaAnswer: "" })); }}
                      className="w-10 h-11 flex items-center justify-center rounded-xl border border-[#1e3558] text-gray-400 hover:border-[#14b8c8] hover:text-[#14b8c8] transition"
                      title="Đổi phép tính"
                    >
                      ↻
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Xác thực Cloudflare
                  </label>
                  <TurnstileWidget
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA"}
                    onSuccess={setTurnstileToken}
                    onExpired={() => setTurnstileToken("")}
                    onError={() => setTurnstileToken("")}
                  />
                </div>
              </>
            )}

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#14b8c8] hover:bg-[#0ea0ae] disabled:opacity-50 px-4 py-3 text-sm font-bold text-white transition mt-2"
            >
              {loading
                ? "Đang xử lý..."
                : mode === "login"
                ? "Đăng nhập →"
                : "Tạo tài khoản →"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          <Link href="/" className="hover:text-[#14b8c8] transition">
            ← Về trang chủ
          </Link>
        </p>
      </div>
    </div>
  );
}
