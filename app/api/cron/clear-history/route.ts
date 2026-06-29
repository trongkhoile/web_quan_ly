import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [trades, logs] = await Promise.all([
    prisma.tradeHistory.deleteMany(),
    prisma.tradeLog.deleteMany(),
  ]);

  return NextResponse.json({
    ok: true,
    deleted: { tradeHistory: trades.count, tradeLog: logs.count },
  });
}
