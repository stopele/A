// 월 단위 집계: 일별 매출(카드매출 + 행사 매출), 행사 일정, 비용, 손익.
import { ymd } from "./demo";
import { eventTotal, type EventRecord } from "./events";
import { HQ, type Expense } from "./expenses";
import type { Scope } from "./scope";
import { getEvents } from "./sources/events";
import { getExpenses } from "./sources/expenses";
import { getDailySales } from "./sources/finance";
import type { Mode } from "./types";

export function monthRange(month: string) {
  const start = `${month}-01`;
  const d = new Date(`${start}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0);
  return { start, end: d.toISOString().slice(0, 10), days: d.getUTCDate() };
}

export function shiftMonth(month: string, delta: number) {
  const d = new Date(`${month}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + delta);
  return d.toISOString().slice(0, 7);
}

export function parseMonth(v: string | undefined): string {
  return v && /^\d{4}-\d{2}$/.test(v) ? v : ymd(new Date()).slice(0, 7);
}

export interface DayCell {
  date: string;
  total: number; // 오늘까지의 확정 매출
  perStore: Record<string, number>;
  events: (EventRecord & { storeId: string })[];
  expense: number;
}

export async function loadMonth(scope: Scope, month: string) {
  const { start, end } = monthRange(month);
  const today = ymd(new Date());
  const until = end < today ? end : today;
  const ids = new Set(scope.stores.map((s) => s.id));

  const [sales, events, expenses] = await Promise.all([
    Promise.all(scope.stores.filter((s) => !s.eventSales).map(async (s) => ({ store: s, ...(until >= start ? await getDailySales(s, start, until) : { mode: "demo" as Mode, data: [], note: undefined }) }))),
    Promise.all(scope.stores.filter((s) => s.eventSales).map(async (s) => ({ store: s, ...(await getEvents(s)) }))),
    getExpenses(),
  ]);

  const monthEvents = events.flatMap((e) =>
    e.data.filter((ev) => ev.date >= start && ev.date <= end && ev.status !== "취소").map((ev) => ({ ...ev, storeId: e.store.id })),
  );
  // 전체 화면은 본사 비용 포함, 매장 화면은 그 매장 비용만
  const monthExpenses: Expense[] = expenses.data.filter(
    (x) => x.date >= start && x.date <= end && (ids.has(x.store) || (scope.isAll && x.store === HQ)),
  );

  const cells: DayCell[] = [];
  const { days } = monthRange(month);
  for (let i = 1; i <= days; i++) {
    const date = `${month}-${String(i).padStart(2, "0")}`;
    const perStore: Record<string, number> = {};
    for (const s of sales) {
      const amt = s.data.find((d) => d.date === date)?.amount;
      if (amt) perStore[s.store.id] = amt;
    }
    const dayEvents = monthEvents.filter((e) => e.date === date);
    // 행사 매장은 행사 매출을 매출로 본다 (오늘까지)
    for (const e of dayEvents) {
      if (date <= today) perStore[e.storeId] = (perStore[e.storeId] ?? 0) + eventTotal(e);
    }
    cells.push({
      date,
      total: Object.values(perStore).reduce((a, v) => a + v, 0),
      perStore,
      events: dayEvents,
      expense: monthExpenses.filter((x) => x.date === date).reduce((a, x) => a + x.amount, 0),
    });
  }

  const revenue = cells.reduce((a, c) => a + c.total, 0);
  const expenseTotal = monthExpenses.reduce((a, x) => a + x.amount, 0);
  const reserved = monthEvents.filter((e) => e.date > today).reduce((a, e) => a + eventTotal(e), 0);
  const modes = [...sales.map((s) => s.mode), ...events.map((e) => e.mode)];
  return {
    month,
    cells,
    revenue,
    reserved,
    expenses: monthExpenses,
    expenseTotal,
    expenseMode: expenses.mode,
    expenseNote: expenses.note,
    profit: revenue - expenseTotal,
    salesMode: (modes.includes("error") ? "error" : modes.every((m) => m === "live") ? "live" : "demo") as Mode,
  };
}
