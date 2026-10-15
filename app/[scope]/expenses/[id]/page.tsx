import { notFound } from "next/navigation";
import { ymd } from "@/lib/demo";
import { getExpenses } from "@/lib/sources/expenses";
import { storageKind } from "@/lib/storage";
import { DetailPage, getScope } from "@/app/ui";
import { deleteExpenseAction, saveExpenseAction } from "../actions";
import ExpenseFields from "../ExpenseFields";

export const dynamic = "force-dynamic";

export default async function EditExpensePage({ params }: { params: Promise<{ scope: string; id: string }> }) {
  const scope = await getScope(params);
  const { id } = await params;
  const { mode, data } = await getExpenses();
  const e = data.find((x) => x.id === id);
  if (!e) notFound();
  const isDemo = mode === "demo";
  const disabled = storageKind() === "none";
  return (
    <DetailPage scope={scope} section="/expenses" title="비용 수정" mode={isDemo ? "demo" : "live"}
      note={isDemo ? "샘플 비용입니다. 저장하면 실제 비용으로 등록되고 샘플은 사라집니다." : undefined}>
      <form action={saveExpenseAction.bind(null, scope.id)} className="grid">
        <ExpenseFields initial={isDemo ? { ...e, id: "" } : e} defaultStore={e.store} today={ymd(new Date())} />
        <div className="form-actions">
          <button type="submit" className="primary" disabled={disabled}>저장</button>
          {!isDemo && (
            <button formAction={deleteExpenseAction.bind(null, scope.id, e.id, e.date.slice(0, 7))} className="danger" disabled={disabled}>삭제</button>
          )}
        </div>
      </form>
    </DetailPage>
  );
}
