import { eventStoreOf } from "@/lib/event-scope";
import { getPrices } from "@/lib/sources/events";
import { storageKind } from "@/lib/storage";
import { DetailPage, getScope } from "@/app/ui";
import { savePricesAction } from "../actions";
import PriceForm from "../PriceForm";

export const dynamic = "force-dynamic";

export default async function PricesPage({ params }: { params: Promise<{ scope: string }> }) {
  const scope = await getScope(params);
  const store = eventStoreOf(scope, "/prices");
  const prices = await getPrices(store);
  const disabled = storageKind() === "none";
  return (
    <DetailPage
      scope={scope}
      section="/events"
      title="행사 단가표"
      mode={disabled ? "error" : "live"}
      note={disabled ? "저장소가 연결되지 않아 저장할 수 없습니다." : "처음 단가는 예시입니다. 실제 가격으로 바꿔 저장하세요."}
    >
      <PriceForm initial={prices} action={savePricesAction.bind(null, scope.id)} disabled={disabled} />
    </DetailPage>
  );
}
