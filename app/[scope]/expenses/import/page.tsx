import Link from "next/link";
import { stores } from "@/lib/config";
import { HQ } from "@/lib/expenses";
import { storageKind } from "@/lib/storage";
import { DetailPage, getScope } from "@/app/ui";
import { importExpensesAction } from "../actions";
import ImportForm from "./ImportForm";

export const dynamic = "force-dynamic";

export default async function ImportPage({ params }: { params: Promise<{ scope: string }> }) {
  const scope = await getScope(params);
  const disabled = storageKind() === "none";
  return (
    <DetailPage scope={scope} section="/expenses" title="비용 엑셀 가져오기" mode={disabled ? "error" : "live"}
      note={disabled ? "저장소가 연결되지 않아 가져올 수 없습니다. Vercel → Storage → Blob 을 연결하세요." : "이카운트 ERP의 계정별원장·지출내역 등을 엑셀로 내려받아 올리면 비용으로 등록됩니다."}>
      <ImportForm
        stores={stores.map((s) => ({ id: s.id, name: s.name }))}
        defaultStore={scope.isAll ? HQ : scope.id}
        action={importExpensesAction.bind(null, scope.id)}
        disabled={disabled}
      />
      <Link href={`/${scope.id}/expenses`} className="btn secondary">비용 화면으로</Link>
    </DetailPage>
  );
}
