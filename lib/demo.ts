// 키가 없을 때 화면을 채우는 샘플 데이터. 날짜 기반으로 고정되어 새로고침해도 같은 값이 나온다.
import { store } from "./config";
import type {
  BankTx, CardSales, KeywordRank, NewBusiness, PosSummary, ReviewSummary, SnsSummary, TaxSummary,
} from "./types";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function ymd(d: Date): string {
  const kst = new Date(d.getTime() + 9 * 3600_000);
  return kst.toISOString().slice(0, 10);
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86400_000);
}

export function demoCardSales(): CardSales {
  const rand = seeded(Number(ymd(new Date()).replaceAll("-", "")));
  const days = Array.from({ length: 14 }, (_, i) => {
    const amount = Math.round((300_000 + rand() * 900_000) / 100) * 100;
    return { date: ymd(daysAgo(13 - i)), amount, deposit: Math.round(amount * 0.978) };
  });
  const today = days[days.length - 1].amount;
  const yesterday = days[days.length - 2].amount;
  const month = ymd(new Date()).slice(0, 7);
  const monthTotal = days.filter((d) => d.date.startsWith(month)).reduce((a, d) => a + d.amount, 0);
  const upcomingDeposit = [1, 2, 3].map((n) => ({
    date: ymd(new Date(Date.now() + n * 86400_000)),
    amount: days[days.length - 1 - n].deposit,
  }));
  return { today, yesterday, monthTotal, upcomingDeposit, days };
}

export function demoBank(): BankTx[] {
  return [
    { date: ymd(daysAgo(0)), description: "카드사 정산 입금", amount: 612_400 },
    { date: ymd(daysAgo(0)), description: "식자재 결제", amount: -284_000 },
    { date: ymd(daysAgo(1)), description: "배달앱 정산 입금", amount: 198_700 },
    { date: ymd(daysAgo(1)), description: "가스요금", amount: -132_500 },
    { date: ymd(daysAgo(2)), description: "카드사 정산 입금", amount: 541_900 },
  ];
}

export function demoTax(): TaxSummary {
  return {
    salesInvoiceTotal: 1_250_000,
    purchaseInvoiceTotal: 6_840_000,
    cashReceiptTotal: 2_310_000,
    estimatedVat: 1_120_000,
    nextDeadline: { label: "부가세 확정신고", date: `${new Date().getFullYear() + 1}-01-25` },
  };
}

export function demoPos(): PosSummary {
  return {
    todayOrders: 64,
    avgTicket: 18_900,
    topItems: [
      { name: "샤브샤브 무한리필", qty: 41 },
      { name: "소고기 추가", qty: 17 },
      { name: "칼국수 사리", qty: 15 },
    ],
  };
}

export function demoRanks(): KeywordRank[] {
  return store.keywords.map((keyword, i) => ({
    keyword,
    rank: [3, 5, null][i % 3],
    topStore: i === 0 ? "샤브앤 구이랑" : null,
    monthlySearches: [2_340, 1_120, 18_600][i % 3],
  }));
}

export function demoOpenings(): NewBusiness[] {
  return [
    { name: "진접 훠궈하우스", category: "일반음식점", address: `${store.region} 해밀예당1로`, openedOn: ymd(daysAgo(3)), competitor: true },
    { name: "카페 온새미로", category: "휴게음식점", address: `${store.region} 금강로`, openedOn: ymd(daysAgo(9)), competitor: false },
    { name: "진접 돈까스", category: "일반음식점", address: `${store.region} 장현로`, openedOn: ymd(daysAgo(17)), competitor: false },
  ];
}

export function demoReviews(): ReviewSummary {
  return {
    monthCount: 48,
    lastMonthCount: 45,
    totalCount: 1_284,
    averageRating: 4.6,
    recent: [
      { source: "네이버", author: "진접주민", rating: 5, text: "고기 질이 좋고 리필이 빨라요. 아이랑 가기 좋아요.", date: ymd(daysAgo(0)) },
      { source: "구글", author: "J. Kim", rating: 5, text: "가성비 최고 샤브샤브집", date: ymd(daysAgo(1)) },
      { source: "배달의민족", author: "배민고객", rating: 4, text: "포장도 깔끔했어요. 국물 양이 조금 아쉬움", date: ymd(daysAgo(2)) },
    ],
  };
}

export function demoSns(): SnsSummary {
  return {
    yesterdayMentions: 0,
    recent: [{ caption: "진접 샤브샤브 무한리필 다녀왔어요 🍲", url: "https://www.instagram.com/", date: ymd(daysAgo(2)) }],
    relatedTags: ["진접맛집", "남양주맛집", "샤브샤브무한리필", "오남맛집"],
  };
}
