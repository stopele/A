// 매출·입금, 포스, 계좌, 세금 데이터.
// CODEF·포스사 연동 전까지는 샘플 데이터를 보여주고, 어떤 설정이 필요한지 안내한다.
import { POS_LABEL, type Store } from "../config";
import { demoBank, demoCardSales, demoDailyAmount, demoPos, demoTax } from "../demo";
import type { BankTx, CardSales, PosSummary, SourceResult, TaxSummary } from "../types";
import { codefConfigured } from "./codef";

const CODEF_NOTE = codefConfigured()
  ? "CODEF 키가 설정되어 있습니다. 상품별 응답 필드 연결 작업이 남아 있습니다."
  : "CODEF 가입 후 CODEF_CLIENT_ID / CODEF_CLIENT_SECRET / CODEF_CONNECTED_ID 를 설정하세요.";

const POS_NOTE: Record<Store["pos"], string> = {
  okpos: "오케이포스 연동은 OKPOS 오픈API 제휴 신청이 필요합니다.",
  tosspos: "토스포스 연동은 토스플레이스 개발자 API 신청이 필요합니다.",
  none: "포스를 쓰지 않는 매장입니다. 웨딩·연회 매출은 '행사 매출' 메뉴에서 행사별로 입력합니다.",
};

export async function getCardSales(store: Store): Promise<SourceResult<CardSales>> {
  return { mode: "demo", data: demoCardSales(store), note: `여신금융협회 카드매출 · ${CODEF_NOTE}` };
}

export async function getPos(store: Store): Promise<SourceResult<PosSummary | null>> {
  if (store.pos === "none") return { mode: "none", data: null, note: POS_NOTE.none };
  return { mode: "demo", data: demoPos(store), note: `${POS_LABEL[store.pos]} · ${POS_NOTE[store.pos]}` };
}

// 계좌·세금은 법인 단위
export async function getBank(): Promise<SourceResult<BankTx[]>> {
  return { mode: "demo", data: demoBank(), note: `법인 계좌 · ${CODEF_NOTE}` };
}

export async function getTax(): Promise<SourceResult<TaxSummary>> {
  return { mode: "demo", data: demoTax(), note: `홈택스 (법인) · ${CODEF_NOTE}` };
}

// 기간별 일 매출 (캘린더·손익용)
export async function getDailySales(store: Store, from: string, to: string): Promise<SourceResult<{ date: string; amount: number }[]>> {
  const days: { date: string; amount: number }[] = [];
  for (let d = new Date(`${from}T00:00:00Z`); d.toISOString().slice(0, 10) <= to; d.setUTCDate(d.getUTCDate() + 1)) {
    const date = d.toISOString().slice(0, 10);
    days.push({ date, amount: demoDailyAmount(store, date) });
  }
  return { mode: "demo", data: days, note: `여신금융협회 카드매출 · ${CODEF_NOTE}` };
}
