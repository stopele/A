import { POS_LABEL } from "@/lib/config";
import { won } from "@/lib/dashboard";
import { loadPos } from "@/lib/scope";
import { Badge, Bars, DetailPage, ShareList, getScope } from "@/app/ui";

export const dynamic = "force-dynamic";

export default async function PosPage({ params }: { params: Promise<{ scope: string }> }) {
  const scope = await getScope(params);
  const { mode, note, data: p, perStore } = await loadPos(scope);
  const peak = p ? [...p.hourly].sort((a, b) => b.orders - a.orders)[0] : null;
  return (
    <DetailPage scope={scope} section="/pos" title="포스" mode={mode} note={note}>
      {scope.isAll && (
        <section className="card">
          <h2>매장별 포스</h2>
          <table className="list">
            <thead>
              <tr className="sub"><td>매장</td><td>포스</td><td className="num">오늘 주문</td><td className="num">객단가</td></tr>
            </thead>
            <tbody>
              {perStore.map((x) => (
                <tr key={x.store.id}>
                  <td>
                    {x.store.eventSales ? (
                      <a href={`/${x.store.id}/events`} style={{ color: "var(--blue)", fontWeight: 600 }}>{x.store.name} · 행사 매출 ›</a>
                    ) : x.store.pos === "none" ? x.store.name : (
                      <a href={`/${x.store.id}/pos`} style={{ color: "var(--blue)", fontWeight: 600 }}>{x.store.name} ›</a>
                    )}
                  </td>
                  <td>{POS_LABEL[x.store.pos]} <Badge mode={x.mode} /></td>
                  <td className="num">{x.data ? `${x.data.todayOrders}건` : "-"}</td>
                  <td className="num">{x.data ? won(x.data.avgTicket) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {!p ? (
        <section className="card"><p className="sub">포스를 사용하지 않는 매장입니다.</p></section>
      ) : (
        <>
          <section className="card">
            <div className="tiles">
              <div className="tile"><div className="label">오늘 주문</div><div className="value">{p.todayOrders}건</div></div>
              <div className="tile"><div className="label">객단가</div><div className="value">{won(p.avgTicket)}</div></div>
              <div className="tile"><div className="label">가장 바쁜 시간</div><div className="value">{peak ? `${peak.hour}시` : "-"}</div></div>
            </div>
          </section>
          <section className="card">
            <h2>시간대별 주문</h2>
            <Bars values={p.hourly.map((h) => h.orders)} labels={p.hourly.map((h) => `${h.hour}`)} highlightLast={false} />
          </section>
          <div className="grid two">
            <section className="card">
              <h2>메뉴별 판매</h2>
              <ShareList rows={p.topItems.slice(0, scope.isAll ? 12 : 20).map((i) => ({ label: i.name, value: i.qty }))} format={(n) => `${n}개`} />
            </section>
            <section className="card">
              <h2>결제수단</h2>
              <ShareList rows={p.payments.map((x) => ({ label: x.method, value: x.amount }))} format={won} />
            </section>
          </div>
        </>
      )}
    </DetailPage>
  );
}
