import Link from "next/link";
import { POS_LABEL } from "@/lib/config";
import { loadDashboard, summarize, won } from "@/lib/dashboard";
import { ymd } from "@/lib/demo";
import { EVENT_TYPE_LABEL, eventStats, eventTotal } from "@/lib/events";
import { loadMonth } from "@/lib/month";
import { Bars, Head, Stars, TopBar, getScope, mmdd } from "@/app/ui";

export const dynamic = "force-dynamic";

export default async function Home({ params }: { params: Promise<{ scope: string }> }) {
  const scope = await getScope(params);
  const [d, month] = await Promise.all([loadDashboard(scope), loadMonth(scope, ymd(new Date()).slice(0, 7))]);
  const { sales, pos, events, ranks, reviews, sns, tax, bank } = d;
  const today = ymd(new Date());
  const s = sales.data;
  const diff = s.today - s.yesterday;
  const rv = reviews.data;
  const base = `/${scope.id}`;
  const reviewDelta = rv.monthCount !== null && rv.lastMonthCount ? (rv.monthCount / rv.lastMonthCount) * 100 : null;

  return (
    <main className="wrap">
      <TopBar scope={scope} section="" />

      <div className="grid">
        <section className="card">
          <Head href={`${base}/sales`} title={scope.isAll ? "전체 매출 · 입금" : "매출 · 입금"} mode={sales.mode} note={sales.note} />
          <div className="big">{won(s.today)}</div>
          <div className="sub">
            오늘 카드매출 · 어제보다{" "}
            <span className={diff >= 0 ? "up" : "down"}>{diff >= 0 ? "▲" : "▼"} {won(Math.abs(diff))}</span>
            {" "}· 이번 달 {won(s.monthTotal)}
          </div>
          <Bars values={s.days.map((x) => x.amount)} labels={s.days.map((x) => String(Number(x.date.slice(8))))} />
          <div className="tiles" style={{ marginTop: 16 }}>
            {s.upcomingDeposit.map((u) => (
              <div className="tile" key={u.date}>
                <div className="label">입금 예정 {mmdd(u.date)}</div>
                <div className="value">{won(u.amount)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <Head href={`${base}/expenses`} title="이번 달 손익" mode={month.expenseMode} />
          <div className="tiles">
            <div className="tile"><div className="label">매출</div><div className="value">{won(month.revenue)}</div></div>
            <div className="tile"><div className="label">비용</div><div className="value down">-{won(month.expenseTotal)}</div></div>
            <div className="tile"><div className="label">이익</div><div className={`value ${month.profit < 0 ? "warn" : ""}`}>{won(month.profit)}</div></div>
            <Link href={`${base}/calendar`} className="tile" style={{ display: "block" }}>
              <div className="label">매출 캘린더</div><div className="value" style={{ color: "var(--blue)" }}>📅 달력으로 보기 ›</div>
            </Link>
          </div>
        </section>

        {scope.isAll && (
          <section className="card">
            <h2>매장별 오늘</h2>
            <p className="note">매장 이름을 누르면 매장 화면으로 이동합니다.</p>
            <table className="list">
              <thead>
                <tr className="sub"><td>매장</td><td className="num">오늘 매출</td><td className="num">어제 대비</td><td className="num">이번 달</td><td className="num">리뷰 평점</td></tr>
              </thead>
              <tbody>
                {sales.perStore.map((p) => {
                  const dd = p.data.today - p.data.yesterday;
                  const r = reviews.perStore.find((x) => x.store.id === p.store.id)?.data;
                  return (
                    <tr key={p.store.id}>
                      <td>
                        <Link href={`/${p.store.id}`} style={{ color: "var(--blue)", fontWeight: 600 }}>{p.store.name} ›</Link>
                        <div className="sub" style={{ fontSize: 12 }}>{p.store.category} · {POS_LABEL[p.store.pos]}</div>
                      </td>
                      <td className="num">{won(p.data.today)}</td>
                      <td className={`num ${dd >= 0 ? "up" : "down"}`}>{dd >= 0 ? "▲" : "▼"} {won(Math.abs(dd))}</td>
                      <td className="num">{won(p.data.monthTotal)}</td>
                      <td className="num">{r?.averageRating?.toFixed(1) ?? "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}

        <div className="grid two">
          {tax && (
            <section className="card">
              <Head href={`${base}/tax`} title="세금 (법인)" mode={tax.mode} note={tax.note} />
              <div className="tiles">
                <div className="tile"><div className="label">예상 부가세</div><div className="value">{won(tax.data.estimatedVat)}</div></div>
                <div className="tile"><div className="label">{tax.data.nextDeadline.label}</div><div className="value">{tax.data.nextDeadline.date}</div></div>
              </div>
            </section>
          )}
          {pos.mode !== "none" && pos.data && (
            <section className="card">
              <Head href={`${base}/pos`} title="포스" mode={pos.mode} note={pos.note} />
              <div className="tiles">
                <div className="tile"><div className="label">오늘 주문</div><div className="value">{pos.data.todayOrders}건</div></div>
                <div className="tile"><div className="label">객단가</div><div className="value">{won(pos.data.avgTicket)}</div></div>
              </div>
              <table className="list" style={{ marginTop: 12 }}>
                <tbody>
                  {pos.data.topItems.slice(0, 3).map((it, i) => (
                    <tr key={it.name}><td>{i + 1}. {it.name}</td><td className="num">{it.qty}개</td></tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>

        {events?.perStore.map((ev) => {
          const st = eventStats(ev.data.filter((e) => e.date.startsWith(today.slice(0, 7))));
          const upcoming = ev.data.filter((e) => e.date >= today && e.status === "예약").sort((a, b) => a.date.localeCompare(b.date));
          return (
            <section className="card" key={ev.store.id}>
              <Head href={`/${ev.store.id}/events`} title={scope.isAll ? `${ev.store.name} 행사 매출` : "행사 매출"} mode={ev.mode} note={ev.note} />
              <div className="tiles">
                <div className="tile"><div className="label">이번 달 행사 매출</div><div className="value">{won(st.total)}</div></div>
                <div className="tile"><div className="label">이번 달 행사</div><div className="value">{st.count}건</div></div>
                <div className="tile"><div className="label">이번 달 하객</div><div className="value">{st.guests.toLocaleString("ko-KR")}명</div></div>
              </div>
              <p className="note" style={{ marginTop: 14 }}>다가오는 예약</p>
              {upcoming.length === 0 ? <p className="sub">예약된 행사가 없습니다.</p> : (
                <table className="list">
                  <tbody>
                    {upcoming.slice(0, 4).map((e) => (
                      <tr key={e.id}>
                        <td style={{ color: "var(--muted)", width: 70 }}>{mmdd(e.date)}</td>
                        <td><Link href={`/${ev.store.id}/events/${e.id}`}>{e.title}</Link> <span className="sub" style={{ fontSize: 12 }}>{EVENT_TYPE_LABEL[e.type]}</span></td>
                        <td className="num">{won(eventTotal(e))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          );
        })}

        {bank && (
          <section className="card">
            <Head href={`${base}/bank`} title="법인 계좌 입출금" mode={bank.mode} note={bank.note} />
            <table className="list">
              <tbody>
                {bank.data.slice(0, 5).map((t, i) => (
                  <tr key={i}>
                    <td style={{ color: "var(--muted)", width: 70 }}>{mmdd(t.date)}</td>
                    <td>{t.description}</td>
                    <td className={`num ${t.amount >= 0 ? "up" : "down"}`}>{t.amount >= 0 ? "+" : ""}{won(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <section className="card">
          <Head href={`${base}/ranks`} title="검색순위 · 키워드" mode={ranks.mode} note={ranks.note} />
          <div className="tiles">
            {ranks.data.map((r) => (
              <div className="tile" key={`${r.store}-${r.keyword}`}>
                <div className="label">{scope.isAll && <span className="store-tag">{r.store}</span>}#{r.keyword}</div>
                <div className="value">{r.rank ? `오늘 ${r.rank}위` : "5위 밖"}</div>
                <div className="sub" style={{ fontSize: 13, marginTop: 4 }}>
                  {r.monthlySearches !== null ? `월 검색량 ${r.monthlySearches.toLocaleString("ko-KR")}회` : "검색량 미연동"}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid two">
          <section className="card">
            <Head href={`${base}/reviews`} title="리뷰" mode={reviews.mode} note={reviews.note} />
            <div className="tiles">
              <div className="tile">
                <div className="label">이번 달 새 리뷰</div>
                <div className="value">{rv.monthCount !== null ? `${rv.monthCount}건` : "-"}</div>
                {reviewDelta !== null && <div className="sub" style={{ fontSize: 12 }}>지난달 대비 {reviewDelta.toFixed(1)}%</div>}
              </div>
              <div className="tile">
                <div className="label">평균 별점</div>
                <div className="value">{rv.averageRating?.toFixed(1) ?? "-"} <Stars n={rv.averageRating} /></div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              {rv.recent.slice(0, 3).map((r, i) => (
                <div className="review" key={i}>
                  <div className="meta">
                    {scope.isAll && <span className="store-tag">{r.store}</span>}
                    {r.source} · {r.author} · {r.date} <Stars n={r.rating} />
                    {r.rating !== null && r.rating <= 3 && <span className="warn"> 답변 필요</span>}
                  </div>
                  {r.text}
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <Head href={`${base}/sns`} title="인스타그램" mode={sns.mode} note={sns.note} />
            <div className="tiles">
              <div className="tile"><div className="label">어제 언급</div><div className="value">{sns.data.yesterdayMentions}건</div></div>
            </div>
            <div style={{ marginTop: 12 }}>
              {sns.data.recent.slice(0, 3).map((p, i) => (
                <a className="review" key={i} href={p.url} target="_blank" rel="noreferrer" style={{ display: "block" }}>
                  <div className="meta">{scope.isAll && <span className="store-tag">{p.store}</span>}{p.date}</div>
                  {p.caption || "(내용 없음)"}
                </a>
              ))}
            </div>
          </section>
        </div>


        <section className="card">
          <h2>오늘의 리포트</h2>
          <p className="note">텔레그램을 연결하면 매일 밤 10시에 법인 전체 리포트가 전송됩니다.</p>
          <pre className="report">{summarize(d)}</pre>
        </section>
      </div>
    </main>
  );
}
