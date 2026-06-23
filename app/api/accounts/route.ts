import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("unauthorized");
  return session;
}

// GET /api/accounts
export async function GET() {
  let session;
  try { session = await requireSession(); }
  catch { return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 }); }

  const accounts = await prisma.mt5Account.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, mt5Login: true, mt5Server: true, isActive: true, status: true, createdAt: true },
  });
  return NextResponse.json(accounts);
}

// POST /api/accounts
export async function POST(req: NextRequest) {
  let session;
  try { session = await requireSession(); }
  catch { return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 }); }

  const { name, mt5Login, mt5Password, mt5Server } = await req.json();
  if (!name || !mt5Login || !mt5Password || !mt5Server) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
  }

  const count = await prisma.mt5Account.count({ where: { userId: session.userId } });
  if (count >= 3) {
    return NextResponse.json({ error: "Mỗi tài khoản chỉ được đăng ký tối đa 3 tài khoản MT5" }, { status: 400 });
  }

  try {
    const record = await prisma.mt5Account.create({
      data: { userId: session.userId, name, mt5Login, mt5Password, mt5Server, status: "pending" },
    });
    return NextResponse.json({ ok: true, id: record.id }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: `Tài khoản MT5 ${mt5Login} trên server ${mt5Server} đã được đăng ký` }, { status: 409 });
    }
    throw e;
  }
}

// DELETE /api/accounts?id=xxx
export async function DELETE(req: NextRequest) {
  let session;
  try { session = await requireSession(); }
  catch { return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 }); }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });

  const account = await prisma.mt5Account.findUnique({ where: { id } });
  if (!account) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  if (account.userId !== session.userId) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  await prisma.mt5Account.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
