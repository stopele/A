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
  const shares: [string, number][] = [
    ["신한카드", 0.24], ["KB국민카드", 0.19], ["삼성카드", 0.16], ["현대카드", 0.13],
    ["BC카드", 0.1], ["롯데카드", 0.08], ["하나카드", 0.06], ["NH농협카드", 0.04],
  ];
  const byCard = shares.map(([name, r]) => ({ name, amount: Math.round((monthTotal * r) / 100) * 100 }));
  return { today, yesterday, monthTotal, upcomingDeposit, days, byCard };
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
    invoices: [
      { date: ymd(daysAgo(1)), kind: "매입", partner: "(주)한우유통", amount: 1_870_000 },
      { date: ymd(daysAgo(3)), kind: "매입", partner: "진접청과", amount: 640_000 },
      { date: ymd(daysAgo(4)), kind: "매출", partner: "남양주시청 (단체 회식)", amount: 850_000 },
      { date: ymd(daysAgo(6)), kind: "매입", partner: "도시가스", amount: 412_000 },
      { date: ymd(daysAgo(8)), kind: "현금영수증", partner: "개인 고객 23건", amount: 1_010_000 },
      { date: ymd(daysAgo(11)), kind: "매출", partner: "진접초 학부모회", amount: 400_000 },
      { date: ymd(daysAgo(13)), kind: "매입", partner: "(주)한우유통", amount: 2_150_000 },
    ],
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
      { name: "음료/주류", qty: 38 },
      { name: "죽 세트", qty: 11 },
      { name: "어린이 메뉴", qty: 6 },
    ],
    hourly: [
      { hour: 11, orders: 4 }, { hour: 12, orders: 11 }, { hour: 13, orders: 8 }, { hour: 14, orders: 3 },
      { hour: 15, orders: 1 }, { hour: 16, orders: 2 }, { hour: 17, orders: 6 }, { hour: 18, orders: 12 },
      { hour: 19, orders: 10 }, { hour: 20, orders: 5 }, { hour: 21, orders: 2 },
    ],
    payments: [
      { method: "카드", amount: 1_008_000 },
      { method: "간편결제", amount: 126_000 },
      { method: "현금", amount: 75_600 },
    ],
  };
}

export function demoRanks(): KeywordRank[] {
  return store.keywords.map((keyword, i) => ({
    keyword,
    rank: [3, 5, null][i % 3],
    topStore: ["샤브앤 구이랑", "진접 샤브마을", "진접 국밥"][i % 3],
    stores: [
      ["샤브앤 구이랑", "진접 샤브마을", store.name, "샤브향 진접점", "월남샤브 남양주"],
      ["진접 샤브마을", "샤브앤 구이랑", "샤브향 진접점", "월남샤브 남양주", store.name],
      ["진접 국밥", "진접 갈비", "카페 온새미로", "진접 돈까스", "샤브앤 구이랑"],
    ][i % 3],
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
      { source: "네이버", author: "오남동주부", rating: 5, text: "직원분들이 친절하시고 채소가 신선해요.", date: ymd(daysAgo(3)) },
      { source: "네이버", author: "맛집탐방러", rating: 3, text: "주말 저녁에 대기가 너무 길었어요. 맛은 괜찮았습니다.", date: ymd(daysAgo(4)) },
      { source: "구글", author: "Minji P.", rating: 5, text: "아이 의자랑 어린이 메뉴가 있어서 좋았어요", date: ymd(daysAgo(6)) },
      { source: "배달의민족", author: "배민고객", rating: 2, text: "배달이 예상보다 30분 늦었어요.", date: ymd(daysAgo(8)) },
      { source: "네이버", author: "진접직장인", rating: 5, text: "점심 특선 가성비 좋아요", date: ymd(daysAgo(10)) },
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
