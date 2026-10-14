import { eventStoreOf } from "@/lib/event-scope";
import { getPrices } from "@/lib/sources/events";
import { storageKind } from "@/lib/storage";
import { DetailPage, getScope } from "@/app/ui";
import { saveEventAction } from "../actions";
import EventForm from "../EventForm";

export const dynamic = "force-dynamic";

export default async function NewEventPage({ params }: { params: Promise<{ scope: string }> }) {
  const scope = await getScope(params);
  const store = eventStoreOf(scope, "/new");
  const prices = await getPrices(store);
  const disabled = storageKind() === "none";
  return (
    <DetailPage
      scope={scope}
      section="/events"
      title="행사 등록"
      mode={disabled ? "error" : "live"}
      note={disabled ? "저장소가 연결되지 않아 저장할 수 없습니다. Vercel → Storage → Blob 을 연결하세요." : undefined}
    >
      <EventForm prices={prices} action={saveEventAction.bind(null, scope.id)} disabled={disabled} />
    </DetailPage>
  );
}
