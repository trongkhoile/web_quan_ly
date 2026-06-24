import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function checkSecret(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret");
  return secret === process.env.INTERNAL_API_SECRET;
}

// GET /api/internal?type=active|pending|all
export async function GET(req: NextRequest) {
  if (!checkSecret(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const type = req.nextUrl.searchParams.get("type");

  if (type === "all") {
    const accounts = await prisma.mt5Account.findMany({
      select: { id: true, isActive: true, signalMode: true },
    });
    return NextResponse.json(accounts);
  }

  const status = type === "pending" ? "pending" : "connected";
  const accounts = await prisma.mt5Account.findMany({
    where: { isActive: true, status },
    select: { id: true, name: true, mt5Login: true, mt5Password: true, mt5Server: true, terminalPath: true, signalMode: true },
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

// POST /api/internal — log trade signal OR push trade history
export async function POST(req: NextRequest) {
  if (!checkSecret(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  // Trade history push: { type: "trade", accountId, dealTicket, symbol, tradeType, lot, openPrice, closePrice, profit, openTime, closeTime }
  if (body.type === "trade") {
    const { accountId, dealTicket, symbol, tradeType, lot, openPrice, closePrice, profit, openTime, closeTime } = body;
    const data = {
      accountId, symbol,
      dealTicket: dealTicket ? String(dealTicket) : undefined,
      type: tradeType,
      lot: Number(lot),
      openPrice: Number(openPrice),
      closePrice: Number(closePrice),
      profit: Number(profit),
      openTime: new Date(openTime),
      closeTime: new Date(closeTime),
    };
    if (dealTicket) {
      // upsert: bỏ qua nếu deal đã tồn tại (tránh duplicate khi nhiều worker)
      await prisma.tradeHistory.upsert({
        where: { dealTicket: String(dealTicket) },
        create: data,
        update: {},
      });
    } else {
      await prisma.tradeHistory.create({ data });
    }
    return NextResponse.json({ ok: true });
  }

  // Default: signal log
  const { signal, status, result } = body;
  await prisma.tradeLog.create({ data: { signal, status, result } });
  return NextResponse.json({ ok: true });
}
