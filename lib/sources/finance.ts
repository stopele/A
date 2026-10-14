// 매출·입금, 계좌, 세금, 포스 데이터.
// CODEF 계약 전까지는 샘플 데이터를 보여주고, 어떤 설정이 필요한지 안내한다.
import { codefConfigured } from "./codef";
import { demoBank, demoCardSales, demoPos, demoTax } from "../demo";
import type { BankTx, CardSales, PosSummary, SourceResult, TaxSummary } from "../types";

const CODEF_NOTE = codefConfigured()
  ? "CODEF 키가 설정되어 있습니다. 상품별 응답 필드 연결 작업이 남아 있습니다."
  : "CODEF 가입 후 CODEF_CLIENT_ID / CODEF_CLIENT_SECRET / CODEF_CONNECTED_ID 를 설정하세요.";

export async function getCardSales(): Promise<SourceResult<CardSales>> {
  return { mode: "demo", data: demoCardSales(), note: `여신금융협회 카드매출 · ${CODEF_NOTE}` };
}

export async function getBank(): Promise<SourceResult<BankTx[]>> {
  return { mode: "demo", data: demoBank(), note: `계좌 입출금 · ${CODEF_NOTE}` };
}

export async function getTax(): Promise<SourceResult<TaxSummary>> {
  return { mode: "demo", data: demoTax(), note: `홈택스 · ${CODEF_NOTE}` };
}

export async function getPos(): Promise<SourceResult<PosSummary>> {
  return {
    mode: "demo",
    data: demoPos(),
    note: "포스 연동은 사용 중인 포스사(토스플레이스·OKPOS·포스뱅크 등)의 API에 따라 달라집니다.",
  };
}
