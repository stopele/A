import { won } from "@/lib/dashboard";
import { getCardSales } from "@/lib/sources/finance";
import { Bars, DetailPage, ShareList, mmdd } from "../ui";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
// 날짜 문자열 자체의 요일 (서버 시간대와 무관)
const weekday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();

export default async function SalesPage() {
  const { mode, note, data: s } = await getCardSales();
  const fee = (d: { amount: number; deposit: number }) => d.amount - d.deposit;
  // 요일별 평균
  const byWeekday = WEEKDAYS.map((label, wd) => {
    const days = s.days.filter((d) => weekday(d.date) === wd);
    return { label, value: days.length ? Math.round(days.reduce((a, d) => a + d.amount, 0) / days.length) : 0 };
  });
  const best = [...byWeekday].sort((a, b) => b.value - a.value)[0];
  return (
    <DetailPage href="/sales" title="매출 · 입금" mode={mode} note={note}>
      <section className="card">
        <div className="tiles">
          <div className="tile"><div className="label">오늘 매출</div><div className="value">{won(s.today)}</div></div>
          <div className="tile"><div className="label">어제 매출</div><div className="value">{won(s.yesterday)}</div></div>
          <div className="tile"><div className="label">이번 달 누적</div><div className="value">{won(s.monthTotal)}</div></div>
          <div className="tile"><div className="label">14일 평균</div><div className="value">{won(Math.round(s.days.reduce((a, d) => a + d.amount, 0) / s.days.length))}</div></div>
        </div>
        <Bars values={s.days.map((d) => d.amount)} labels={s.days.map((d) => String(Number(d.date.slice(8))))} />
      </section>

      <section className="card">
        <h2>입금 예정</h2>
        <p className="note">카드사 정산 후 계좌로 들어올 금액입니다.</p>
        <table className="list">
          <tbody>
            {s.upcomingDeposit.map((u) => (
              <tr key={u.date}><td>{mmdd(u.date)}</td><td className="num">{won(u.amount)}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid two">
        <section className="card">
          <h2>카드사별 매출 (이번 달)</h2>
          <p className="note">어느 카드사 비중이 큰지 확인하세요.</p>
          <ShareList rows={s.byCard.map((c) => ({ label: c.name, value: c.amount }))} format={won} />
        </section>
        <section className="card">
          <h2>요일별 평균 매출</h2>
          <p className="note">최근 14일 기준 · 가장 잘 되는 요일은 {best.label}요일</p>
          <ShareList rows={byWeekday.map((w) => ({ label: `${w.label}요일`, value: w.value }))} format={won} />
        </section>
      </div>

      <section className="card">
        <h2>일별 내역</h2>
        <table className="list">
          <thead>
            <tr className="sub"><td>날짜</td><td className="num">승인 매출</td><td className="num">수수료</td><td className="num">입금액</td></tr>
          </thead>
          <tbody>
            {[...s.days].reverse().map((d) => (
              <tr key={d.date}>
                <td>{mmdd(d.date)} ({WEEKDAYS[weekday(d.date)]})</td>
                <td className="num">{won(d.amount)}</td>
                <td className="num down">-{won(fee(d))}</td>
                <td className="num">{won(d.deposit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </DetailPage>
  );
}
