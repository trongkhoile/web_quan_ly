import { NextRequest, NextResponse } from "next/server";
import { parseSignal } from "@/lib/signal-parser";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const message: string | undefined =
    body?.message?.text ||
    body?.channel_post?.text ||
    body?.edited_message?.text ||
    body?.edited_channel_post?.text;

  if (!message) return NextResponse.json({ ok: true });

  const chatId = String(
    body?.message?.chat?.id ??
    body?.channel_post?.chat?.id ??
    body?.edited_message?.chat?.id ??
    body?.edited_channel_post?.chat?.id
  );

  if (chatId !== process.env.TELEGRAM_GROUP_ID) {
    return NextResponse.json({ ok: true });
  }

  const signal = parseSignal(message);
  if (!signal) return NextResponse.json({ ok: true });

  // Tín hiệu được xử lý bởi Python trader service (main.py) qua Telegram polling.
  // Route này chỉ nhận webhook để không bị timeout từ Telegram.
  await prisma.tradeLog.create({
    data: { signal: message, status: "received", result: "forwarded to Python trader" },
  });

  return NextResponse.json({ ok: true });
}
