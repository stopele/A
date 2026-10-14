import { notFound, redirect } from "next/navigation";
import { stores, type Store } from "./config";
import type { Scope } from "./scope";

// 행사 매출 화면은 행사 매장 하나에 대해서만 연다. 전체 화면에서 들어오면 행사 매장으로 보낸다.
export function eventStoreOf(scope: Scope, sub = ""): Store {
  if (scope.isAll) {
    const first = stores.find((s) => s.eventSales);
    if (first) redirect(`/${first.id}/events${sub}`);
    notFound();
  }
  const store = scope.stores[0];
  if (!store.eventSales) notFound();
  return store;
}
