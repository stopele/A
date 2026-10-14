import Link from "next/link";
import { won } from "@/lib/dashboard";
import { ymd } from "@/lib/demo";
import { eventStoreOf } from "@/lib/event-scope";
import { EVENT_TYPE_LABEL, eventStats, eventTotal, guests } from "@/lib/events";
import { getEvents } from "@/lib/sources/events";
import { DetailPage, ShareList, Tabs, getScope, mmdd } from "@/app/ui";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "month", label: "이번 달" },
  { value: "last", label: "지난달" },
  { value: "upcoming", label: "다가오는 행사" },
  { value: "all", label: "전체" },
];

export default async function EventsPage({
  params, searchParams,
}: { params: Promise<{ scope: string }>; searchParams: Promise<{ filter?: string }> }) {
  const scope = await getScope(params);
  const store = eventStoreOf(scope);
  const { filter = "month" } = await searchParams;
  const { mode, note, data: events } = await getEvents(store);

  const today = ymd(new Date());
  const month = today.slice(0, 7);
  const lastMonthDate = new Date(`${month}-01T00:00:00Z`);
  lastMonthDate.setUTCMonth(lastMonthDate.getUTCMonth() - 1);
  const lastMonth = lastMonthDate.toISOString().slice(0, 7);
  const rows = events.filter((e) =>
    filter === "month" ? e.date.startsWith(month)
      : filter === "last" ? e.date.startsWith(lastMonth)
      : filter === "upcoming" ? e.date >= today && e.status !== "취소"
      : true,
  ).sort((a, b) => (filter === "upcoming" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
  const st = eventStats(rows);
  const base = `/${scope.id}/events`;
  const periodLabel = FILTERS.find((f) => f.value === filter)?.label ?? "";

  return (
    <DetailPage scope={scope} section="/events" title="행사 매출" mode={mode} note={note}>
      <div className="form-actions">
        <Link href={`${base}/new`} className="btn" style={{ flex: 1 }}>+ 행사 등록</Link>
        <Link href={`${base}/prices`} className="btn secondary">단가표</Link>
      </div>

      <Tabs base={base} current={filter} items={FILTERS} />

      <section className="card">
        <h2>{periodLabel} 요약</h2>
        <div className="tiles" style={{ marginTop: 12 }}>
          <div className="tile"><div className="label">행사 매출</div><div className="value">{won(st.total)}</div></div>
          <div className="tile"><div className="label">완료 / 예약</div><div className="value" style={{ fontSize: 15 }}>{won(st.confirmed)} / {won(st.reserved)}</div></div>
          <div className="tile"><div className="label">행사 수</div><div className="value">{st.count}건</div></div>
          <div className="tile"><div className="label">하객 수 (식사 인원)</div><div className="value">{st.guests.toLocaleString("ko-KR")}명</div></div>
          <div className="tile"><div className="label">예약 계약금 받은 금액</div><div className="value">{won(st.deposits)}</div></div>
          <div className="tile"><div className="label">1인당 매출</div><div className="value">{st.guests ? won(Math.round(st.total / st.guests)) : "-"}</div></div>
        </div>
      </section>

      {st.count > 0 && (
        <>
          <div className="grid two">
            <section className="card">
              <h2>분류별 매출</h2>
              <p className="note">어디서 매출이 났는지 (대관·예식·식사·촬영 등)</p>
              <ShareList rows={st.byCategory.map((c) => ({ label: c.key, value: c.amount }))} format={won} />
            </section>
            <section className="card">
              <h2>행사 유형별</h2>
              <p className="note">웨딩과 연회 비중</p>
              <ShareList rows={st.byType.map((c) => ({ label: `${c.key} (${c.qty}건)`, value: c.amount }))} format={won} />
            </section>
          </div>
          <section className="card">
            <h2>항목별 매출</h2>
            <table className="list">
              <thead><tr className="sub"><td>항목</td><td className="num">수량</td><td className="num">금액</td></tr></thead>
              <tbody>
                {st.byItem.map((i) => (
                  <tr key={i.key}><td>{i.key}</td><td className="num">{i.qty.toLocaleString("ko-KR")}</td><td className="num">{won(i.amount)}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      <section className="card">
        <h2>행사 목록</h2>
        <p className="note">행사를 누르면 내용을 보고 고칠 수 있습니다.</p>
        {rows.length === 0 && <p className="sub">해당 기간에 행사가 없습니다.</p>}
        <table className="list">
          <tbody>
            {rows.map((e) => {
              const g = guests(e);
              return (
                <tr key={e.id}>
                  <td style={{ width: 70 }} className="sub">{mmdd(e.date)}</td>
                  <td>
                    <Link href={`${base}/${e.id}`} style={{ fontWeight: 600 }}>{e.title}</Link>{" "}
                    <span className={`status ${e.status}`}>{e.status}</span>
                    <div className="sub" style={{ fontSize: 12 }}>
                      {EVENT_TYPE_LABEL[e.type]} · 성인 {g.adult} / 소인 {g.child}
                      {e.status === "예약" && e.deposit > 0 && ` · 계약금 ${won(e.deposit)}`}
                    </div>
                  </td>
                  <td className="num">{won(eventTotal(e))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </DetailPage>
  );
}
