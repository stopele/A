export type Mode = "live" | "demo" | "error";

export interface SourceResult<T> {
  mode: Mode;
  data: T;
  // 실연동에 필요한 설정 안내 또는 오류 메시지
  note?: string;
}

export interface DailySales {
  date: string; // YYYY-MM-DD
  amount: number; // 승인 매출
  deposit: number; // 입금(예정) 금액
}

export interface CardSales {
  today: number;
  yesterday: number;
  monthTotal: number;
  upcomingDeposit: { date: string; amount: number }[];
  days: DailySales[];
  byCard: { name: string; amount: number }[]; // 이번 달 카드사별 매출
}

export interface BankTx {
  date: string;
  description: string;
  amount: number; // 입금 +, 출금 -
}

export interface TaxSummary {
  salesInvoiceTotal: number; // 매출 세금계산서
  purchaseInvoiceTotal: number; // 매입 세금계산서
  cashReceiptTotal: number; // 현금영수증 매출
  estimatedVat: number;
  nextDeadline: { label: string; date: string };
  invoices: { date: string; kind: "매출" | "매입" | "현금영수증"; partner: string; amount: number }[];
}

export interface PosSummary {
  todayOrders: number;
  avgTicket: number;
  topItems: { name: string; qty: number }[];
  hourly: { hour: number; orders: number }[];
  payments: { method: string; amount: number }[];
}

export interface KeywordRank {
  keyword: string;
  rank: number | null; // null = 노출 범위 밖
  topStore: string | null;
  stores: string[]; // 검색 결과 상위 매장 (순서대로)
  monthlySearches: number | null;
}

export interface NewBusiness {
  name: string;
  category: string;
  address: string;
  openedOn: string;
  competitor: boolean;
}

export interface Review {
  source: string;
  author: string;
  rating: number | null;
  text: string;
  date: string;
}

export interface ReviewSummary {
  monthCount: number | null; // 이번 달 신규 리뷰 (원천에서 알 수 없으면 null)
  lastMonthCount: number | null;
  totalCount: number | null;
  averageRating: number | null;
  recent: Review[];
}

export interface SnsPost {
  caption: string;
  url: string;
  date: string;
}

export interface SnsSummary {
  yesterdayMentions: number;
  recent: SnsPost[];
  relatedTags: string[];
}
