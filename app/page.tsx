import { store } from "@/lib/config";
import { loadDashboard, summarize, won } from "@/lib/dashboard";
import type { Mode } from "@/lib/types";

export const dynamic = "force-dynamic";

const MODE_LABEL: Record<Mode, string> = { live: "실시간", demo: "샘플", error: "오류" };

function Head({ title, mode, note }: { title: string; mode: Mode; note?: string }) {
  return (
    <>
      <h2>
        {title} <span className={`badge ${mode}`}>{MODE_LABEL[mode]}</span>
      </h2>
      {note && <p className="note">{note}</p>}
    </>
  );
}

function Stars({ n }: { n: number | null }) {
  if (n === null) return null;
  return <span className="stars">{"★".repeat(Math.round(n))}{"☆".repeat(5 - Math.round(n))}</span>;
}

export default async function Home() {
  const d = await loadDashboard();
  const { sales, bank, tax, pos, ranks, openings, reviews, sns } = d;
  const s = sales.data;
  const diff = s.today - s.yesterday;
  const max = Math.max(...s.days.map((x) => x.amount), 1);
  const rv = reviews.data;
  const reviewDelta = rv.monthCount !== null && rv.lastMonthCount ? (rv.monthCount / rv.lastMonthCount) * 100 : null;

  return (
    <main className="wrap">
      <header className="top">
        <h1>{store.name}</h1>
        <span className="date">
          {new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Seoul" })}
        </span>
      </header>

      <div className="grid">
        {/* 매출·입금 */}
        <section className="card">
          <Head title="매출 · 입금" mode={sales.mode} note={sales.note} />
          <div className="big">{won(s.today)}</div>
          <div className="sub">
            오늘 카드매출 · 어제보다{" "}
            <span className={diff >= 0 ? "up" : "down"}>
              {diff >= 0 ? "▲" : "▼"} {won(Math.abs(diff))}
            </span>{" "}
            · 이번 달 {won(s.monthTotal)}
          </div>
          <div className="bars">
            {s.days.map((x, i) => (
              <div
                key={x.date}
                className={`bar ${i === s.days.length - 1 ? "today" : ""}`}
                style={{ height: `${(x.amount / max) * 100}%` }}
                title={`${x.date} ${won(x.amount)}`}
              />
            ))}
          </div>
          <div className="bar-labels">
            {s.days.map((x) => <span key={x.date}>{Number(x.date.slice(8))}</span>)}
          </div>
          <div className="tiles" style={{ marginTop: 16 }}>
            {s.upcomingDeposit.map((u) => (
              <div className="tile" key={u.date}>
                <div className="label">입금 예정 {u.date.slice(5).replace("-", "/")}</div>
                <div className="value">{won(u.amount)}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid two">
          {/* 세금 */}
          <section className="card">
            <Head title="세금" mode={tax.mode} note={tax.note} />
            <div className="tiles">
              <div className="tile"><div className="label">예상 부가세</div><div className="value">{won(tax.data.estimatedVat)}</div></div>
              <div className="tile"><div className="label">{tax.data.nextDeadline.label}</div><div className="value">{tax.data.nextDeadline.date}</div></div>
              <div className="tile"><div className="label">매출 세금계산서</div><div className="value">{won(tax.data.salesInvoiceTotal)}</div></div>
              <div className="tile"><div className="label">매입 세금계산서</div><div className="value">{won(tax.data.purchaseInvoiceTotal)}</div></div>
              <div className="tile"><div className="label">현금영수증 매출</div><div className="value">{won(tax.data.cashReceiptTotal)}</div></div>
            </div>
          </section>

          {/* 포스 */}
          <section className="card">
            <Head title="포스" mode={pos.mode} note={pos.note} />
            <div className="tiles">
              <div className="tile"><div className="label">오늘 주문</div><div className="value">{pos.data.todayOrders}건</div></div>
              <div className="tile"><div className="label">객단가</div><div className="value">{won(pos.data.avgTicket)}</div></div>
            </div>
            <table className="list" style={{ marginTop: 12 }}>
              <tbody>
                {pos.data.topItems.map((it, i) => (
                  <tr key={it.name}><td>{i + 1}. {it.name}</td><td className="num">{it.qty}개</td></tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        {/* 계좌 */}
        <section className="card">
          <Head title="계좌 입출금" mode={bank.mode} note={bank.note} />
          <table className="list">
            <tbody>
              {bank.data.map((t, i) => (
                <tr key={i}>
                  <td style={{ color: "var(--muted)", width: 90 }}>{t.date.slice(5).replace("-", "/")}</td>
                  <td>{t.description}</td>
                  <td className={`num ${t.amount >= 0 ? "up" : "down"}`}>{t.amount >= 0 ? "+" : ""}{won(t.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 검색순위 */}
        <section className="card">
          <Head title="검색순위 · 키워드" mode={ranks.mode} note={ranks.note} />
          <div className="tiles">
            {ranks.data.map((r) => (
              <div className="tile" key={r.keyword}>
                <div className="label">#{r.keyword}</div>
                <div className="value">{r.rank ? `오늘 ${r.rank}위` : "5위 밖"}</div>
                <div className="sub" style={{ fontSize: 13, marginTop: 4 }}>
                  {r.monthlySearches !== null ? `월 검색량 ${r.monthlySearches.toLocaleString("ko-KR")}회` : "검색량 미연동"}
                </div>
                {r.topStore && <div className="link">1위: {r.topStore}</div>}
              </div>
            ))}
          </div>
        </section>

        <div className="grid two">
          {/* 리뷰 */}
          <section className="card">
            <Head title="리뷰" mode={reviews.mode} note={reviews.note} />
            <div className="tiles">
              <div className="tile">
                <div className="label">이번 달 새 리뷰</div>
                <div className="value">{rv.monthCount !== null ? `${rv.monthCount}건` : "-"}</div>
                {reviewDelta !== null && <div className="sub" style={{ fontSize: 12 }}>지난달 대비 {reviewDelta.toFixed(1)}%</div>}
              </div>
              <div className="tile">
                <div className="label">평균 별점{rv.totalCount !== null ? ` · 총 ${rv.totalCount.toLocaleString("ko-KR")}건` : ""}</div>
                <div className="value">{rv.averageRating?.toFixed(1) ?? "-"} <Stars n={rv.averageRating} /></div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              {rv.recent.map((r, i) => (
                <div className="review" key={i}>
                  <div className="meta">
                    {r.source} · {r.author} · {r.date} <Stars n={r.rating} />
                    {r.rating !== null && r.rating <= 3 && <span className="warn"> 답변 필요</span>}
                  </div>
                  {r.text}
                </div>
              ))}
            </div>
          </section>

          {/* SNS */}
          <section className="card">
            <Head title="인스타그램" mode={sns.mode} note={sns.note} />
            <div className="tiles">
              <div className="tile"><div className="label">어제 언급</div><div className="value">{sns.data.yesterdayMentions}건</div></div>
            </div>
            <div style={{ marginTop: 12 }}>
              {sns.data.recent.map((p, i) => (
                <a className="review" key={i} href={p.url} target="_blank" rel="noreferrer" style={{ display: "block" }}>
                  <div className="meta">{p.date}</div>
                  {p.caption || "(내용 없음)"}
                </a>
              ))}
            </div>
            <p className="note" style={{ marginTop: 12 }}>연관 해시태그</p>
            <div>{sns.data.relatedTags.map((t) => <span className="tag" key={t}>#{t}</span>)}</div>
          </section>
        </div>

        {/* 주변 개업 */}
        <section className="card">
          <Head title="주변 개업" mode={openings.mode} note={openings.note} />
          {openings.data.length === 0 ? (
            <p className="sub">최근 개업한 곳이 없습니다.</p>
          ) : (
            <table className="list">
              <tbody>
                {openings.data.map((o) => (
                  <tr key={o.name + o.openedOn}>
                    <td style={{ color: "var(--muted)", width: 90 }}>{o.openedOn.slice(5).replace("-", "/")}</td>
                    <td>
                      {o.name} {o.competitor && <span className="warn">경쟁</span>}
                      <div className="sub" style={{ fontSize: 12 }}>{o.category} · {o.address}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* 리포트 */}
        <section className="card">
          <h2>오늘의 리포트</h2>
          <p className="note">텔레그램을 연결하면 매일 밤 10시에 이 내용이 전송됩니다.</p>
          <pre className="report">{summarize(d)}</pre>
        </section>
      </div>
    </main>
  );
}
