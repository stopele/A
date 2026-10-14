// 화면 범위: 법인 전체("all") 또는 매장 하나. 전체일 때는 매장별 데이터를 합친다.
import { company, findStore, stores, type Store } from "./config";
import { getEvents } from "./sources/events";
import { getCardSales, getPos } from "./sources/finance";
import { getSns } from "./sources/instagram";
import { getKeywordRanks } from "./sources/naver";
import { getReviews } from "./sources/reviews";
import type { CardSales, KeywordRank, Mode, PosSummary, ReviewSummary, SnsSummary, SourceResult } from "./types";

export interface Scope {
  id: string;
  label: string;
  isAll: boolean;
  stores: Store[];
}

export const ALL = "all";

export function resolveScope(id: string): Scope | null {
  if (id === ALL) return { id, label: company.name, isAll: true, stores };
  const store = findStore(id);
  return store ? { id, label: store.name, isAll: false, stores: [store] } : null;
}

export interface PerStore<T> extends SourceResult<T> {
  store: Store;
}

async function each<T>(scope: Scope, fn: (s: Store) => Promise<SourceResult<T>>): Promise<PerStore<T>[]> {
  return Promise.all(scope.stores.map(async (store) => ({ store, ...(await fn(store)) })));
}

function combineMode(modes: Mode[]): Mode {
  const used = modes.filter((m) => m !== "none");
  if (used.length === 0) return "none";
  if (used.includes("error")) return "error";
  return used.every((m) => m === "live") ? "live" : "demo";
}

function combineNote(rows: { note?: string }[]): string | undefined {
  const notes = [...new Set(rows.map((r) => r.note).filter(Boolean))];
  return notes.length ? notes.join(" / ") : undefined;
}

function sumBy<T>(rows: T[], key: (r: T) => string, value: (r: T) => number) {
  const map = new Map<string, number>();
  for (const r of rows) map.set(key(r), (map.get(key(r)) ?? 0) + value(r));
  return map;
}

export async function loadSales(scope: Scope) {
  const perStore = await each(scope, getCardSales);
  const all = perStore.map((p) => p.data);
  const days = [...sumBy(all.flatMap((d) => d.days), (d) => d.date, (d) => d.amount)].map(([date, amount]) => ({
    date,
    amount,
    deposit: all.flatMap((d) => d.days).filter((d) => d.date === date).reduce((a, d) => a + d.deposit, 0),
  })).sort((a, b) => a.date.localeCompare(b.date));
  const data: CardSales = {
    today: all.reduce((a, d) => a + d.today, 0),
    yesterday: all.reduce((a, d) => a + d.yesterday, 0),
    monthTotal: all.reduce((a, d) => a + d.monthTotal, 0),
    upcomingDeposit: [...sumBy(all.flatMap((d) => d.upcomingDeposit), (u) => u.date, (u) => u.amount)]
      .map(([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date)),
    days,
    byCard: [...sumBy(all.flatMap((d) => d.byCard), (c) => c.name, (c) => c.amount)]
      .map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount),
  };
  return { mode: combineMode(perStore.map((p) => p.mode)), note: combineNote(perStore), data, perStore };
}

export async function loadPos(scope: Scope) {
  const perStore = await each(scope, getPos);
  const withPos = perStore.flatMap((p) => (p.data ? [p.data] : []));
  let data: PosSummary | null = null;
  if (withPos.length) {
    const orders = withPos.reduce((a, p) => a + p.todayOrders, 0);
    const revenue = withPos.reduce((a, p) => a + p.todayOrders * p.avgTicket, 0);
    data = {
      todayOrders: orders,
      avgTicket: orders ? Math.round(revenue / orders / 100) * 100 : 0,
      topItems: scope.isAll
        // 전체 보기에서는 메뉴 앞에 매장명을 붙인다
        ? perStore.flatMap((p) => (p.data?.topItems ?? []).map((i) => ({ name: `${p.store.name} · ${i.name}`, qty: i.qty })))
          .sort((a, b) => b.qty - a.qty)
        : withPos[0].topItems,
      hourly: [...sumBy(withPos.flatMap((p) => p.hourly), (h) => String(h.hour), (h) => h.orders)]
        .map(([hour, o]) => ({ hour: Number(hour), orders: o })).sort((a, b) => a.hour - b.hour),
      payments: [...sumBy(withPos.flatMap((p) => p.payments), (x) => x.method, (x) => x.amount)]
        .map(([method, amount]) => ({ method, amount })),
    };
  }
  return { mode: combineMode(perStore.map((p) => p.mode)), note: combineNote(perStore), data, perStore };
}

export async function loadRanks(scope: Scope): Promise<SourceResult<KeywordRank[]> & { perStore: PerStore<KeywordRank[]>[] }> {
  const perStore = await each(scope, getKeywordRanks);
  return { mode: combineMode(perStore.map((p) => p.mode)), note: combineNote(perStore), data: perStore.flatMap((p) => p.data), perStore };
}

export async function loadReviews(scope: Scope) {
  const perStore = await each(scope, getReviews);
  const all = perStore.map((p) => p.data);
  const nullableSum = (vals: (number | null)[]) => (vals.some((v) => v === null) ? null : vals.reduce<number>((a, v) => a + (v ?? 0), 0));
  const rated = all.filter((r) => r.averageRating !== null && r.totalCount);
  const weight = rated.reduce((a, r) => a + (r.totalCount ?? 0), 0);
  const data: ReviewSummary = {
    monthCount: nullableSum(all.map((r) => r.monthCount)),
    lastMonthCount: nullableSum(all.map((r) => r.lastMonthCount)),
    totalCount: nullableSum(all.map((r) => r.totalCount)),
    averageRating: weight
      ? Math.round((rated.reduce((a, r) => a + (r.averageRating ?? 0) * (r.totalCount ?? 0), 0) / weight) * 10) / 10
      : all[0]?.averageRating ?? null,
    recent: all.flatMap((r) => r.recent).sort((a, b) => b.date.localeCompare(a.date)),
  };
  return { mode: combineMode(perStore.map((p) => p.mode)), note: combineNote(perStore), data, perStore };
}

export async function loadSns(scope: Scope) {
  const perStore = await each(scope, getSns);
  const data: SnsSummary = {
    yesterdayMentions: perStore.reduce((a, p) => a + p.data.yesterdayMentions, 0),
    recent: perStore.flatMap((p) => p.data.recent).sort((a, b) => b.date.localeCompare(a.date)),
    relatedTags: [...new Set(perStore.flatMap((p) => p.data.relatedTags))].slice(0, 12),
  };
  return { mode: combineMode(perStore.map((p) => p.mode)), note: combineNote(perStore), data, perStore };
}

// 행사 매장만. 이번 달 행사와 다가오는 예약을 요약한다.
export async function loadEvents(scope: Scope) {
  const eventStores = scope.stores.filter((s) => s.eventSales);
  if (!eventStores.length) return null;
  const perStore = await Promise.all(eventStores.map(async (store) => ({ store, ...(await getEvents(store)) })));
  return { mode: combineMode(perStore.map((p) => p.mode)), note: combineNote(perStore), perStore };
}
