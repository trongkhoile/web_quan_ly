import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  if (!session?.isAdmin) throw new Error("forbidden");
}

// DELETE /api/admin/accounts?id=xxx — xóa 1 tài khoản MT5
export async function DELETE(req: NextRequest) {
  try { await requireAdmin(); }
  catch { return NextResponse.json({ error: "Không có quyền" }, { status: 403 }); }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });

  await prisma.mt5Account.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// PATCH /api/admin/accounts?id=xxx — toggle isActive
export async function PATCH(req: NextRequest) {
  try { await requireAdmin(); }
  catch { return NextResponse.json({ error: "Không có quyền" }, { status: 403 }); }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });

  const { isActive } = await req.json();
  const updated = await prisma.mt5Account.update({ where: { id }, data: { isActive } });
  return NextResponse.json({ ok: true, isActive: updated.isActive });
}
