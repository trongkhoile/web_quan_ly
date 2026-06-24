"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

const T = "#00b894";
const NAVY = "#0d2137";

const heroWords = ["Tự Động", "Thông Minh", "Chuyên Nghiệp", "24/7"];

function useVisible(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100">
      <button className="w-full text-left py-5 flex items-center justify-between gap-4" onClick={() => setOpen(!open)}>
        <span className="font-semibold text-sm text-[#0d2137]">{q}</span>
        <span className="shrink-0 text-lg font-bold transition-transform" style={{ color: T, transform: open ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
      </button>
      <div className={`faq-content${open ? " open" : ""}`}>
        <p className="text-gray-500 text-sm leading-relaxed pb-5">{a}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [wordIdx, setWordIdx] = useState(0);
  const [show, setShow] = useState(true);
  const featuresRef = useVisible();
  const stepsRef    = useVisible();
  const testiRef    = useVisible();
  const faqRef      = useVisible();

  useEffect(() => {
    const t = setInterval(() => {
      setShow(false);
      setTimeout(() => { setWordIdx((i) => (i + 1) % heroWords.length); setShow(true); }, 300);
    }, 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-[#0d2137] overflow-x-hidden">

      {/* Page-wide teal gradient background (right side) */}
      <div className="fixed top-0 right-0 w-1/2 h-full pointer-events-none -z-10"
        style={{ background: "radial-gradient(ellipse at 90% 20%, rgba(0,184,148,0.12) 0%, rgba(0,184,148,0.04) 50%, transparent 75%)" }} />
      <div className="fixed top-0 right-0 w-1/2 h-full pointer-events-none -z-10 opacity-30"
        style={{ backgroundImage: `linear-gradient(rgba(0,184,148,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,184,148,0.08) 1px, transparent 1px)`, backgroundSize: "48px 48px" }} />

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-0.5">
            <span className="font-black text-2xl leading-none" style={{ color: T }}>U</span>
            <span className="font-black text-xl text-[#0d2137] leading-none">TRAL BOT PRO</span>
          </Link>
          <div className="hidden md:flex items-center gap-7">
            {["Trang chủ","Sản phẩm","Giá cả","Blog","Công ty"].map((l) => (
              <Link key={l} href="#" className="text-sm text-gray-600 hover:text-[#00b894] transition font-medium">{l}</Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-[#00b894] transition px-3 py-2">Đăng nhập</Link>
            <Link href="/login" className="text-sm font-bold text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition" style={{ background: T }}>
              Mở tài khoản →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-16 min-h-screen flex items-center relative">
        <div className="mx-auto max-w-6xl px-6 py-24 flex flex-col md:flex-row items-center gap-10 w-full">
          {/* Left */}
          <div className="flex-1 max-w-lg">
            <h1 className="text-5xl font-black leading-tight mb-5 text-[#0d2137]">
              Xây dựng<br />
              <span className="transition-opacity duration-300" style={{ color: T, opacity: show ? 1 : 0 }}>
                Giao dịch {heroWords[wordIdx]}
              </span>
              <span className="anim-blink" style={{ color: T }}>|</span>
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-sm">
              Dù bạn là người mới hay chuyên gia, nền tảng AI của UTRAL BOT PRO giúp bạn tự động hóa giao dịch với chiến lược đáng tin cậy trên vàng, ngoại hối, chỉ số — không cần lập trình.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/login" className="inline-flex items-center justify-center gap-2 text-white font-bold px-6 py-3.5 rounded-lg text-sm hover:opacity-90 transition" style={{ background: T }}>
                Bắt đầu dùng thử miễn phí →
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-3">Không cần thẻ tín dụng.</p>
          </div>

          {/* Right — floating network */}
          <div className="flex-1 flex justify-center items-center relative h-[400px] w-full max-w-[420px]">
            {/* Dashed lines — center at (210,200) matching globe center */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 420 400" style={{ zIndex:1 }}>
              <line x1="210" y1="200" x2="210" y2="36"  stroke={T} strokeWidth="1.2" strokeDasharray="5,5" opacity="0.4"/>
              <line x1="210" y1="200" x2="358" y2="76"  stroke={T} strokeWidth="1.2" strokeDasharray="5,5" opacity="0.4"/>
              <line x1="210" y1="200" x2="384" y2="188" stroke={T} strokeWidth="1.2" strokeDasharray="5,5" opacity="0.4"/>
              <line x1="210" y1="200" x2="316" y2="340" stroke={T} strokeWidth="1.2" strokeDasharray="5,5" opacity="0.4"/>
              <line x1="210" y1="200" x2="104" y2="340" stroke={T} strokeWidth="1.2" strokeDasharray="5,5" opacity="0.4"/>
              <line x1="210" y1="200" x2="62"  y2="76"  stroke={T} strokeWidth="1.2" strokeDasharray="5,5" opacity="0.4"/>
            </svg>

            {/* Center — Globe sphere only (text separate so translate is exact) */}
            <div className="absolute anim-float1"
              style={{ top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:10 }}>
              <div style={{
                width:108, height:108, borderRadius:"50%", position:"relative", overflow:"hidden",
                background:"radial-gradient(circle at 34% 30%, #2dffc9 0%, #00c49a 30%, #00b894 58%, #006e4e 100%)",
                boxShadow:"inset -5px -5px 14px rgba(0,0,0,0.22), inset 3px 3px 8px rgba(255,255,255,0.12), 0 8px 28px rgba(0,184,148,0.38)",
              }}>
                <svg width="108" height="108" viewBox="0 0 108 108" style={{ position:"absolute", inset:0 }}>
                  <ellipse cx="54" cy="54" rx="52" ry="13" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.7"/>
                  <ellipse cx="54" cy="54" rx="52" ry="26" fill="none" stroke="rgba(255,255,255,0.17)" strokeWidth="0.7"/>
                  <ellipse cx="54" cy="54" rx="52" ry="39" fill="none" stroke="rgba(255,255,255,0.17)" strokeWidth="0.7"/>
                  <line x1="2" y1="54" x2="106" y2="54" stroke="rgba(255,255,255,0.22)" strokeWidth="0.7"/>
                  <ellipse cx="54" cy="54" ry="52" fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="0.8"
                    style={{ rx:"52px", animation:"glob-meridian 5s linear infinite", animationDelay:"0s" }}/>
                  <ellipse cx="54" cy="54" ry="52" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.7"
                    style={{ rx:"52px", animation:"glob-meridian 5s linear infinite", animationDelay:"-1.67s" }}/>
                  <ellipse cx="54" cy="54" ry="52" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.7"
                    style={{ rx:"52px", animation:"glob-meridian 5s linear infinite", animationDelay:"-3.33s" }}/>
                </svg>
                <div style={{
                  position:"absolute", top:"8%", left:"12%", width:"33%", height:"26%",
                  background:"radial-gradient(ellipse, rgba(255,255,255,0.38) 0%, transparent 75%)",
                  borderRadius:"50%", transform:"rotate(-22deg)",
                }}/>
              </div>
            </div>
            {/* Label below globe */}
            <div className="absolute font-black text-[10px] tracking-widest text-center"
              style={{ top:"calc(50% + 62px)", left:"50%", transform:"translateX(-50%)", zIndex:10, color:T }}>
              UTRAL BOT PRO
            </div>

            {/* Satellites: top, top-right, right, bottom-right, bottom-left, top-left */}
            {[
              { style:{ top:"2%",  left:"50%", transform:"translateX(-50%)" }, cls:"anim-float2", delay:"0s",
                icon:<svg viewBox="0 0 24 24" fill="none" stroke={T} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
              { style:{ top:"12%", right:"8%" }, cls:"anim-float3", delay:"0.4s",
                icon:<svg viewBox="0 0 24 24" fill="none" stroke={T} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="3 9 9 9 9 14 15 14 15 9 21 9"/><line x1="9" y1="14" x2="9" y2="21"/><line x1="15" y1="14" x2="15" y2="21"/></svg> },
              { style:{ top:"47%", right:"2%", transform:"translateY(-50%)" }, cls:"anim-float1", delay:"0.8s",
                icon:<svg viewBox="0 0 24 24" fill="none" stroke={T} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
              { style:{ bottom:"8%", right:"18%" }, cls:"anim-float2", delay:"0.2s",
                icon:<svg viewBox="0 0 24 24" fill="none" stroke={T} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
              { style:{ bottom:"8%", left:"18%" }, cls:"anim-float3", delay:"0.6s",
                icon:<svg viewBox="0 0 24 24" fill="none" stroke={T} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
              { style:{ top:"12%", left:"8%" }, cls:"anim-float1", delay:"1s",
                icon:<svg viewBox="0 0 24 24" fill="none" stroke={T} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><polyline points="20 6 9 17 4 12"/></svg> },
            ].map((b, i) => (
              <div key={i} className={`absolute rounded-full flex items-center justify-center shadow-md ${b.cls}`}
                style={{
                  ...b.style,
                  width: 56, height: 56,
                  background: "rgba(0,184,148,0.08)",
                  border: "1.5px solid rgba(0,184,148,0.35)",
                  animationDelay: b.delay,
                  zIndex: 5,
                }}>
                {b.icon}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="px-6 pb-10">
        <div className="mx-auto max-w-5xl rounded-2xl p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
          style={{ background: T }}>
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full opacity-20" style={{ background: "rgba(255,255,255,0.4)" }} />
          <div className="absolute right-16 -bottom-8 w-32 h-32 rounded-full opacity-15" style={{ background: "rgba(255,255,255,0.4)" }} />
          <div className="relative z-10 max-w-lg">
            <h2 className="text-white font-black text-2xl mb-2">Trải nghiệm giao dịch được hỗ trợ bởi AI ngay hôm nay.</h2>
            <p className="text-white/80 text-sm leading-relaxed">Hãy để công nghệ của chúng tôi tự động hóa các giao dịch, thay thế cảm xúc bằng sự chính xác và nhất quán.</p>
          </div>
          <Link href="/login" className="relative z-10 shrink-0 bg-white font-bold text-sm px-6 py-3 rounded-lg hover:bg-gray-50 transition" style={{ color: T }}>
            Bắt đầu ngay →
          </Link>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 px-6">
        <div ref={featuresRef.ref} className="mx-auto max-w-5xl">
          <div className={`text-center mb-12 ${featuresRef.visible ? "anim-fade-up" : "opacity-0"}`}>
            <h2 className="text-2xl font-black text-[#0d2137]">Điều gì làm nên sự độc đáo của UTRAL BOT PRO?</h2>
            <div className="mx-auto mt-3 w-12 h-1 rounded-full" style={{ background: T }} />
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon:"📋", title:"Tín hiệu đã được chứng minh",  desc:"Truy cập 10+ chiến lược vào lệnh đáng tin cậy, được kiểm nghiệm bởi các nhà giao dịch trên toàn thế giới để cho bạn nền tảng vững chắc." },
              { icon:"⚙️", title:"Công cụ xây dựng chiến lược tùy chỉnh", desc:"Thiết kế và khởi chạy bot giao dịch riêng với các chỉ báo và cài đặt tùy chỉnh, giúp bạn kiểm soát hoàn toàn phương pháp giao dịch." },
              { icon:"🌐", title:"Bao phủ mọi thị trường",        desc:"Giao dịch trên mọi thị trường tài chính lớn, bao gồm ngoại hối, tiền điện tử, cổ phiếu, vàng và chỉ số thông qua một nền tảng mạnh mẽ." },
              { icon:"🧠", title:"Quyết định dựa trên trí tuệ nhân tạo", desc:"Nhận những phân tích chuyên sâu dựa trên AI, kết hợp tâm lý thị trường thời gian thực, tin tức và dữ liệu lịch sử." },
              { icon:"🔄", title:"Giao dịch hoàn toàn tự động",   desc:"Tự động hóa toàn bộ quy trình bằng cách quét thị trường, phân tích cơ hội và thực hiện giao dịch chính xác, hoàn toàn rảnh tay." },
            ].map((f, i) => (
              <div key={i}
                className={`flex gap-4 p-5 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all ${featuresRef.visible ? "anim-fade-up" : "opacity-0"}`}
                style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "rgba(0,184,148,0.1)" }}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0d2137] mb-1">{f.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STEPS ── */}
      <section className="py-20 px-6" style={{ background: "rgba(0,184,148,0.04)" }}>
        <div ref={stepsRef.ref} className="mx-auto max-w-5xl">
          <h2 className={`text-2xl font-black text-center text-[#0d2137] mb-14 ${stepsRef.visible ? "anim-fade-up" : "opacity-0"}`}>
            Bắt đầu chỉ với 3 bước đơn giản
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n:"1", icon:"🤖", title:"Xây dựng Bot Giao Dịch của Bạn",   desc:"Chọn thị trường ưa thích, áp dụng các chiến lược đáng tin cậy, tùy chỉnh cài đặt bot của bạn, và cuối cùng tải xuống phiên bản MT5 đã biên dịch.", delay:"0s" },
              { n:"2", icon:"🔗", title:"Kết nối tài khoản giao dịch của bạn", desc:"Nhập bot đã biên dịch vào nền tảng MetaTrader, liên kết nó với tài khoản giao dịch của bạn và chuẩn bị cho giao dịch thực hoặc giao dịch thử nghiệm.", delay:"0.15s" },
              { n:"3", icon:"✅", title:"Bắt đầu giao dịch tự động",          desc:"Hãy để chiến lược tự động của bạn xử lý các giao dịch một cách chính xác, được hướng dẫn bởi trí tuệ nhân tạo thời gian thực, cùng với phân tích kỹ thuật và cơ bản.", delay:"0.3s" },
            ].map((s) => (
              <div key={s.n}
                className={`rounded-2xl p-7 border-2 bg-white relative hover:shadow-lg transition-shadow ${stepsRef.visible ? "anim-fade-up" : "opacity-0"}`}
                style={{ borderColor: "rgba(0,184,148,0.35)", animationDelay: s.delay }}>
                <div className="absolute -top-4 left-6 w-8 h-8 rounded-full flex items-center justify-center font-black text-white text-sm shadow-md" style={{ background: T }}>
                  {s.n}
                </div>
                <div className="text-4xl mb-4 mt-2">{s.icon}</div>
                <h3 className="font-bold text-[#0d2137] mb-2 text-sm leading-snug">{s.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center mt-10 text-sm">
            <Link href="#" className="font-bold" style={{ color: T }}>Có vấn đề gì không? </Link>
            <span className="text-gray-500">Trung tâm hỗ trợ của chúng tôi sẽ hỗ trợ bạn.</span>
          </p>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 px-6">
        <div ref={testiRef.ref} className="mx-auto max-w-5xl">
          <div className={`flex flex-col md:flex-row justify-between items-start gap-6 mb-12 ${testiRef.visible ? "anim-fade-up" : "opacity-0"}`}>
            <h2 className="text-3xl font-black text-[#0d2137] max-w-sm leading-tight">
              Hàng ngàn nhà giao dịch tin tưởng và sử dụng UTRAL BOT PRO để đạt được lợi nhuận.
              <Link href="/login" className="block text-sm font-normal mt-2 hover:underline" style={{ color: T }}>Xem tất cả →</Link>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name:"Nguyễn Văn Tuấn", stars:5, title:"Bot giao dịch tốt nhất tôi từng dùng.", body:"\"Đây là bot giao dịch ngoại hối tốt nhất mà tôi từng sử dụng. Tôi đã kết nối hơn 3 tài khoản MT5 và đang thử nghiệm...\"", delay:"0s" },
              { name:"Trần Minh Khoa",  stars:5, title:"UTRAL BOT PRO thực sự hiệu quả!",      body:"\"Trước hết, bot thực sự rất hiệu quả! Bên cạnh đó, nếu có cập nhật hoặc cần trợ giúp, đội ngũ sẽ dành thời gian giải thích cho bạn...\"", delay:"0.1s" },
              { name:"Lê Thị Hương",   stars:5, title:"Dịch vụ khách hàng tuyệt vời",          body:"\"Dịch vụ khách hàng tuyệt vời! Nhân viên hỗ trợ trên Zalo rất chu đáo và nhiệt tình. Bot có vẻ rất thận trọng ngay cả ở cài đặt rủi ro trung bình...\"", delay:"0.2s" },
            ].map((t, i) => (
              <div key={i}
                className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow ${testiRef.visible ? "anim-fade-up" : "opacity-0"}`}
                style={{ animationDelay: t.delay }}>
                <div className="flex gap-0.5 mb-3">
                  {Array(t.stars).fill(0).map((_, j) => <span key={j} className="text-yellow-400 text-base">★</span>)}
                </div>
                <p className="font-bold text-sm text-[#0d2137] mb-2">{t.title}</p>
                <p className="text-gray-500 text-xs leading-relaxed mb-5">{t.body}</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: T }}>
                    {t.name[0]}
                  </div>
                  <span className="text-sm font-medium text-[#0d2137]">{t.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAL TRIANGLE DIVIDER ── */}
      <div className="relative h-24 overflow-hidden">
        <div className="absolute bottom-0 left-0 w-0 h-0"
          style={{ borderBottom: `96px solid ${T}`, borderRight: "260px solid transparent", opacity: 0.9 }} />
        <div className="absolute bottom-0 left-0 w-0 h-0"
          style={{ borderBottom: `96px solid ${T}`, borderRight: "180px solid transparent", opacity: 0.6 }} />
      </div>

      {/* ── STATS ── */}
      <section className="py-20 px-6 bg-white">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-2xl font-black text-[#0d2137] mb-3">Được tin dùng trên toàn thế giới từ năm 2021.</h2>
          <p className="text-gray-500 text-sm mb-12">Hàng ngàn nhà giao dịch đã tự động hóa chiến lược của họ với UTRAL BOT PRO.</p>
          <div className="grid grid-cols-3 gap-8">
            {[
              { value:"+5.000", label:"Các thương nhân đã đăng ký" },
              { value:"24/7",   label:"Hệ thống hoạt động liên tục" },
              { value:"<1s",    label:"Tốc độ đặt lệnh" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-4xl font-black mb-2" style={{ color: T }}>{s.value}</div>
                <div className="text-gray-500 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-6" style={{ background: "rgba(0,184,148,0.03)" }}>
        <div ref={faqRef.ref} className="mx-auto max-w-3xl">
          <h2 className={`text-2xl font-black text-[#0d2137] text-center mb-12 ${faqRef.visible ? "anim-fade-up" : "opacity-0"}`}>
            Câu hỏi thường gặp
          </h2>
          <div className={faqRef.visible ? "anim-fade-up" : "opacity-0"}>
            {[
              { q:"Tôi có thể giao dịch những thị trường nào?", a:"Với UTRAL BOT PRO, bạn có thể xây dựng bot giao dịch cho các cặp ngoại hối, kim loại như vàng và bạc, cổ phiếu toàn cầu, tiền điện tử và các chỉ số thị trường hàng đầu — hoàn toàn tương thích với nền tảng MT5 của sàn giao dịch của bạn." },
              { q:"Tôi có cần kỹ năng lập trình để sử dụng không?", a:"Không, bạn không cần bất kỳ kỹ năng lập trình nào. Nền tảng được thiết kế thân thiện với người mới bắt đầu, với giao diện trực quan cho phép bạn xây dựng và tùy chỉnh bot giao dịch mà không cần kiến thức lập trình." },
              { q:"UTRAL BOT PRO có an toàn với tài khoản sàn của tôi không?", a:"UTRAL BOT PRO xây dựng bot và cài đặt trên nền tảng của sàn giao dịch thông qua file MT5. Điều này có nghĩa là tiền của bạn không bao giờ được lưu trữ tại UTRAL BOT PRO — số dư của bạn luôn nằm trong tài khoản sàn của bạn." },
              { q:"Hệ điều hành nào được hỗ trợ?", a:"UTRAL BOT PRO được thiết kế để chạy trên nền tảng MetaTrader 5 (MT5), phải được cài đặt trên máy tính Windows hoặc VPS để có đầy đủ chức năng." },
              { q:"Tôi cần số vốn tối thiểu bao nhiêu?", a:"Không có số tiền cố định nào được yêu cầu, nhưng phân bổ nhiều vốn hơn sẽ cho bạn sự linh hoạt lớn hơn. Hầu hết người dùng bắt đầu với ít hơn $1,000, nhưng để hiệu suất tốt hơn, chúng tôi khuyến nghị bắt đầu với hơn $1,000." },
              { q:"Tỷ lệ đòn bẩy nào bạn khuyến nghị?", a:"Để có hiệu suất tối ưu, chúng tôi khuyến nghị sử dụng tỷ lệ đòn bẩy ít nhất 1:200." },
              { q:"Mất bao lâu để giải quyết yêu cầu hỗ trợ?", a:"UTRAL BOT PRO hướng đến việc phản hồi tất cả các yêu cầu hỗ trợ trong vòng 24 giờ. Bạn cũng có thể liên hệ qua Zalo để được hỗ trợ nhanh hơn." },
            ].map((item) => <FaqItem key={item.q} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 py-16 px-6 bg-white">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row gap-12 mb-12">
            {/* Brand */}
            <div className="flex-1 max-w-xs">
              <div className="flex items-center gap-0.5 mb-3">
                <span className="font-black text-2xl leading-none" style={{ color: T }}>U</span>
                <span className="font-black text-xl text-[#0d2137] leading-none">TRAL BOT PRO</span>
              </div>
              <p className="text-gray-500 text-xs leading-relaxed mb-5">
                UTRAL BOT PRO là công cụ xây dựng bot giao dịch tự động được hỗ trợ bởi AI. Được thiết kế cho mọi thị trường. Hỗ trợ tích hợp ChatGPT để có phân tích chuyên sâu hơn.
              </p>
              <div className="flex gap-2">
                {[
                  { l:"f", title:"Facebook" },
                  { l:"ig", title:"Instagram" },
                  { l:"tg", title:"Telegram" },
                  { l:"yt", title:"Youtube" },
                ].map((s) => (
                  <div key={s.l} title={s.title}
                    className="w-9 h-9 rounded-full flex items-center justify-center border-2 text-xs font-bold cursor-pointer hover:opacity-80 transition"
                    style={{ borderColor: T, color: T }}>
                    {s.l.toUpperCase()}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-16 flex-wrap">
              <div>
                <h4 className="font-bold text-sm mb-4" style={{ color: T }}>Công ty</h4>
                <div className="space-y-3">
                  {["Điều khoản","Chính sách","Thông báo pháp lý"].map((l) => (
                    <div key={l}><Link href="#" className="text-gray-500 text-sm hover:text-[#00b894] transition">{l}</Link></div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-sm mb-4" style={{ color: T }}>Liên kết</h4>
                <div className="space-y-3">
                  {["Hỗ trợ","Blog","Liên hệ"].map((l) => (
                    <div key={l}><Link href="#" className="text-gray-500 text-sm hover:text-[#00b894] transition">{l}</Link></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="border-t border-gray-100 pt-8">
            <p className="text-xs font-bold text-[#0d2137] mb-3">Tuyên bố miễn trừ trách nhiệm – Thông báo rủi ro</p>
            <p className="text-xs text-gray-400 leading-relaxed mb-3">
              Giao dịch ngoại hối (forex) ẩn chứa rủi ro cao và có thể không phù hợp với tất cả các nhà đầu tư. Đòn bẩy có thể gây bất lợi cũng như có lợi cho bạn. Trước khi quyết định giao dịch, bạn nên cân nhắc kỹ mục tiêu đầu tư, trình độ kinh nghiệm và khả năng chấp nhận rủi ro của mình. Có khả năng bạn sẽ mất một phần hoặc toàn bộ số vốn đầu tư ban đầu. Không nên giao dịch với số vốn mà bạn không đủ khả năng để mất.
            </p>
            <p className="text-xs text-gray-400 leading-relaxed mb-3">
              Tất cả nội dung do UTRAL BOT PRO cung cấp, bao gồm bất kỳ dữ liệu hiệu suất, ví dụ giao dịch hoặc tài liệu giáo dục nào, chỉ nhằm mục đích thông tin và giáo dục. Nội dung này không cấu thành tư vấn tài chính hoặc khuyến nghị mua hoặc bán bất kỳ công cụ tài chính nào.
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Bằng cách sử dụng phần mềm và dịch vụ của UTRAL BOT PRO, bạn thừa nhận rằng bạn hoàn toàn hiểu các rủi ro liên quan. Hiệu quả hoạt động trong quá khứ không nhất thiết phản ánh kết quả trong tương lai.
            </p>
            <p className="text-xs text-gray-400 mt-5">© 2021-2026 UTRAL BOT PRO. Mọi quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
