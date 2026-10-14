"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { findStore } from "@/lib/config";
import type { EventLine, EventRecord, EventStatus, EventType, PriceItem, PriceList } from "@/lib/events";
import { deleteEvent, savePrices, upsertEvent } from "@/lib/sources/events";

function eventStore(scopeId: string) {
  const store = findStore(scopeId);
  if (!store?.eventSales) throw new Error("행사 매출을 쓰지 않는 매장입니다.");
  return store;
}

const num = (v: unknown) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const text = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);

function parseLines(raw: unknown): EventLine[] {
  const rows = JSON.parse(String(raw ?? "[]")) as Partial<EventLine>[];
  return rows
    .map((r) => ({ name: text(r.name, 80), category: text(r.category, 20) || "기타", unit: text(r.unit, 10) || "건", unitPrice: num(r.unitPrice), qty: num(r.qty) }))
    .filter((r) => r.name);
}

export async function saveEventAction(scopeId: string, form: FormData) {
  const store = eventStore(scopeId);
  const date = text(form.get("date"), 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("날짜 형식이 올바르지 않습니다.");
  const type = form.get("type") === "wedding" ? "wedding" : ("banquet" as EventType);
  const statusRaw = text(form.get("status"));
  const status: EventStatus = statusRaw === "완료" || statusRaw === "취소" ? statusRaw : "예약";
  const event: EventRecord = {
    id: text(form.get("id"), 40) || crypto.randomUUID(),
    date,
    type,
    title: text(form.get("title"), 80) || "행사",
    customer: text(form.get("customer"), 40),
    status,
    deposit: num(form.get("deposit")),
    memo: text(form.get("memo"), 500),
    lines: parseLines(form.get("lines")),
  };
  await upsertEvent(store, event);
  revalidatePath(`/${scopeId}`, "layout");
  redirect(`/${scopeId}/events`);
}

export async function deleteEventAction(scopeId: string, id: string) {
  await deleteEvent(eventStore(scopeId), id);
  revalidatePath(`/${scopeId}`, "layout");
  redirect(`/${scopeId}/events`);
}

export async function savePricesAction(scopeId: string, form: FormData) {
  const store = eventStore(scopeId);
  const raw = JSON.parse(String(form.get("prices") ?? "{}")) as Partial<Record<EventType, Partial<PriceItem>[]>>;
  const clean = (rows: Partial<PriceItem>[] = []) =>
    rows
      .map((r) => ({ name: text(r.name, 80), category: text(r.category, 20) || "기타", unit: text(r.unit, 10) || "건", price: num(r.price) }))
      .filter((r) => r.name);
  const prices: PriceList = { wedding: clean(raw.wedding), banquet: clean(raw.banquet) };
  await savePrices(store, prices);
  revalidatePath(`/${scopeId}`, "layout");
  redirect(`/${scopeId}/events`);
}
