"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { findStore } from "@/lib/config";
import { EXPENSE_CATEGORIES, HQ, PAY_METHODS, type Expense } from "@/lib/expenses";
import { deleteExpense, importExpenses, upsertExpense } from "@/lib/sources/expenses";

const num = (v: unknown) => {
  const n = Math.round(Number(String(v ?? "").replace(/[^\d.-]/g, "")));
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const text = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);
const validStore = (id: string) => (id === HQ || findStore(id) ? id : HQ);
const validCategory = (c: string) => ((EXPENSE_CATEGORIES as readonly string[]).includes(c) ? c : "기타");
const validDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);

export async function saveExpenseAction(scopeId: string, form: FormData) {
  const date = text(form.get("date"), 10);
  if (!validDate(date)) throw new Error("날짜 형식이 올바르지 않습니다.");
  const amount = num(form.get("amount"));
  if (!amount) throw new Error("금액을 입력하세요.");
  const method = text(form.get("method"));
  const e: Expense = {
    id: text(form.get("id"), 40) || crypto.randomUUID(),
    date,
    store: validStore(text(form.get("store"), 40)),
    category: validCategory(text(form.get("category"))),
    vendor: text(form.get("vendor"), 80),
    amount,
    method: (PAY_METHODS as readonly string[]).includes(method) ? method : "기타",
    memo: text(form.get("memo"), 300),
    source: form.get("source") === "import" ? "import" : "manual",
  };
  await upsertExpense(e);
  revalidatePath(`/`, "layout");
  redirect(`/${scopeId}/expenses?month=${date.slice(0, 7)}`);
}

export async function deleteExpenseAction(scopeId: string, id: string, month: string) {
  await deleteExpense(id);
  revalidatePath(`/`, "layout");
  redirect(`/${scopeId}/expenses?month=${month}`);
}

export async function importExpensesAction(scopeId: string, rowsJson: string) {
  const rows = (JSON.parse(rowsJson) as Partial<Expense>[]).slice(0, 5000);
  const clean: Expense[] = rows
    .map((r) => ({
      id: crypto.randomUUID(),
      date: text(r.date, 10),
      store: validStore(text(r.store, 40)),
      category: validCategory(text(r.category)),
      vendor: text(r.vendor, 80),
      amount: num(r.amount),
      method: "기타",
      memo: text(r.memo, 300),
      source: "import" as const,
    }))
    .filter((r) => validDate(r.date) && r.amount > 0);
  const result = await importExpenses(clean);
  revalidatePath(`/`, "layout");
  return result;
}
