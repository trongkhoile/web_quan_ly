"use client";

import Link from "next/link";
import FinanceBg from "@/app/components/FinanceBg";

export default function LandingPage() {
  return (
    <>
      <FinanceBg />

      <div className="relative z-10 min-h-screen text-white">
        {/* Navbar */}
        <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-gray-950/70 backdrop-blur-xl">
          <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
            <span className="font-bold tracking-tight">Giao Dịch Tự Động</span>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm text-gray-400 hover:text-white transition">Đăng nhập</Link>
              <Link href="/login" className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm px-4 py-2 rounded-lg transition">
                Tham gia ngay
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="pt-36 pb-24 px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5 text-xs text-emerald-400 mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Hệ thống đang hoạt động 24/7
            </div>

            <h1 className="text-5xl sm:text-6xl font-black leading-tight mb-6">
              Để Bot Giao Dịch<br />
              <span className="text-emerald-400">Sinh Lời Cho Bạn</span>
            </h1>

            <p className="text-gray-400 text-base leading-relaxed mb-10 max-w-lg mx-auto">
              Kết nối tài khoản MT5 vào hệ thống. Bot tự động nhận tín hiệu và đặt lệnh 24/7 — bạn không cần làm gì, chỉ theo dõi lợi nhuận tăng lên.
            </p>

            <Link href="/login" className="inline-flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-9 py-4 rounded-xl transition text-base shadow-lg shadow-emerald-500/20">
              Bắt đầu miễn phí →
            </Link>
          </div>
        </section>

        {/* Steps */}
        <section className="py-20 px-6">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-black mb-2">Bắt Đầu Trong 3 Phút</h2>
              <p className="text-gray-500 text-sm">Không cần biết giao dịch. Bot lo tất cả.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                { step: "1", icon: "👤", title: "Tạo tài khoản",  desc: "Đăng ký miễn phí với email của bạn." },
                { step: "2", icon: "🔗", title: "Kết nối MT5",    desc: "Nhập thông tin tài khoản MT5 (login, mật khẩu, server)." },
                { step: "3", icon: "📈", title: "Nhận lợi nhuận", desc: "Bot tự động đặt lệnh 24/7. Bạn chỉ cần theo dõi số dư tăng." },
              ].map((s) => (
                <div key={s.step} className="bg-gray-900/70 backdrop-blur border border-gray-700/50 rounded-2xl p-6 text-center">
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <div className="inline-flex w-6 h-6 rounded-full bg-emerald-500/20 items-center justify-center mb-3">
                    <span className="text-emerald-400 text-xs font-bold">{s.step}</span>
                  </div>
                  <h3 className="font-bold mb-2">{s.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6">
          <div className="mx-auto max-w-lg text-center bg-gray-900/70 backdrop-blur border border-gray-700/50 rounded-3xl p-12">
            <h2 className="text-2xl font-black mb-3">Tham Gia Ngay Hôm Nay</h2>
            <p className="text-gray-400 text-sm mb-8">
              Kết nối tài khoản MT5 và để hệ thống tự động giao dịch sinh lời cho bạn.
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 py-4 rounded-xl transition text-base shadow-lg shadow-emerald-500/20">
              Đăng ký miễn phí →
            </Link>
            <p className="text-xs text-gray-600 mt-4">Miễn phí · Không phí ẩn</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-6 px-6">
          <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
            <span>Giao Dịch Tự Động © 2026</span>
            <div className="flex gap-5">
              <Link href="/login" className="hover:text-gray-400 transition">Đăng nhập</Link>
              <Link href="/login" className="hover:text-gray-400 transition">Đăng ký</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
