// 매일 정해진 시간에 텔레그램으로 리포트를 보낸다 (vercel.json 의 cron 이 호출).
import { env } from "@/lib/config";
import { loadDashboard, summarize } from "@/lib/dashboard";
import { ALL, resolveScope } from "@/lib/scope";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = env("CRON_SECRET");
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const botToken = env("TELEGRAM_BOT_TOKEN");
  const chatId = env("TELEGRAM_CHAT_ID");
  if (!botToken || !chatId) {
    return Response.json({ sent: false, reason: "TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID 미설정" });
  }
  const text = summarize(await loadDashboard(resolveScope(ALL)!));
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  return Response.json({ sent: res.ok }, { status: res.ok ? 200 : 502 });
}
