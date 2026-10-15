import { ymd } from "@/lib/demo";
import { HQ } from "@/lib/expenses";
import { storageKind } from "@/lib/storage";
import { DetailPage, getScope } from "@/app/ui";
import { saveExpenseAction } from "../actions";
import ExpenseFields from "../ExpenseFields";

export const dynamic = "force-dynamic";

export default async function NewExpensePage({ params }: { params: Promise<{ scope: string }> }) {
  const scope = await getScope(params);
  const disabled = storageKind() === "none";
  return (
    <DetailPage scope={scope} section="/expenses" title="비용 입력" mode={disabled ? "error" : "live"}
      note={disabled ? "저장소가 연결되지 않아 저장할 수 없습니다. Vercel → Storage → Blob 을 연결하세요." : undefined}>
      <form action={saveExpenseAction.bind(null, scope.id)} className="grid">
        <ExpenseFields defaultStore={scope.isAll ? HQ : scope.id} today={ymd(new Date())} />
        <div className="form-actions"><button type="submit" className="primary" disabled={disabled}>저장</button></div>
      </form>
    </DetailPage>
  );
}
