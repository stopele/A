// 비용 데이터 읽기·쓰기. 아직 저장된 비용이 없으면 샘플을 보여준다.
import { stores } from "../config";
import { ymd } from "../demo";
import { HQ, expenseKey, type Expense } from "../expenses";
import { readJson, storageKind, writeJson } from "../storage";
import type { SourceResult } from "../types";

const KEY = "expenses";

export async function getExpenses(): Promise<SourceResult<Expense[]>> {
  try {
    const saved = await readJson<Expense[]>(KEY);
    if (saved) {
      return {
        mode: "live",
        data: saved.sort((a, b) => b.date.localeCompare(a.date)),
        note: storageKind() === "none" ? "저장소가 연결되지 않아 입력할 수 없습니다." : undefined,
      };
    }
  } catch (err) {
    return { mode: "error", data: demoExpenses(), note: `저장소 오류: ${err instanceof Error ? err.message : String(err)}` };
  }
  return {
    mode: "demo",
    data: demoExpenses(),
    note: storageKind() === "none"
      ? "샘플 비용입니다. 입력하려면 Vercel → Storage → Blob 을 연결하세요."
      : "샘플 비용입니다. 첫 비용을 입력하거나 엑셀을 가져오면 샘플은 사라집니다.",
  };
}

async function saved(): Promise<Expense[]> {
  return (await readJson<Expense[]>(KEY)) ?? [];
}

export async function upsertExpense(e: Expense) {
  await writeJson(KEY, [...(await saved()).filter((x) => x.id !== e.id), e]);
}

export async function deleteExpense(id: string) {
  await writeJson(KEY, (await saved()).filter((x) => x.id !== id));
}

// 같은 날짜·금액·거래처는 중복으로 보고 건너뛴다
export async function importExpenses(rows: Expense[]): Promise<{ added: number; skipped: number }> {
  const list = await saved();
  const keys = new Set(list.map(expenseKey));
  const fresh = rows.filter((r) => !keys.has(expenseKey(r)) && (keys.add(expenseKey(r)), true));
  await writeJson(KEY, [...list, ...fresh]);
  return { added: fresh.length, skipped: rows.length - fresh.length };
}

function demoExpenses(): Expense[] {
  const out: Expense[] = [];
  const today = ymd(new Date());
  const months = [0, 1].map((back) => {
    const d = new Date(`${today.slice(0, 7)}-01T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() - back);
    return d.toISOString().slice(0, 7);
  });
  let n = 0;
  const add = (date: string, store: string, category: string, vendor: string, amount: number, method = "계좌이체") => {
    if (date > today) return;
    out.push({ id: `demo-${n++}`, date, store, category, vendor, amount, method, memo: "", source: "manual" });
  };
  for (const m of months) {
    for (const s of stores) {
      const k = s.scale;
      add(`${m}-05`, s.id, "임대료", `${s.name} 임대료`, Math.round(2_200_000 * k / 10_000) * 10_000);
      add(`${m}-10`, s.id, "인건비", `${s.name} 급여`, Math.round(5_500_000 * k / 10_000) * 10_000);
      add(`${m}-15`, s.id, "공과금", "전기·가스요금", Math.round(700_000 * k / 1000) * 1000);
      add(`${m}-25`, s.id, "수수료", "카드 수수료", Math.round(300_000 * k / 1000) * 1000, "기타");
      if (s.sampleMenu.length || s.eventSales) {
        for (const day of ["03", "08", "13", "18", "23", "28"]) {
          add(`${m}-${day}`, s.id, "식자재", s.category.includes("베이커리") ? "제과원료상사" : "(주)한우유통", Math.round(1_200_000 * k / 1000) * 1000, "카드");
        }
      }
      add(`${m}-20`, s.id, "소모품", "포장용기·세제", Math.round(150_000 * k / 1000) * 1000, "카드");
    }
    add(`${m}-12`, HQ, "광고·마케팅", "네이버 플레이스 광고", 900_000, "카드");
    add(`${m}-27`, HQ, "세금·보험", "화재보험", 420_000);
    add(`${m}-17`, HQ, "수선·유지", "냉장고 수리", 380_000, "현금");
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}
