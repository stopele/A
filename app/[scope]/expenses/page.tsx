import Link from "next/link";
import { stores } from "@/lib/config";
import { won } from "@/lib/dashboard";
import { HQ, HQ_LABEL, sumByCategory } from "@/lib/expenses";
import { loadMonth, parseMonth, shiftMonth } from "@/lib/month";
import { Badge, DetailPage, ShareList, Tabs, getScope, mmdd } from "@/app/ui";

export const dynamic = "force-dynamic";

const storeName = (id: string) => (id === HQ ? HQ_LABEL : stores.find((s) => s.id === id)?.name ?? id);

export default async function ExpensesPage({
  params, searchParams,
}: { params: Promise<{ scope: string }>; searchParams: Promise<{ month?: string; filter?: string }> }) {
  const scope = await getScope(params);
  const sp = await searchParams;
  const month = parseMonth(sp.month);
  const filter = sp.filter ?? "all";
  const m = await loadMonth(scope, month);
  const byCat = sumByCategory(m.expenses);
  const rows = filter === "all" ? m.expenses : m.expenses.filter((e) => e.category === filter);
  const margin = m.revenue ? (m.profit / m.revenue) * 100 : 0;
  const base = `/${scope.id}/expenses`;
  const [y, mo] = month.split("-");

  // 매장별 손익 (전체 화면)
  const perStore = scope.isAll
    ? [...stores.map((s) => s.id), HQ].map((id) => {
        const revenue = m.cells.reduce((a, c) => a + (c.perStore[id] ?? 0), 0);
        const cost = m.expenses.filter((e) => e.store === id).reduce((a, e) => a + e.amount, 0);
        return { id, revenue, cost, profit: revenue - cost };
      })
    : [];

  return (
    <DetailPage scope={scope} section="/expenses" title="비용 · 손익" mode={m.expenseMode} note={m.expenseNote}>
      <div className="form-actions">
        <Link href={`${base}/new`} className="btn" style={{ flex: 1 }}>+ 비용 입력</Link>
        <Link href={`${base}/import`} className="btn secondary">엑셀 가져오기</Link>
      </div>

      <section className="card">
        <div className="cal-nav">
          <Link href={`${base}?month=${shiftMonth(month, -1)}`} className="tab">‹ 이전</Link>
          <h2 style={{ margin: 0 }}>{y}년 {Number(mo)}월 손익</h2>
          <Link href={`${base}?month=${shiftMonth(month, 1)}`} className="tab">다음 ›</Link>
        </div>
        <div className="tiles" style={{ marginTop: 14 }}>
          <div className="tile"><div className="label">매출 <Badge mode={m.salesMode} /></div><div className="value">{won(m.revenue)}</div></div>
          <div className="tile"><div className="label">비용</div><div className="value down">-{won(m.expenseTotal)}</div></div>
          <div className="tile"><div className="label">이익</div><div className={`value ${m.profit >= 0 ? "" : "warn"}`}>{won(m.profit)}</div></div>
          <div className="tile"><div className="label">이익률</div><div className="value">{m.revenue ? `${margin.toFixed(1)}%` : "-"}</div></div>
        </div>
        <p className="note" style={{ marginTop: 12 }}>매출은 카드매출(웨딩하우스는 행사 매출) 기준, 비용은 입력·가져온 비용 기준입니다.</p>
      </section>

      <div className="grid two">
        <section className="card">
          <h2>분류별 비용</h2>
          <p className="note">어디에 돈이 나갔는지</p>
          {byCat.length ? <ShareList rows={byCat.map((c) => ({ label: c.category, value: c.amount }))} format={won} /> : <p className="sub">비용이 없습니다.</p>}
        </section>
        {scope.isAll ? (
          <section className="card">
            <h2>매장별 손익</h2>
            <table className="list">
              <thead><tr className="sub"><td>매장</td><td className="num">매출</td><td className="num">비용</td><td className="num">이익</td></tr></thead>
              <tbody>
                {perStore.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id === HQ ? HQ_LABEL : <a href={`/${p.id}/expenses?month=${month}`} style={{ color: "var(--blue)" }}>{storeName(p.id)}</a>}</td>
                    <td className="num">{p.revenue ? won(p.revenue) : "-"}</td>
                    <td className="num down">{p.cost ? `-${won(p.cost)}` : "-"}</td>
                    <td className={`num ${p.profit < 0 ? "warn" : ""}`}>{won(p.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <section className="card">
            <h2>매출 대비 비용</h2>
            <ShareList rows={byCat.slice(0, 6).map((c) => ({ label: `${c.category} (매출의 ${m.revenue ? ((c.amount / m.revenue) * 100).toFixed(1) : 0}%)`, value: c.amount }))} format={won} />
          </section>
        )}
      </div>

      <section className="card">
        <h2>비용 내역</h2>
        <Tabs
          base={`${base}?month=${month}`}
          current={filter}
          items={[{ value: "all", label: "전체" }, ...byCat.map((c) => ({ value: c.category, label: c.category }))]}
        />
        {rows.length === 0 && <p className="sub">비용이 없습니다.</p>}
        <table className="list">
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td style={{ width: 60 }} className="sub">{mmdd(e.date)}</td>
                <td>
                  <Link href={`${base}/${e.id}`} style={{ fontWeight: 600 }}>{e.vendor || e.category}</Link>
                  <div className="sub" style={{ fontSize: 12 }}>
                    {e.category}{scope.isAll && ` · ${storeName(e.store)}`} · {e.method}{e.source === "import" && " · 엑셀"}
                  </div>
                </td>
                <td className="num down">-{won(e.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </DetailPage>
  );
}
