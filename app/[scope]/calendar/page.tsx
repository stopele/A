import Link from "next/link";
import { stores } from "@/lib/config";
import { won } from "@/lib/dashboard";
import { ymd } from "@/lib/demo";
import { EVENT_TYPE_LABEL, eventTotal } from "@/lib/events";
import { HQ_LABEL } from "@/lib/expenses";
import { loadMonth, parseMonth, shiftMonth } from "@/lib/month";
import { DetailPage, getScope } from "@/app/ui";

export const dynamic = "force-dynamic";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const man = (n: number) => (n >= 10_000 ? `${Math.round(n / 10_000).toLocaleString("ko-KR")}만` : n.toLocaleString("ko-KR"));
const storeName = (id: string) => stores.find((s) => s.id === id)?.name ?? HQ_LABEL;

export default async function CalendarPage({
  params, searchParams,
}: { params: Promise<{ scope: string }>; searchParams: Promise<{ month?: string; day?: string }> }) {
  const scope = await getScope(params);
  const sp = await searchParams;
  const month = parseMonth(sp.month);
  const m = await loadMonth(scope, month);
  const today = ymd(new Date());
  const base = `/${scope.id}/calendar`;
  const max = Math.max(...m.cells.map((c) => c.total), 1);
  const firstWeekday = new Date(`${month}-01T00:00:00Z`).getUTCDay();
  const pastDays = m.cells.filter((c) => c.date <= today && c.total > 0);
  const best = [...pastDays].sort((a, b) => b.total - a.total)[0];
  const selected = m.cells.find((c) => c.date === `${month}-${(sp.day ?? "").padStart(2, "0")}`)
    ?? m.cells.find((c) => c.date === today);
  const [y, mo] = month.split("-");

  return (
    <DetailPage
      scope={scope}
      section="/calendar"
      title="매출 캘린더"
      mode={m.salesMode}
      note={scope.stores.some((s) => s.eventSales) ? "웨딩하우스는 입력한 행사 매출 기준, 나머지 매장은 카드매출 기준입니다." : "카드매출 기준입니다."}
    >
      <section className="card">
        <div className="cal-nav">
          <Link href={`${base}?month=${shiftMonth(month, -1)}`} className="tab">‹ 이전</Link>
          <h2 style={{ margin: 0 }}>{y}년 {Number(mo)}월</h2>
          <Link href={`${base}?month=${shiftMonth(month, 1)}`} className="tab">다음 ›</Link>
        </div>
        <div className="tiles" style={{ marginTop: 14 }}>
          <div className="tile"><div className="label">월 매출</div><div className="value">{won(m.revenue)}</div></div>
          <div className="tile"><div className="label">일 평균</div><div className="value">{pastDays.length ? won(Math.round(m.revenue / pastDays.length)) : "-"}</div></div>
          <div className="tile"><div className="label">최고 매출일</div><div className="value">{best ? `${Number(best.date.slice(8))}일 · ${man(best.total)}원` : "-"}</div></div>
          {m.reserved > 0 && <div className="tile"><div className="label">이후 예약 행사</div><div className="value">{won(m.reserved)}</div></div>}
        </div>

        <div className="cal">
          {WEEK.map((w, i) => <div key={w} className={`cal-head ${i === 0 ? "sun" : i === 6 ? "sat" : ""}`}>{w}</div>)}
          {Array.from({ length: firstWeekday }, (_, i) => <div key={`blank-${i}`} />)}
          {m.cells.map((c) => {
            const d = Number(c.date.slice(8));
            const wd = (firstWeekday + d - 1) % 7;
            const future = c.date > today;
            const intensity = c.total / max;
            return (
              <Link
                key={c.date}
                href={`${base}?month=${month}&day=${d}`}
                className={`cal-cell ${c.date === today ? "today" : ""} ${selected?.date === c.date ? "selected" : ""} ${future ? "future" : ""}`}
                style={!future && c.total ? { background: `color-mix(in srgb, var(--blue) ${Math.round(8 + intensity * 30)}%, var(--card))` } : undefined}
              >
                <span className={`cal-day ${wd === 0 ? "sun" : wd === 6 ? "sat" : ""}`}>{d}</span>
                {!future && c.total > 0 && <span className="cal-amt">{man(c.total)}</span>}
                {c.events.length > 0 && <span className="cal-ev">💒{c.events.length}</span>}
              </Link>
            );
          })}
        </div>
      </section>

      {selected && (
        <section className="card">
          <h2>{Number(selected.date.slice(5, 7))}월 {Number(selected.date.slice(8))}일 ({WEEK[new Date(`${selected.date}T00:00:00Z`).getUTCDay()]})</h2>
          {selected.date > today && selected.events.length === 0 && <p className="sub">아직 지나지 않은 날입니다.</p>}
          {selected.date <= today && (
            <>
              <div className="big" style={{ margin: "8px 0" }}>{won(selected.total)}</div>
              <table className="list">
                <tbody>
                  {Object.entries(selected.perStore).sort((a, b) => b[1] - a[1]).map(([id, amt]) => (
                    <tr key={id}><td><Link href={`/${id}/calendar?month=${month}&day=${Number(selected.date.slice(8))}`} style={{ color: "var(--blue)" }}>{storeName(id)}</Link></td><td className="num">{won(amt)}</td></tr>
                  ))}
                  {selected.expense > 0 && (
                    <tr><td className="sub">이날 비용</td><td className="num down">-{won(selected.expense)}</td></tr>
                  )}
                </tbody>
              </table>
            </>
          )}
          {selected.events.length > 0 && (
            <>
              <p className="note" style={{ marginTop: 14 }}>행사</p>
              <table className="list">
                <tbody>
                  {selected.events.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <Link href={`/${e.storeId}/events/${e.id}`}>{e.title}</Link>{" "}
                        <span className={`status ${e.status}`}>{e.status}</span>
                        <div className="sub" style={{ fontSize: 12 }}>{storeName(e.storeId)} · {EVENT_TYPE_LABEL[e.type]}</div>
                      </td>
                      <td className="num">{won(eventTotal(e))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </section>
      )}
    </DetailPage>
  );
}
