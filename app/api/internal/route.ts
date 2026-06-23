import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function checkSecret(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret");
  return secret === process.env.INTERNAL_API_SECRET;
}

// GET /api/internal?type=active|pending
export async function GET(req: NextRequest) {
  if (!checkSecret(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const type = req.nextUrl.searchParams.get("type");
  const status = type === "pending" ? "pending" : "connected";
  const accounts = await prisma.mt5Account.findMany({
    where: { isActive: true, status },
    select: { id: true, name: true, mt5Login: true, mt5Password: true, mt5Server: true, terminalPath: true },
  });
  return NextResponse.json(accounts);
}

// PATCH /api/internal?id=xxx&action=status&value=connected
export async function PATCH(req: NextRequest) {
  if (!checkSecret(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  const action = req.nextUrl.searchParams.get("action");
  const value = req.nextUrl.searchParams.get("value");
  if (!id || !action || !value) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  if (action === "status") {
    await prisma.mt5Account.update({ where: { id }, data: { status: value } });
  } else if (action === "terminal") {
    await prisma.mt5Account.update({ where: { id }, data: { terminalPath: value } });
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

// POST /api/internal — log trade
export async function POST(req: NextRequest) {
  if (!checkSecret(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { signal, status, result } = await req.json();
  await prisma.tradeLog.create({ data: { signal, status, result } });
  return NextResponse.json({ ok: true });
}
