import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  if (!session?.isAdmin) throw new Error("forbidden");
  return session;
}

// GET /api/admin/users — danh sách tất cả user + accounts
export async function GET() {
  try { await requireAdmin(); }
  catch { return NextResponse.json({ error: "Không có quyền" }, { status: 403 }); }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      isAdmin: true,
      isApproved: true,
      isBlocked: true,
      createdAt: true,
      accounts: {
        select: { id: true, name: true, mt5Login: true, mt5Server: true, isActive: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return NextResponse.json(users);
}

// PATCH /api/admin/users?id=xxx — duyệt hoặc khóa user
export async function PATCH(req: NextRequest) {
  try { await requireAdmin(); }
  catch { return NextResponse.json({ error: "Không có quyền" }, { status: 403 }); }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });

  const { action } = await req.json();
  if (action === "approve") {
    await prisma.user.update({ where: { id }, data: { isApproved: true, isBlocked: false } });
  } else if (action === "block") {
    await prisma.user.update({ where: { id }, data: { isBlocked: true, isApproved: false } });
  } else if (action === "unblock") {
    await prisma.user.update({ where: { id }, data: { isBlocked: false } });
  } else {
    return NextResponse.json({ error: "Action không hợp lệ" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/users?id=xxx — xóa user + toàn bộ accounts của họ
export async function DELETE(req: NextRequest) {
  try { await requireAdmin(); }
  catch { return NextResponse.json({ error: "Không có quyền" }, { status: 403 }); }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });

  const session = await getSession();
  if (id === session!.userId) {
    return NextResponse.json({ error: "Không thể xóa tài khoản admin đang đăng nhập" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
