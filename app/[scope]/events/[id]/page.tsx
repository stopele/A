import { notFound } from "next/navigation";
import { eventStoreOf } from "@/lib/event-scope";
import { getEvents, getPrices } from "@/lib/sources/events";
import { storageKind } from "@/lib/storage";
import { DetailPage, getScope } from "@/app/ui";
import { deleteEventAction, saveEventAction } from "../actions";
import EventForm from "../EventForm";

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: Promise<{ scope: string; id: string }> }) {
  const scope = await getScope(params);
  const { id } = await params;
  const store = eventStoreOf(scope);
  const [{ mode, data }, prices] = await Promise.all([getEvents(store), getPrices(store)]);
  const event = data.find((e) => e.id === id);
  if (!event) notFound();
  // 샘플 행사는 저장된 데이터가 아니므로 고치면 새 행사로 저장된다
  const isDemo = mode === "demo";
  const disabled = storageKind() === "none";
  return (
    <DetailPage
      scope={scope}
      section="/events"
      title={event.title}
      mode={isDemo ? "demo" : "live"}
      note={isDemo ? "샘플 행사입니다. 저장하면 실제 행사로 등록되고 샘플은 사라집니다." : undefined}
    >
      <EventForm
        prices={prices}
        initial={isDemo ? { ...event, id: "" } : event}
        action={saveEventAction.bind(null, scope.id)}
        deleteAction={isDemo ? undefined : deleteEventAction.bind(null, scope.id, event.id)}
        disabled={disabled}
      />
    </DetailPage>
  );
}
