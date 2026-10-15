// 비용(지출) 관리. 직접 입력하거나 이카운트 등에서 내려받은 엑셀을 가져온다.
export const HQ = "hq"; // 본사·공통 비용
export const HQ_LABEL = "본사·공통";

export const EXPENSE_CATEGORIES = [
  "식자재", "인건비", "임대료", "공과금", "수수료", "소모품", "광고·마케팅", "수선·유지", "세금·보험", "기타",
] as const;

export const PAY_METHODS = ["카드", "계좌이체", "현금", "기타"] as const;

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  store: string; // 매장 id 또는 HQ
  category: string;
  vendor: string; // 거래처·내용
  amount: number;
  method: string;
  memo: string;
  source: "manual" | "import";
}

// 계정명·적요로 분류 추정 (엑셀 가져오기용)
const RULES: [string, string[]][] = [
  ["식자재", ["식자재", "원재료", "재료", "식품", "육류", "정육", "청과", "농산", "수산", "주류", "음료", "매입"]],
  ["인건비", ["급여", "임금", "상여", "퇴직", "복리", "4대", "국민연금", "건강보험", "고용보험", "아르바이트", "알바"]],
  ["임대료", ["임차", "임대", "월세", "관리비"]],
  ["공과금", ["전기", "가스", "수도", "통신", "인터넷", "전화", "수도광열"]],
  ["수수료", ["수수료", "카드", "배달", "pg", "결제"]],
  ["소모품", ["소모품", "비품", "포장", "용기", "세제"]],
  ["광고·마케팅", ["광고", "홍보", "마케팅", "판촉", "인쇄"]],
  ["수선·유지", ["수선", "수리", "유지", "보수", "청소", "방역"]],
  ["세금·보험", ["세금", "공과", "보험", "부가세", "지방세", "재산세"]],
];

export function guessCategory(text: string): string {
  const t = text.toLowerCase();
  return RULES.find(([, words]) => words.some((w) => t.includes(w)))?.[0] ?? "기타";
}

export function expenseKey(e: Pick<Expense, "date" | "amount" | "vendor">) {
  return `${e.date}|${e.amount}|${e.vendor.replace(/\s/g, "")}`;
}

export function sumByCategory(list: Expense[]) {
  const map = new Map<string, number>();
  for (const e of list) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  return [...map.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
}
