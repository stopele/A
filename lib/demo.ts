// 키가 없을 때 화면을 채우는 매장별 샘플 데이터. 날짜·매장 기준으로 고정되어 새로고침해도 같은 값이 나온다.
import type { Store } from "./config";
import type {
  BankTx, CardSales, KeywordRank, NewBusiness, PosSummary, ReviewSummary, SnsSummary, TaxSummary,
} from "./types";

function hash(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 100_000;
  return h;
}

function seeded(seed: number) {
  let s = seed % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// 한국 시간 기준 YYYY-MM-DD
export function ymd(d: Date): string {
  return new Date(d.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86400_000);
}

const today = () => ymd(new Date());
const rng = (store: Store, salt = "") => seeded(Number(today().replaceAll("-", "")) + hash(store.id + salt));
const round100 = (n: number) => Math.round(n / 100) * 100;

export function demoCardSales(store: Store): CardSales {
  const rand = rng(store);
  const days = Array.from({ length: 14 }, (_, i) => {
    // 웨딩홀은 주말에 몰린다
    const date = ymd(daysAgo(13 - i));
    const wd = new Date(`${date}T00:00:00Z`).getUTCDay();
    const weekend = wd === 0 || wd === 6;
    const base = store.pos === "none" ? (weekend ? 2_400_000 : 150_000) : 300_000 + rand() * 900_000;
    const amount = round100(base * store.scale * (store.pos === "none" ? 0.6 + rand() * 0.8 : 1));
    return { date, amount, deposit: Math.round(amount * 0.978) };
  });
  const t = days[days.length - 1].amount;
  const y = days[days.length - 2].amount;
  const month = today().slice(0, 7);
  const monthTotal = days.filter((d) => d.date.startsWith(month)).reduce((a, d) => a + d.amount, 0);
  const upcomingDeposit = [1, 2, 3].map((n) => ({
    date: ymd(new Date(Date.now() + n * 86400_000)),
    amount: days[days.length - 1 - n].deposit,
  }));
  const shares: [string, number][] = [
    ["신한카드", 0.24], ["KB국민카드", 0.19], ["삼성카드", 0.16], ["현대카드", 0.13],
    ["BC카드", 0.1], ["롯데카드", 0.08], ["하나카드", 0.06], ["NH농협카드", 0.04],
  ];
  const byCard = shares.map(([name, r]) => ({ name, amount: round100(monthTotal * r) }));
  return { today: t, yesterday: y, monthTotal, upcomingDeposit, days, byCard };
}

export function demoPos(store: Store): PosSummary {
  const rand = rng(store, "pos");
  const hours = store.category.includes("베이커리") ? [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] : [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
  const hourly = hours.map((hour) => {
    const peak = [12, 13, 18, 19].includes(hour) ? 2.5 : 1;
    return { hour, orders: Math.round((2 + rand() * 4) * peak * store.scale) };
  });
  const todayOrders = hourly.reduce((a, h) => a + h.orders, 0);
  const avgTicket = round100((store.category.includes("베이커리") ? 9_000 : 19_000) * (0.85 + rand() * 0.3));
  const topItems = store.sampleMenu
    .map((name, i) => ({ name, qty: Math.max(1, Math.round((todayOrders * (0.7 - i * 0.1)) * (0.8 + rand() * 0.4))) }))
    .sort((a, b) => b.qty - a.qty);
  const total = todayOrders * avgTicket;
  const payments = [
    { method: "카드", amount: round100(total * 0.82) },
    { method: "간편결제", amount: round100(total * 0.12) },
    { method: "현금", amount: round100(total * 0.06) },
  ];
  return { todayOrders, avgTicket, topItems, hourly, payments };
}

// 세금·계좌는 법인 단위
export function demoBank(): BankTx[] {
  return [
    { date: ymd(daysAgo(0)), description: "카드사 정산 입금 (석갈비)", amount: 812_400 },
    { date: ymd(daysAgo(0)), description: "카드사 정산 입금 (쌈앤샤브)", amount: 612_400 },
    { date: ymd(daysAgo(0)), description: "식자재 결제 (한우유통)", amount: -1_284_000 },
    { date: ymd(daysAgo(1)), description: "웨딩하우스 예약금", amount: 3_000_000 },
    { date: ymd(daysAgo(1)), description: "배달앱 정산 입금", amount: 198_700 },
    { date: ymd(daysAgo(1)), description: "급여 이체", amount: -8_450_000 },
    { date: ymd(daysAgo(2)), description: "카드사 정산 입금 (모멘토베이크)", amount: 341_900 },
    { date: ymd(daysAgo(2)), description: "가스요금", amount: -632_500 },
    { date: ymd(daysAgo(3)), description: "카드사 정산 입금 (도시곳간)", amount: 455_300 },
    { date: ymd(daysAgo(3)), description: "임대료", amount: -6_600_000 },
  ];
}

export function demoTax(): TaxSummary {
  return {
    salesInvoiceTotal: 18_250_000,
    purchaseInvoiceTotal: 46_840_000,
    cashReceiptTotal: 7_310_000,
    estimatedVat: 9_820_000,
    nextDeadline: { label: "부가세 확정신고", date: `${new Date().getFullYear() + 1}-01-25` },
    invoices: [
      { date: ymd(daysAgo(1)), kind: "매입", partner: "(주)한우유통", amount: 4_870_000 },
      { date: ymd(daysAgo(2)), kind: "매출", partner: "웨딩 예식 (김○○님)", amount: 12_400_000 },
      { date: ymd(daysAgo(3)), kind: "매입", partner: "진접청과", amount: 1_640_000 },
      { date: ymd(daysAgo(4)), kind: "매출", partner: "남양주시청 (단체 회식)", amount: 850_000 },
      { date: ymd(daysAgo(5)), kind: "매입", partner: "제과원료상사", amount: 980_000 },
      { date: ymd(daysAgo(6)), kind: "매입", partner: "도시가스", amount: 1_412_000 },
      { date: ymd(daysAgo(8)), kind: "현금영수증", partner: "개인 고객 61건", amount: 3_010_000 },
      { date: ymd(daysAgo(11)), kind: "매출", partner: "진접초 학부모회", amount: 400_000 },
      { date: ymd(daysAgo(13)), kind: "매입", partner: "(주)한우유통", amount: 5_150_000 },
    ],
  };
}

export function demoRanks(store: Store): KeywordRank[] {
  const rand = rng(store, "rank");
  const fillers = ["진접 맛집촌", "남양주 명가", "오남 식당", "장현 키친", "진접 본점", "해밀 맛집"];
  return store.keywords.map((keyword, i) => {
    const pos = Math.floor(rand() * 7); // 0~6, 5 이상이면 순위 밖
    const others = fillers.slice(i).concat(fillers.slice(0, i));
    const list = others.slice(0, 5);
    if (pos < 5) list.splice(pos, 1, store.name);
    return {
      store: store.name,
      keyword,
      rank: pos < 5 ? pos + 1 : null,
      topStore: list[0],
      stores: list,
      monthlySearches: Math.round((500 + rand() * 9_000) / 10) * 10,
    };
  });
}

export function demoOpenings(store: Store): NewBusiness[] {
  const term = store.competitorTerms[0] ?? "식당";
  return [
    { nearStore: store.name, name: `${term}마을 진접점`, category: "일반음식점", address: `${store.region} 해밀예당1로`, openedOn: ymd(daysAgo(3 + (hash(store.id) % 5))), competitor: true },
    { nearStore: store.name, name: "카페 온새미로", category: "휴게음식점", address: `${store.region} 금강로`, openedOn: ymd(daysAgo(9)), competitor: store.competitorTerms.includes("카페") },
    { nearStore: store.name, name: "진접 돈까스", category: "일반음식점", address: `${store.region} 장현로`, openedOn: ymd(daysAgo(17)), competitor: false },
  ];
}

const REVIEW_TEXTS: [number, string][] = [
  [5, "음식이 정갈하고 직원분들이 친절해요."],
  [5, "가족 모임하기 좋아요. 주차도 편해요."],
  [4, "맛있었는데 주말엔 대기가 좀 있어요."],
  [5, "재방문 의사 100%"],
  [3, "음식은 괜찮은데 응대가 조금 아쉬웠어요."],
  [5, "아이랑 가기 좋아요"],
  [2, "예약했는데 자리가 준비가 안 되어 있었어요."],
  [5, "가성비 최고입니다"],
];

export function demoReviews(store: Store): ReviewSummary {
  const rand = rng(store, "review");
  const sources = store.pos === "none" ? ["네이버", "구글"] : ["네이버", "구글", "배달의민족"];
  // 매장마다 다른 리뷰가 먼저 보이도록 순서를 돌린다
  const offset = hash(store.id) % REVIEW_TEXTS.length;
  const texts = [...REVIEW_TEXTS.slice(offset), ...REVIEW_TEXTS.slice(0, offset)];
  const recent = texts.map(([rating, text], i) => ({
    store: store.name,
    source: sources[Math.floor(rand() * sources.length)],
    author: ["진접주민", "J. Kim", "오남동주부", "맛집탐방러", "Minji P.", "진접직장인", "남양주아빠", "단골손님"][i],
    rating,
    text,
    date: ymd(daysAgo(i * 2 + Math.floor(rand() * 2))),
  }));
  const monthCount = Math.round((20 + rand() * 40) * Math.min(store.scale, 1.5));
  return {
    monthCount,
    lastMonthCount: Math.round(monthCount * (0.8 + rand() * 0.4)),
    totalCount: Math.round(monthCount * (18 + rand() * 20)),
    averageRating: Math.round((4.3 + rand() * 0.6) * 10) / 10,
    recent,
  };
}

export function demoSns(store: Store): SnsSummary {
  const rand = rng(store, "sns");
  return {
    yesterdayMentions: Math.floor(rand() * 4),
    recent: [
      { store: store.name, caption: `${store.name} 다녀왔어요 😋 #${store.hashtags[0] ?? ""}`, url: "https://www.instagram.com/", date: ymd(daysAgo(1)) },
      { store: store.name, caption: `오늘은 ${store.name}에서 ${store.sampleMenu[0] ?? "행사"} 🙌`, url: "https://www.instagram.com/", date: ymd(daysAgo(3)) },
    ],
    relatedTags: [...store.hashtags.slice(1), "진접맛집", "남양주맛집", "오남맛집"],
  };
}
