"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const words = ["Tự Động", "Thông Minh", "24/7"];

export default function LandingPage() {
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setWordIdx((i) => (i + 1) % words.length), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-[#0d1b3e]">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="text-[#00b894] font-black text-2xl leading-none">U</span>
            <span className="font-black text-xl text-[#0d1b3e] leading-none">TRAL BOT PRO</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm text-[#0d1b3e] hover:text-[#00b894] transition font-medium">Trang chủ</Link>
            <Link href="/dashboard" className="text-sm text-[#0d1b3e] hover:text-[#00b894] transition font-medium">Sản phẩm</Link>
            <Link href="#" className="text-sm text-[#0d1b3e] hover:text-[#00b894] transition font-medium">Giá cả</Link>
            <Link href="#" className="text-sm text-[#0d1b3e] hover:text-[#00b894] transition font-medium">Blog</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-[#0d1b3e] hover:text-[#00b894] transition px-3 py-2">
              Đăng nhập
            </Link>
            <Link
              href="/login"
              className="text-sm font-bold text-white px-5 py-2.5 rounded-lg transition"
              style={{ background: "#00b894" }}
            >
              Mở tài khoản →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 min-h-screen relative overflow-hidden flex items-center">
        {/* Teal gradient blob right */}
        <div className="pointer-events-none absolute top-0 right-0 w-[55%] h-full"
          style={{ background: "radial-gradient(ellipse at 80% 40%, rgba(0,184,148,0.13) 0%, rgba(0,184,148,0.05) 50%, transparent 75%)" }} />
        {/* Grid pattern */}
        <div className="pointer-events-none absolute top-0 right-0 w-[55%] h-full opacity-20"
          style={{ backgroundImage: "linear-gradient(#00b89420 1px, transparent 1px), linear-gradient(90deg, #00b89420 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="mx-auto max-w-7xl px-6 py-24 flex flex-col md:flex-row items-center gap-12 w-full relative z-10">
          {/* Left */}
          <div className="flex-1 max-w-lg">
            <h1 className="text-5xl font-black leading-tight mb-5 text-[#0d1b3e]">
              Xây dựng
              <br />
              <span style={{ color: "#00b894" }}>Giao dịch {words[wordIdx]}</span>
              <span className="animate-pulse" style={{ color: "#00b894" }}>|</span>
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-sm">
              Dù bạn là người mới bắt đầu hay chuyên gia, nền tảng UTRAL BOT PRO giúp bạn tự động hóa các giao dịch với tín hiệu đáng tin cậy trên vàng, ngoại hối và chỉ số — không cần lập trình.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-white font-bold px-6 py-3.5 rounded-lg text-sm transition hover:opacity-90"
              style={{ background: "#00b894" }}
            >
              Bắt đầu dùng thử miễn phí →
            </Link>
            <p className="text-xs text-gray-400 mt-3">Không cần thẻ tín dụng.</p>
          </div>

          {/* Right - floating bubbles */}
          <div className="flex-1 flex justify-center relative h-80 md:h-[420px]">
            {/* Center large bubble */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full flex items-center justify-center shadow-lg z-10"
              style={{ background: "#00b894" }}>
              <span className="text-white font-black text-xs text-center leading-tight px-2">UTRAL<br/>BOT PRO</span>
            </div>
            {/* Bubble 1 */}
            <div className="absolute top-8 right-16 w-16 h-16 rounded-full flex items-center justify-center shadow-md"
              style={{ background: "rgba(0,184,148,0.15)", border: "2px solid rgba(0,184,148,0.3)" }}>
              <span className="text-2xl">📈</span>
            </div>
            {/* Bubble 2 */}
            <div className="absolute top-20 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-md"
              style={{ background: "rgba(0,184,148,0.1)", border: "2px solid rgba(0,184,148,0.2)" }}>
              <span className="text-lg">🤖</span>
            </div>
            {/* Bubble 3 */}
            <div className="absolute top-4 left-20 w-14 h-14 rounded-full flex items-center justify-center shadow-md"
              style={{ background: "rgba(0,184,148,0.12)", border: "2px solid rgba(0,184,148,0.25)" }}>
              <span className="text-xl">💹</span>
            </div>
            {/* Bubble 4 */}
            <div className="absolute bottom-12 right-20 w-20 h-20 rounded-full flex items-center justify-center shadow-md"
              style={{ background: "rgba(0,184,148,0.1)", border: "2px solid rgba(0,184,148,0.2)" }}>
              <span className="text-2xl">⚡</span>
            </div>
            {/* Bubble 5 */}
            <div className="absolute bottom-20 left-12 w-12 h-12 rounded-full flex items-center justify-center shadow-md"
              style={{ background: "rgba(0,184,148,0.15)", border: "2px solid rgba(0,184,148,0.3)" }}>
              <span className="text-lg">🔔</span>
            </div>
            {/* Bubble 6 */}
            <div className="absolute bottom-4 right-8 w-10 h-10 rounded-full flex items-center justify-center shadow-md"
              style={{ background: "rgba(0,184,148,0.08)", border: "2px solid rgba(0,184,148,0.15)" }}>
              <span className="text-base">📊</span>
            </div>
            {/* Connecting lines (decorative) */}
            <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 400">
              <line x1="200" y1="200" x2="300" y2="60" stroke="#00b894" strokeWidth="1" strokeDasharray="4,4"/>
              <line x1="200" y1="200" x2="340" y2="130" stroke="#00b894" strokeWidth="1" strokeDasharray="4,4"/>
              <line x1="200" y1="200" x2="120" y2="50" stroke="#00b894" strokeWidth="1" strokeDasharray="4,4"/>
              <line x1="200" y1="200" x2="290" y2="300" stroke="#00b894" strokeWidth="1" strokeDasharray="4,4"/>
              <line x1="200" y1="200" x2="80" y2="280" stroke="#00b894" strokeWidth="1" strokeDasharray="4,4"/>
            </svg>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-6 py-8">
        <div className="mx-auto max-w-5xl rounded-2xl p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
          style={{ background: "#00b894" }}>
          <div className="absolute right-0 top-0 w-48 h-48 rounded-full opacity-20"
            style={{ background: "rgba(255,255,255,0.3)", transform: "translate(30%,-30%)" }} />
          <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full opacity-15"
            style={{ background: "rgba(255,255,255,0.3)", transform: "translateY(40%)" }} />
          <div className="relative z-10 max-w-lg">
            <h2 className="text-white font-black text-2xl mb-2">
              Trải nghiệm giao dịch được hỗ trợ bởi trí tuệ nhân tạo ngay hôm nay.
            </h2>
            <p className="text-white/80 text-sm">
              Hãy để công nghệ của chúng tôi tự động hóa các giao dịch của bạn và thay thế cảm xúc bằng sự chính xác và nhất quán.
            </p>
          </div>
          <Link href="/login"
            className="relative z-10 shrink-0 bg-white font-bold text-sm px-6 py-3 rounded-lg hover:bg-gray-50 transition"
            style={{ color: "#00b894" }}>
            Bắt đầu ngay →
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-black text-[#0d1b3e]">Điều gì làm nên sự độc đáo của UTRAL BOT PRO?</h2>
            <div className="mx-auto mt-3 w-12 h-1 rounded-full" style={{ background: "#00b894" }} />
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {[
              { icon: "📋", title: "Tín hiệu đã được chứng minh", desc: "Truy cập tín hiệu vào lệnh đáng tin cậy, được kiểm nghiệm trên thực tế để cho bạn nền tảng giao dịch vững chắc." },
              { icon: "⚙️", title: "Công cụ tùy chỉnh linh hoạt", desc: "Thiết kế và khởi chạy bot giao dịch riêng với các thông số tùy chỉnh, giúp bạn kiểm soát hoàn toàn chiến lược của mình." },
              { icon: "🌐", title: "Bao phủ mọi thị trường", desc: "Giao dịch trên mọi thị trường tài chính lớn, bao gồm ngoại hối, vàng và chỉ số thông qua một nền tảng mạnh mẽ." },
              { icon: "🧠", title: "Quyết định dựa trên AI", desc: "Nhận phân tích chuyên sâu từ trí tuệ nhân tạo, kết hợp tâm lý thị trường thời gian thực và dữ liệu lịch sử." },
              { icon: "🔄", title: "Giao dịch hoàn toàn tự động", desc: "Tự động hóa toàn bộ quy trình: quét thị trường, phân tích cơ hội và thực hiện lệnh chính xác, hoàn toàn rảnh tay." },
            ].map((f, i) => (
              <div key={i} className={`flex gap-4 p-5 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition ${i === 3 ? "md:col-start-1" : ""}`}>
                <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: "rgba(0,184,148,0.1)" }}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0d1b3e] mb-1">{f.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 px-6" style={{ background: "rgba(0,184,148,0.04)" }}>
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-black text-center text-[#0d1b3e] mb-12">Bắt đầu chỉ với 3 bước đơn giản</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "1", icon: "🤖", title: "Tạo tài khoản của bạn", desc: "Đăng ký miễn phí, chọn chiến lược giao dịch phù hợp và cài đặt bot theo nhu cầu cá nhân." },
              { n: "2", icon: "🔗", title: "Kết nối tài khoản MT5", desc: "Nhập bot đã biên dịch vào MetaTrader 5, liên kết với tài khoản giao dịch thực hoặc demo." },
              { n: "3", icon: "✅", title: "Bắt đầu giao dịch tự động", desc: "Chiến lược tự động xử lý các giao dịch, được hướng dẫn bởi AI thời gian thực và phân tích kỹ thuật." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl p-6 border-2 relative bg-white"
                style={{ borderColor: "rgba(0,184,148,0.3)" }}>
                <div className="absolute -top-4 left-6 w-8 h-8 rounded-full flex items-center justify-center font-black text-white text-sm"
                  style={{ background: "#00b894" }}>
                  {s.n}
                </div>
                <div className="text-3xl mb-4 mt-2">{s.icon}</div>
                <h3 className="font-bold text-[#0d1b3e] mb-2 text-sm">{s.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center mt-8 text-sm">
            <span className="font-bold" style={{ color: "#00b894" }}>Có vấn đề gì không? </span>
            <span className="text-gray-500">Trung tâm hỗ trợ của chúng tôi sẽ hỗ trợ bạn.</span>
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-10">
            <h2 className="text-3xl font-black text-[#0d1b3e] max-w-sm leading-tight">
              Hàng ngàn nhà giao dịch tin tưởng và sử dụng UTRAL BOT PRO để đạt được lợi nhuận.
              <Link href="/login" className="block text-sm font-normal mt-2" style={{ color: "#00b894" }}>Xem tất cả →</Link>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: "Nguyễn Văn A", stars: 5, title: "Bot giao dịch tốt nhất tôi từng dùng.", body: "\"Đây là bot giao dịch ngoại hối tốt nhất mà tôi từng sử dụng. Tôi đã kết nối hơn 3 tài khoản MT5 và kết quả vượt ngoài mong đợi...\"" },
              { name: "Trần Thị B", stars: 5, title: "UTRAL BOT PRO thật tuyệt vời!", body: "\"Trước hết, bot thực sự rất hiệu quả! Bên cạnh đó, nếu có vấn đề gì thì đội hỗ trợ phản hồi rất nhanh...\"" },
              { name: "Lê Văn C", stars: 5, title: "Dịch vụ khách hàng tuyệt vời", body: "\"Dịch vụ khách hàng tuyệt vời! Nhân viên hỗ trợ trên Zalo rất chu đáo và nhiệt tình. Bot chạy ổn định 24/7...\"" },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex gap-0.5 mb-3">
                  {Array(t.stars).fill(0).map((_, j) => (
                    <span key={j} className="text-yellow-400 text-base">★</span>
                  ))}
                </div>
                <p className="font-bold text-sm text-[#0d1b3e] mb-2">{t.title}</p>
                <p className="text-gray-500 text-xs leading-relaxed mb-4">{t.body}</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: "#00b894" }}>
                    {t.name[0]}
                  </div>
                  <span className="text-sm font-medium text-[#0d1b3e]">{t.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-t border-gray-100">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-2xl font-black text-[#0d1b3e] mb-10">Được tin dùng từ năm 2021.</h2>
          <div className="grid grid-cols-3 gap-8">
            {[
              { value: "+5.000", label: "Nhà giao dịch đã đăng ký" },
              { value: "24/7", label: "Hệ thống hoạt động liên tục" },
              { value: "<1s", label: "Tốc độ đặt lệnh" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-black mb-1" style={{ color: "#00b894" }}>{s.value}</div>
                <div className="text-gray-500 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-16 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row gap-12 mb-12">
            {/* Brand */}
            <div className="flex-1 max-w-xs">
              <div className="flex items-center gap-1 mb-3">
                <span className="font-black text-2xl" style={{ color: "#00b894" }}>U</span>
                <span className="font-black text-xl text-[#0d1b3e]">TRAL BOT PRO</span>
              </div>
              <p className="text-gray-500 text-xs leading-relaxed mb-4">
                UTRAL BOT PRO là công cụ giao dịch tự động được hỗ trợ bởi AI. Được thiết kế cho mọi thị trường, giúp bạn tự động hóa giao dịch một cách chính xác và nhất quán.
              </p>
              <div className="flex gap-3">
                {["f", "t", "z", "y"].map((s) => (
                  <div key={s} className="w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold cursor-pointer hover:opacity-80 transition"
                    style={{ borderColor: "#00b894", color: "#00b894" }}>
                    {s.toUpperCase()}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-16">
              <div>
                <h4 className="font-bold text-sm text-[#0d1b3e] mb-4" style={{ color: "#00b894" }}>Công ty</h4>
                <div className="space-y-2">
                  {["Điều khoản", "Chính sách", "Thông báo pháp lý"].map((l) => (
                    <div key={l}><Link href="#" className="text-gray-500 text-sm hover:text-[#00b894] transition">{l}</Link></div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-sm mb-4" style={{ color: "#00b894" }}>Liên kết</h4>
                <div className="space-y-2">
                  {["Hỗ trợ", "Blog", "Liên hệ"].map((l) => (
                    <div key={l}><Link href="#" className="text-gray-500 text-sm hover:text-[#00b894] transition">{l}</Link></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="border-t border-gray-100 pt-8">
            <p className="text-xs font-bold text-[#0d1b3e] mb-2">Tuyên bố miễn trừ trách nhiệm – Thông báo rủi ro</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Giao dịch ngoại hối (forex) ẩn chứa rủi ro cao và có thể không phù hợp với tất cả các nhà đầu tư. Trước khi quyết định giao dịch, bạn nên cân nhắc kỹ mục tiêu đầu tư, trình độ kinh nghiệm và khả năng chấp nhận rủi ro của mình. Hiệu quả hoạt động trong quá khứ không nhất thiết phản ánh kết quả trong tương lai.
            </p>
            <p className="text-xs text-gray-400 mt-4">© 2021-2026 UTRAL BOT PRO. Mọi quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
