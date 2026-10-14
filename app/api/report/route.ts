import { loadDashboard, summarize } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  const d = await loadDashboard();
  return Response.json({ summary: summarize(d), data: d });
}
