"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#0a1628]">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
              <rect width="38" height="38" rx="9" fill="#14b8c8" fillOpacity="0.2" />
              <path d="M7 28 L13 12 L19 22 L24 15 L31 28" stroke="#14b8c8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 9 L19 21 L24 9" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <div className="text-[#14b8c8] font-black text-base leading-none tracking-wide">UTRAL BOT PRO</div>
              <div className="text-orange-400 text-[10px] font-semibold tracking-widest">PREMIUM TRADING</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-white text-sm hover:text-[#14b8c8] transition">Trang chủ</Link>
            <Link href="/dashboard" className="text-white text-sm hover:text-[#14b8c8] transition">Giao dịch Vàng</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="border border-white text-white text-xs font-bold px-5 py-2 rounded-full hover:bg-white hover:text-[#0a1628] transition"
            >
              ĐĂNG NHẬP
            </Link>
            <Link
              href="/login"
              className="bg-[#14b8c8] text-white text-xs font-bold px-5 py-2 rounded-full hover:bg-[#0ea0ae] transition"
            >
              MỞ TÀI KHOẢN
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#0a1628] pt-16 min-h-screen flex items-center">
        <div className="mx-auto max-w-7xl px-6 py-24 flex flex-col md:flex-row items-center gap-16 w-full">
          {/* Left */}
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
              Hãy tự tin tham gia với
              <br />
              <span className="text-[#14b8c8]">UTRAL BOT PRO</span> rồi
              <br />
              theo dõi % lợi nhuận
              <br />
              tăng lên
            </h1>
            <p className="text-gray-300 text-sm leading-relaxed mb-10 max-w-md">
              UTRAL BOT PRO cung cấp các tín hiệu vào lệnh hiệu quả để hỗ trợ bạn đưa ra các quyết định đầu tư hiệu quả khi giao dịch
            </p>
            <Link
              href="/login"
              className="inline-block bg-[#14b8c8] text-white font-bold px-8 py-3 rounded-full hover:bg-[#0ea0ae] transition text-sm"
            >
              Tham gia ngay
            </Link>
          </div>

          {/* Right - Phone mockup */}
          <div className="flex-1 flex justify-center">
            <div className="relative">
              {/* Glow */}
              <div className="absolute inset-0 bg-[#14b8c8]/20 rounded-full blur-3xl scale-150 -z-10" />
              {/* Phone */}
              <div className="w-56 h-[440px] bg-gray-200 rounded-[3rem] border-[10px] border-gray-300 shadow-2xl flex items-center justify-center rotate-6">
                <div className="w-full h-full bg-[#0a1628] rounded-[2.2rem] flex flex-col items-center justify-center gap-3">
                  <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                    <rect width="72" height="72" rx="16" fill="#14b8c8" fillOpacity="0.15" />
                    <path d="M14 54 L24 24 L36 44 L46 30 L58 54" stroke="#14b8c8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M24 16 L36 44 L48 16" stroke="#f97316" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-[#14b8c8] font-black text-base tracking-wide">UTRAL BOT</div>
                  <div className="text-orange-400 font-bold text-sm tracking-widest">PRO</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#f5f5f5] py-24 px-6">
        <div className="mx-auto max-w-5xl space-y-28">

          {/* Feature 1 */}
          <div className="flex flex-col md:flex-row items-center gap-14">
            <div className="flex-1 order-1">
              <h2 className="text-2xl font-black text-gray-900 mb-4">Tính minh bạch</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Tính minh bạch là giá trị cốt lõi của nền tảng khi chúng tôi sử dụng dữ liệu chuyên sâu từ các sàn giao dịch phổ biến
              </p>
            </div>
            <div className="flex-1 order-2 flex justify-center">
              <svg width="280" height="200" viewBox="0 0 280 200" fill="none">
                {/* Laptop body */}
                <rect x="40" y="30" width="170" height="115" rx="10" fill="#e5e7eb" />
                <rect x="50" y="40" width="150" height="97" rx="6" fill="white" />
                {/* Screen content */}
                <rect x="62" y="55" width="100" height="10" rx="5" fill="#f97316" />
                <rect x="62" y="72" width="70" height="6" rx="3" fill="#e5e7eb" />
                <rect x="62" y="84" width="85" height="6" rx="3" fill="#e5e7eb" />
                <rect x="62" y="96" width="55" height="6" rx="3" fill="#e5e7eb" />
                {/* Laptop base */}
                <rect x="20" y="145" width="210" height="12" rx="6" fill="#d1d5db" />
                {/* Person */}
                <circle cx="225" cy="75" r="20" fill="#f97316" />
                <rect x="210" y="97" width="30" height="55" rx="12" fill="#f97316" />
                <rect x="200" y="102" width="14" height="38" rx="7" fill="#f97316" />
                <rect x="236" y="102" width="14" height="38" rx="7" fill="#f97316" />
                <rect x="215" y="150" width="12" height="30" rx="6" fill="#f97316" />
                <rect x="229" y="150" width="12" height="30" rx="6" fill="#f97316" />
              </svg>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-14">
            <div className="flex-1">
              <h2 className="text-2xl font-black text-gray-900 mb-4">Tiết kiệm thời gian</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Giao diện trực quan và công cụ tiên tiến của chúng tôi cung cấp tín hiệu{" "}
                <strong className="text-gray-800">đưa ra quyết định đầu tư</strong> khôn ngoan trong thời gian ngắn.
              </p>
            </div>
            <div className="flex-1 flex justify-center">
              <svg width="280" height="200" viewBox="0 0 280 200" fill="none">
                {/* Chart box */}
                <rect x="20" y="30" width="180" height="140" rx="10" fill="white" stroke="#e5e7eb" strokeWidth="2" />
                {/* Grid lines */}
                <line x1="35" y1="60" x2="185" y2="60" stroke="#f5f5f5" strokeWidth="1" />
                <line x1="35" y1="90" x2="185" y2="90" stroke="#f5f5f5" strokeWidth="1" />
                <line x1="35" y1="120" x2="185" y2="120" stroke="#f5f5f5" strokeWidth="1" />
                {/* Chart line */}
                <polyline points="40,145 70,110 100,125 130,85 160,65 185,45" stroke="#f97316" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                {/* Dots */}
                <circle cx="40" cy="145" r="4" fill="#f97316" />
                <circle cx="70" cy="110" r="4" fill="#f97316" />
                <circle cx="100" cy="125" r="4" fill="#f97316" />
                <circle cx="130" cy="85" r="4" fill="#f97316" />
                <circle cx="160" cy="65" r="4" fill="#f97316" />
                <circle cx="185" cy="45" r="4" fill="#f97316" />
                {/* Up arrow badge */}
                <rect x="155" y="38" width="50" height="20" rx="6" fill="#14b8c8" fillOpacity="0.15" />
                <text x="162" y="52" fill="#14b8c8" fontSize="10" fontWeight="bold">▲ +24%</text>
                {/* Person */}
                <circle cx="242" cy="85" r="20" fill="#f97316" />
                <rect x="228" y="107" width="28" height="55" rx="12" fill="#f97316" />
                <rect x="215" y="112" width="15" height="35" rx="7" fill="#f97316" />
                <rect x="254" y="112" width="15" height="35" rx="7" fill="#f97316" />
              </svg>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col md:flex-row items-center gap-14">
            <div className="flex-1">
              <h2 className="text-2xl font-black text-gray-900 mb-4">Phương thức đầu tư đa dạng</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Đa dạng tùy chọn tín hiệu ở Utral Bot Pro mang đến sự linh hoạt cho phép điều chỉnh các AI phù hợp với các nhu cầu và mục tiêu cá nhân.
              </p>
            </div>
            <div className="flex-1 flex justify-center">
              <svg width="280" height="200" viewBox="0 0 280 200" fill="none">
                {/* Central node */}
                <rect x="105" y="20" width="70" height="32" rx="8" fill="#f97316" />
                <text x="140" y="41" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">BOT</text>
                {/* Branches */}
                <line x1="140" y1="52" x2="55" y2="95" stroke="#f97316" strokeWidth="2" />
                <line x1="140" y1="52" x2="140" y2="95" stroke="#f97316" strokeWidth="2" />
                <line x1="140" y1="52" x2="225" y2="95" stroke="#f97316" strokeWidth="2" />
                {/* Child nodes */}
                <rect x="20" y="95" width="70" height="30" rx="8" fill="#e5e7eb" />
                <text x="55" y="115" textAnchor="middle" fill="#555" fontSize="10">XAUUSD</text>
                <rect x="105" y="95" width="70" height="30" rx="8" fill="#e5e7eb" />
                <text x="140" y="115" textAnchor="middle" fill="#555" fontSize="10">EURUSD</text>
                <rect x="190" y="95" width="70" height="30" rx="8" fill="#e5e7eb" />
                <text x="225" y="115" textAnchor="middle" fill="#555" fontSize="10">US30</text>
                {/* Person sitting */}
                <circle cx="140" cy="160" r="16" fill="#f97316" />
                <rect x="128" y="177" width="24" height="18" rx="8" fill="#f97316" />
                <rect x="115" y="170" width="15" height="8" rx="4" fill="#f97316" />
                <rect x="150" y="170" width="15" height="8" rx="4" fill="#f97316" />
              </svg>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a1628] relative">
        {/* Wave from features to footer */}
        <div className="bg-[#f5f5f5]">
          <svg viewBox="0 0 1440 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="block w-full">
            <path d="M0,45 C240,90 480,0 720,45 C960,90 1200,0 1440,45 L1440,90 L0,90 Z" fill="#0a1628" />
            <path d="M0,65 C240,20 480,90 720,65 C960,20 1200,90 1440,65 L1440,90 L0,90 Z" fill="#0d1f3c" fillOpacity="0.6" />
          </svg>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between gap-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="7" fill="#14b8c8" fillOpacity="0.2" />
                  <path d="M6 24 L11 10 L16 19 L20 13 L26 24" stroke="#14b8c8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[#14b8c8] font-black text-base tracking-wide">UTRAL BOT PRO</span>
              </div>
              <div className="text-orange-400 text-[10px] font-bold tracking-widest mb-5 ml-10">PREMIUM TRADING</div>
              <p className="text-gray-500 text-xs">© 2021-2026 Cộng Đồng UTRAL BOT PRO</p>
              <p className="text-gray-500 text-xs mt-1">
                Mọi quyền sở hữu được bảo vệ. Sản phẩm được phát hành{" "}
                <span className="text-[#14b8c8]">10-08-2021</span>
              </p>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-[#14b8c8] font-bold text-sm mb-4">
                Liên hệ với chúng tôi để kích hoạt tài khoản
              </h4>
              <div className="flex items-center gap-2 bg-[#142040] rounded-lg px-4 py-3">
                <span className="text-[#14b8c8] text-lg">💬</span>
                <span className="text-white text-sm font-medium">Zalo: 0397583137</span>
              </div>
              <p className="text-gray-600 text-xs mt-3">Hỗ trợ 24/7 • Chuyên nghiệp • Uy tín</p>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <span className="text-gray-600 text-xs">Designed with ♥ by UTRAL BOT PRO Team</span>
            <div className="flex gap-6">
              <Link href="#" className="text-gray-500 text-xs hover:text-white transition">Điều khoản</Link>
              <Link href="#" className="text-gray-500 text-xs hover:text-white transition">Chính sách</Link>
              <Link href="#" className="text-gray-500 text-xs hover:text-white transition">Hỗ trợ</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
