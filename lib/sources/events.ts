// 행사 매출 데이터 읽기·쓰기. 아직 저장된 행사가 없으면 샘플을 보여준다.
import type { Store } from "../config";
import { ymd } from "../demo";
import { DEFAULT_PRICES, templateLines, type EventRecord, type PriceList } from "../events";
import { readJson, storageKind, writeJson } from "../storage";
import type { SourceResult } from "../types";

const eventsKey = (store: Store) => `events-${store.id}`;
const pricesKey = (store: Store) => `prices-${store.id}`;

function storageNote(): string | undefined {
  return storageKind() === "none"
    ? "저장소가 연결되지 않아 입력할 수 없습니다. Vercel → Storage → Blob 을 이 프로젝트에 연결하세요."
    : undefined;
}

export async function getPrices(store: Store): Promise<PriceList> {
  return (await readJson<PriceList>(pricesKey(store)).catch(() => null)) ?? DEFAULT_PRICES;
}

export async function savePrices(store: Store, prices: PriceList) {
  await writeJson(pricesKey(store), prices);
}

export async function getEvents(store: Store): Promise<SourceResult<EventRecord[]>> {
  try {
    const saved = await readJson<EventRecord[]>(eventsKey(store));
    if (saved) {
      return { mode: "live", data: saved.sort((a, b) => b.date.localeCompare(a.date)), note: storageNote() };
    }
  } catch (err) {
    return { mode: "error", data: demoEvents(), note: `저장소 오류: ${err instanceof Error ? err.message : String(err)}` };
  }
  return {
    mode: "demo",
    data: demoEvents(),
    note: storageNote() ?? "샘플 행사입니다. 첫 행사를 등록하면 샘플은 사라지고 입력한 행사만 보입니다.",
  };
}

async function savedEvents(store: Store): Promise<EventRecord[]> {
  return (await readJson<EventRecord[]>(eventsKey(store))) ?? [];
}

export async function upsertEvent(store: Store, event: EventRecord) {
  const list = (await savedEvents(store)).filter((e) => e.id !== event.id);
  await writeJson(eventsKey(store), [...list, event]);
}

export async function deleteEvent(store: Store, id: string) {
  await writeJson(eventsKey(store), (await savedEvents(store)).filter((e) => e.id !== id));
}

function demoEvents(): EventRecord[] {
  const day = (offset: number) => ymd(new Date(Date.now() + offset * 86400_000));
  const fill = (type: "wedding" | "banquet", qty: Record<string, number>) =>
    templateLines(DEFAULT_PRICES, type).map((l) => ({ ...l, qty: qty[l.name] ?? 0 }));
  return [
    {
      id: "demo-1", date: day(-12), type: "wedding", title: "김○○ · 이○○ 결혼식", customer: "김○○", status: "완료", deposit: 1_000_000, memo: "",
      lines: fill("wedding", { "대관 비용": 1, "예식비 - 사진 촬영": 1, "예식비 - 웨딩드레스": 1, "예식비 - 기타": 1, "성인 뷔페 식사": 220, "소인 뷔페 식사": 18, "음료 (사이다·콜라)": 120 }),
    },
    {
      id: "demo-2", date: day(-9), type: "banquet", title: "박○○ 돌잔치", customer: "박○○", status: "완료", deposit: 300_000, memo: "",
      lines: fill("banquet", { "성인 뷔페 식사": 48, "소인 뷔페 식사": 12, "음료 (사이다·콜라)": 40, "사진 촬영": 1, "비디오 촬영": 1, "현수막": 1, "케이크": 1 }),
    },
    {
      id: "demo-3", date: day(-6), type: "banquet", title: "최○○님 칠순 잔치", customer: "최○○", status: "완료", deposit: 300_000, memo: "",
      lines: fill("banquet", { "성인 뷔페 식사": 85, "소인 뷔페 식사": 9, "음료 (사이다·콜라)": 60, "사진 촬영": 1, "현수막": 1, "케이크": 1, "샴페인": 4 }),
    },
    {
      id: "demo-4", date: day(-5), type: "wedding", title: "정○○ · 한○○ 결혼식", customer: "정○○", status: "완료", deposit: 1_000_000, memo: "",
      lines: fill("wedding", { "대관 비용": 1, "예식비 - 사진 촬영": 1, "예식비 - 웨딩드레스": 1, "성인 뷔페 식사": 180, "소인 뷔페 식사": 14, "음료 (사이다·콜라)": 90 }),
    },
    {
      id: "demo-5", date: day(-2), type: "banquet", title: "진접농협 단체 회식", customer: "진접농협", status: "완료", deposit: 0, memo: "",
      lines: fill("banquet", { "성인 뷔페 식사": 62, "음료 (사이다·콜라)": 30, "기타 비용": 1 }),
    },
    {
      id: "demo-6", date: day(3), type: "banquet", title: "윤○○ 돌잔치", customer: "윤○○", status: "예약", deposit: 300_000, memo: "케이크 레터링: 윤하 첫돌",
      lines: fill("banquet", { "성인 뷔페 식사": 40, "소인 뷔페 식사": 10, "사진 촬영": 1, "현수막": 1, "케이크": 1 }),
    },
    {
      id: "demo-7", date: day(9), type: "wedding", title: "오○○ · 서○○ 결혼식", customer: "오○○", status: "예약", deposit: 1_000_000, memo: "",
      lines: fill("wedding", { "대관 비용": 1, "예식비 - 사진 촬영": 1, "예식비 - 웨딩드레스": 1, "예식비 - 기타": 1, "성인 뷔페 식사": 250, "소인 뷔페 식사": 20 }),
    },
    {
      id: "demo-8", date: day(-20), type: "banquet", title: "이○○님 회갑연", customer: "이○○", status: "취소", deposit: 0, memo: "일정 변경으로 취소",
      lines: fill("banquet", { "성인 뷔페 식사": 50 }),
    },
  ];
}
