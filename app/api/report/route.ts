import { loadDashboard, summarize } from "@/lib/dashboard";
import { ALL, resolveScope } from "@/lib/scope";

export const dynamic = "force-dynamic";

// ?store=매장id 로 매장별 리포트
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("store") ?? ALL;
  const scope = resolveScope(id);
  if (!scope) return Response.json({ error: "unknown store" }, { status: 404 });
  const d = await loadDashboard(scope);
  return Response.json({ summary: summarize(d), data: d });
}
