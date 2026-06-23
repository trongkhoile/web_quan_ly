import { NextResponse } from "next/server";

// GET /api/setup-webhook — tự động đăng ký webhook URL với Telegram
export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!botToken || !appUrl || !secret) {
    return NextResponse.json({ error: "Chưa cấu hình env" }, { status: 500 });
  }

  const webhookUrl = `${appUrl}/api/webhook`;
  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: secret,
        allowed_updates: ["message", "channel_post", "edited_message", "edited_channel_post"],
      }),
    }
  );

  const data = await res.json();
  return NextResponse.json(data);
}
