import { stores } from "@/lib/config";
import { EXPENSE_CATEGORIES, HQ, HQ_LABEL, PAY_METHODS, type Expense } from "@/lib/expenses";

// 비용 입력 폼 (서버 컴포넌트, 동적 상태 없음)
export default function ExpenseFields({ initial, defaultStore, today }: { initial?: Expense; defaultStore: string; today: string }) {
  return (
    <section className="card">
      <input type="hidden" name="id" value={initial?.id ?? ""} />
      <input type="hidden" name="source" value={initial?.source ?? "manual"} />
      <div className="form-grid">
        <label>날짜<input name="date" type="date" required defaultValue={initial?.date ?? today} /></label>
        <label>금액<input name="amount" inputMode="numeric" required placeholder="0" defaultValue={initial?.amount ?? ""} /></label>
        <label>매장
          <select name="store" defaultValue={initial?.store ?? defaultStore}>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            <option value={HQ}>{HQ_LABEL}</option>
          </select>
        </label>
        <label>분류
          <select name="category" defaultValue={initial?.category ?? "식자재"}>
            {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="wide">거래처 · 내용<input name="vendor" placeholder="예: (주)한우유통" defaultValue={initial?.vendor ?? ""} /></label>
        <label>결제 방법
          <select name="method" defaultValue={initial?.method ?? "카드"}>
            {PAY_METHODS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        <label>메모<input name="memo" defaultValue={initial?.memo ?? ""} /></label>
      </div>
    </section>
  );
}
