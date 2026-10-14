import { won } from "@/lib/dashboard";
import { getPos } from "@/lib/sources/finance";
import { Bars, DetailPage, ShareList } from "../ui";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const { mode, note, data: p } = await getPos();
  const peak = [...p.hourly].sort((a, b) => b.orders - a.orders)[0];
  return (
    <DetailPage href="/pos" title="포스" mode={mode} note={note}>
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
          <ShareList rows={p.topItems.map((i) => ({ label: i.name, value: i.qty }))} format={(n) => `${n}개`} />
        </section>
        <section className="card">
          <h2>결제수단</h2>
          <ShareList rows={p.payments.map((x) => ({ label: x.method, value: x.amount }))} format={won} />
        </section>
      </div>
    </DetailPage>
  );
}
