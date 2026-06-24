import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/trades?accountId=xxx
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const accountId = req.nextUrl.searchParams.get("accountId");

  // Verify ownership
  if (accountId) {
    const account = await prisma.mt5Account.findUnique({ where: { id: accountId } });
    if (!account || account.userId !== session.userId)
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const trades = await prisma.tradeHistory.findMany({
    where: accountId
      ? { accountId }
      : { account: { userId: session.userId } },
    orderBy: { closeTime: "desc" },
    take: 100,
    select: {
      id: true, symbol: true, type: true, lot: true,
      openPrice: true, closePrice: true, profit: true,
      openTime: true, closeTime: true, accountId: true,
      account: { select: { name: true } },
    },
  });
  return NextResponse.json(trades);
}
