// 웨딩·연회 행사 매출. 포스가 없는 매장은 행사별 항목(식사·촬영·대관 등)을 직접 입력한다.
export type EventType = "wedding" | "banquet";
export type EventStatus = "예약" | "완료" | "취소";

export const EVENT_TYPE_LABEL: Record<EventType, string> = { wedding: "웨딩", banquet: "연회" };

export interface PriceItem {
  name: string;
  category: string; // 대관 · 예식 · 식사 · 음료 · 촬영 · 부대 · 기타
  unit: string; // 인 · 건 · 개 · 병
  price: number;
}

export type PriceList = Record<EventType, PriceItem[]>;

export interface EventLine {
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
  qty: number;
}

export interface EventRecord {
  id: string;
  date: string; // YYYY-MM-DD
  type: EventType;
  title: string; // 예: 김○○·이○○ 결혼식, 박○○ 돌잔치
  customer: string;
  status: EventStatus;
  deposit: number; // 받은 계약금
  memo: string;
  lines: EventLine[];
}

// 예시 단가. 단가표 화면에서 실제 가격으로 바꿔 저장한다.
export const DEFAULT_PRICES: PriceList = {
  banquet: [
    { name: "성인 뷔페 식사", category: "식사", unit: "인", price: 35_000 },
    { name: "소인 뷔페 식사", category: "식사", unit: "인", price: 20_000 },
    { name: "음료 (사이다·콜라)", category: "음료", unit: "병", price: 2_000 },
    { name: "사진 촬영", category: "촬영", unit: "건", price: 300_000 },
    { name: "비디오 촬영", category: "촬영", unit: "건", price: 400_000 },
    { name: "현수막", category: "부대", unit: "개", price: 50_000 },
    { name: "케이크", category: "부대", unit: "개", price: 80_000 },
    { name: "샴페인", category: "부대", unit: "병", price: 30_000 },
    { name: "기타 비용", category: "기타", unit: "건", price: 0 },
  ],
  wedding: [
    { name: "대관 비용", category: "대관", unit: "건", price: 2_000_000 },
    { name: "예식비 - 사진 촬영", category: "예식", unit: "건", price: 800_000 },
    { name: "예식비 - 웨딩드레스", category: "예식", unit: "건", price: 1_000_000 },
    { name: "예식비 - 기타", category: "예식", unit: "건", price: 300_000 },
    { name: "성인 뷔페 식사", category: "식사", unit: "인", price: 45_000 },
    { name: "소인 뷔페 식사", category: "식사", unit: "인", price: 25_000 },
    { name: "음료 (사이다·콜라)", category: "음료", unit: "병", price: 2_000 },
    { name: "기타 비용", category: "기타", unit: "건", price: 0 },
  ],
};

export const lineTotal = (l: EventLine) => l.unitPrice * l.qty;
export const eventTotal = (e: EventRecord) => e.lines.reduce((a, l) => a + lineTotal(l), 0);

// 식사 항목의 '인' 수량 = 하객 수
export function guests(e: EventRecord) {
  const meal = (word: string) =>
    e.lines.filter((l) => l.category === "식사" && l.unit === "인" && l.name.includes(word)).reduce((a, l) => a + l.qty, 0);
  return { adult: meal("성인"), child: meal("소인") };
}

export function templateLines(prices: PriceList, type: EventType): EventLine[] {
  return prices[type].map((p) => ({ name: p.name, category: p.category, unit: p.unit, unitPrice: p.price, qty: 0 }));
}

function sumBy(rows: { key: string; amount: number; qty?: number }[]) {
  const map = new Map<string, { amount: number; qty: number }>();
  for (const r of rows) {
    const prev = map.get(r.key) ?? { amount: 0, qty: 0 };
    map.set(r.key, { amount: prev.amount + r.amount, qty: prev.qty + (r.qty ?? 0) });
  }
  return [...map.entries()].map(([key, v]) => ({ key, ...v })).sort((a, b) => b.amount - a.amount);
}

// 취소 건은 제외하고 집계
export function eventStats(events: EventRecord[]) {
  const live = events.filter((e) => e.status !== "취소");
  const lines = live.flatMap((e) => e.lines.filter((l) => l.qty > 0));
  return {
    count: live.length,
    total: live.reduce((a, e) => a + eventTotal(e), 0),
    confirmed: live.filter((e) => e.status === "완료").reduce((a, e) => a + eventTotal(e), 0),
    reserved: live.filter((e) => e.status === "예약").reduce((a, e) => a + eventTotal(e), 0),
    deposits: live.filter((e) => e.status === "예약").reduce((a, e) => a + e.deposit, 0),
    guests: live.reduce((a, e) => { const g = guests(e); return a + g.adult + g.child; }, 0),
    byCategory: sumBy(lines.map((l) => ({ key: l.category, amount: lineTotal(l) }))),
    byItem: sumBy(lines.map((l) => ({ key: l.name, amount: lineTotal(l), qty: l.qty }))),
    byType: sumBy(live.map((e) => ({ key: EVENT_TYPE_LABEL[e.type], amount: eventTotal(e), qty: 1 }))),
  };
}
