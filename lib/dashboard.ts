import type { Scope } from "./scope";
import { loadOpenings, loadPos, loadRanks, loadReviews, loadSales, loadSns } from "./scope";
import { getBank, getTax } from "./sources/finance";

export async function loadDashboard(scope: Scope) {
  const [sales, pos, ranks, openings, reviews, sns, tax, bank] = await Promise.all([
    loadSales(scope), loadPos(scope), loadRanks(scope), loadOpenings(scope), loadReviews(scope), loadSns(scope),
    scope.isAll ? getTax() : null,
    scope.isAll ? getBank() : null,
  ]);
  return { scope, sales, pos, ranks, openings, reviews, sns, tax, bank };
}

export type Dashboard = Awaited<ReturnType<typeof loadDashboard>>;

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

const signed = (n: number) => `${n >= 0 ? "+" : ""}${won(n)}`;

// 알림·리포트용 요약 문장
export function summarize(d: Dashboard): string {
  const s = d.sales.data;
  const lines = [
    `[${d.scope.label}] 오늘의 리포트`,
    `• 오늘 카드매출 ${won(s.today)} (어제 대비 ${signed(s.today - s.yesterday)})`,
    `• 이번 달 누적 ${won(s.monthTotal)}`,
  ];
  if (d.scope.isAll) {
    for (const p of d.sales.perStore) lines.push(`   - ${p.store.name} ${won(p.data.today)}`);
  }
  const next = s.upcomingDeposit[0];
  if (next) lines.push(`• 다음 입금 ${next.date} ${won(next.amount)}`);
  const ranked = d.ranks.data.filter((r) => r.rank !== null);
  const outside = d.ranks.data.filter((r) => r.rank === null);
  if (ranked.length) lines.push(`• 검색 5위 안 키워드 ${ranked.length}개${outside.length ? `, 순위 밖 ${outside.length}개` : ""}`);
  const competitors = d.openings.data.filter((o) => o.competitor);
  if (competitors.length) lines.push(`• 주변 경쟁 업종 개업 ${competitors.length}곳: ${competitors.map((c) => c.name).join(", ")}`);
  const rv = d.reviews.data;
  if (rv.averageRating) lines.push(`• 리뷰 평점 ${rv.averageRating.toFixed(1)}`);
  const low = rv.recent.filter((r) => r.rating !== null && r.rating <= 3);
  if (low.length) {
    lines.push(`• 답변 필요한 낮은 별점 리뷰 ${low.length}건${d.scope.isAll ? ` (${[...new Set(low.map((r) => r.store))].join(", ")})` : ""}`);
  }
  lines.push(`• 인스타 어제 언급 ${d.sns.data.yesterdayMentions}건`);
  const sections = [d.sales, d.pos, d.ranks, d.openings, d.reviews, d.sns, d.tax, d.bank].filter((x) => x && x.mode === "demo");
  if (sections.length) lines.push(`(샘플 데이터 포함 ${sections.length}개 항목)`);
  return lines.join("\n");
}
