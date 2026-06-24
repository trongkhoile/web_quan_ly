import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";


export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Thiếu email hoặc mật khẩu" }, { status: 400 });
  }

  // Cho phép đăng nhập bằng tên (Admin123) hoặc email
  const user = await prisma.user.findFirst({
    where: { OR: [{ email }, { name: email }] },
  });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 });
  }

  if (user.isBlocked) {
    return NextResponse.json({ error: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin." }, { status: 403 });
  }

  if (!user.isApproved) {
    return NextResponse.json({ error: "Tài khoản của bạn đang chờ admin duyệt." }, { status: 403 });
  }

  // Tự động cấp admin nếu email khớp ADMIN_EMAIL và chưa được set
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && user.email === adminEmail && !user.isAdmin) {
    await prisma.user.update({ where: { id: user.id }, data: { isAdmin: true } });
    user.isAdmin = true;
  }

  await createSession({ userId: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin });
  return NextResponse.json({ ok: true, isAdmin: user.isAdmin });
}
