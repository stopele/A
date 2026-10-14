import { store } from "./config";
import { getBank, getCardSales, getPos, getTax } from "./sources/finance";
import { getSns } from "./sources/instagram";
import { getKeywordRanks } from "./sources/naver";
import { getOpenings } from "./sources/openings";
import { getReviews } from "./sources/reviews";

export async function loadDashboard() {
  const [sales, bank, tax, pos, ranks, openings, reviews, sns] = await Promise.all([
    getCardSales(), getBank(), getTax(), getPos(), getKeywordRanks(), getOpenings(), getReviews(), getSns(),
  ]);
  return { sales, bank, tax, pos, ranks, openings, reviews, sns };
}

export type Dashboard = Awaited<ReturnType<typeof loadDashboard>>;

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

// 알림·리포트용 요약 문장
export function summarize(d: Dashboard): string {
  const s = d.sales.data;
  const diff = s.today - s.yesterday;
  const lines = [
    `[${store.name}] 오늘의 가게 리포트`,
    `• 오늘 카드매출 ${won(s.today)} (어제 대비 ${diff >= 0 ? "+" : ""}${won(diff)})`,
    `• 이번 달 누적 ${won(s.monthTotal)}`,
  ];
  const next = s.upcomingDeposit[0];
  if (next) lines.push(`• 다음 입금 ${next.date} ${won(next.amount)}`);
  for (const r of d.ranks.data) {
    lines.push(`• '${r.keyword}' 순위 ${r.rank ? `${r.rank}위` : "5위 밖"}`);
  }
  const competitors = d.openings.data.filter((o) => o.competitor);
  if (competitors.length) lines.push(`• 주변 경쟁 업종 개업 ${competitors.length}곳: ${competitors.map((c) => c.name).join(", ")}`);
  const rv = d.reviews.data;
  if (rv.averageRating) lines.push(`• 리뷰 평점 ${rv.averageRating.toFixed(1)}`);
  const low = rv.recent.filter((r) => r.rating !== null && r.rating <= 3);
  if (low.length) lines.push(`• 확인 필요한 낮은 별점 리뷰 ${low.length}건`);
  lines.push(`• 인스타 어제 언급 ${d.sns.data.yesterdayMentions}건`);
  const demo = Object.entries(d).filter(([, v]) => v.mode !== "live").length;
  if (demo) lines.push(`(샘플 데이터 포함 ${demo}개 항목)`);
  return lines.join("\n");
}
