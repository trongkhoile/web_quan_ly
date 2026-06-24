import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "change-me-to-random-secret-in-production"
);

// Rate limiting: tối đa 3 lần đăng ký / IP / giờ
const attempts = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && now < entry.reset) {
    if (entry.count >= 3) return false;
    entry.count++;
  } else {
    attempts.set(ip, { count: 1, reset: now + 3_600_000 });
  }
  return true;
}

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY ?? "";
  if (!secret || secret.startsWith("1x0000")) return true;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });
  const data = await res.json();
  return data.success === true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau 1 giờ." },
      { status: 429 }
    );
  }

  const { name, email, password, captchaToken, captchaAnswer, turnstileToken } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Mật khẩu tối thiểu 6 ký tự" }, { status: 400 });
  }

  // Verify Cloudflare Turnstile
  if (!turnstileToken) {
    return NextResponse.json({ error: "Vui lòng hoàn thành xác thực Turnstile" }, { status: 400 });
  }
  const turnstileOk = await verifyTurnstile(turnstileToken);
  if (!turnstileOk) {
    return NextResponse.json({ error: "Xác thực Turnstile thất bại, vui lòng thử lại" }, { status: 400 });
  }

  // Verify math captcha
  if (!captchaToken || captchaAnswer === undefined) {
    return NextResponse.json({ error: "Thiếu xác thực captcha" }, { status: 400 });
  }
  try {
    const { payload } = await jwtVerify(captchaToken, SECRET);
    if (Number(payload.answer) !== Number(captchaAnswer)) {
      return NextResponse.json({ error: "Kết quả phép tính không đúng" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Captcha hết hạn, vui lòng thử lại" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email đã được sử dụng" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const isAdmin = process.env.ADMIN_EMAIL === email;
  const user = await prisma.user.create({
    data: { name, email, password: hashed, isAdmin, isApproved: isAdmin },
  });

  if (!isAdmin) {
    return NextResponse.json({ ok: true, pending: true }, { status: 201 });
  }

  await createSession({ userId: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin });
  return NextResponse.json({ ok: true }, { status: 201 });
}
