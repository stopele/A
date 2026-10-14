import { loadReviews } from "@/lib/scope";
import { DetailPage, ShareList, Stars, Tabs, getScope } from "@/app/ui";

export const dynamic = "force-dynamic";

export default async function ReviewsPage({
  params, searchParams,
}: { params: Promise<{ scope: string }>; searchParams: Promise<{ filter?: string }> }) {
  const scope = await getScope(params);
  const { filter = "all" } = await searchParams;
  const { mode, note, data: rv, perStore } = await loadReviews(scope);
  const sourceNames = [...new Set(rv.recent.map((r) => r.source))];
  const filters = [
    { value: "all", label: "전체" },
    { value: "low", label: "답변 필요 (3점 이하)" },
    ...sourceNames.map((s) => ({ value: s, label: s })),
  ];
  const rows = rv.recent.filter((r) =>
    filter === "all" ? true : filter === "low" ? r.rating !== null && r.rating <= 3 : r.source === filter,
  );
  const dist = [5, 4, 3, 2, 1].map((n) => ({ label: `${n}점`, value: rv.recent.filter((r) => r.rating === n).length }));
  const sources = sourceNames.map((s) => ({ label: s, value: rv.recent.filter((r) => r.source === s).length }));
  const n = (v: number | null) => (v === null ? "-" : `${v.toLocaleString("ko-KR")}건`);
  return (
    <DetailPage scope={scope} section="/reviews" title="리뷰 관리" mode={mode} note={note}>
      <section className="card">
        <div className="tiles">
          <div className="tile"><div className="label">이번 달 새 리뷰</div><div className="value">{n(rv.monthCount)}</div></div>
          <div className="tile"><div className="label">지난달</div><div className="value">{n(rv.lastMonthCount)}</div></div>
          <div className="tile"><div className="label">평균 별점</div><div className="value">{rv.averageRating?.toFixed(1) ?? "-"} <Stars n={rv.averageRating} /></div></div>
          <div className="tile"><div className="label">누적 리뷰</div><div className="value">{n(rv.totalCount)}</div></div>
        </div>
      </section>

      {scope.isAll && (
        <section className="card">
          <h2>매장별 리뷰</h2>
          <table className="list">
            <thead>
              <tr className="sub"><td>매장</td><td className="num">이번 달</td><td className="num">평점</td><td className="num">답변 필요</td></tr>
            </thead>
            <tbody>
              {perStore.map((p) => (
                <tr key={p.store.id}>
                  <td><a href={`/${p.store.id}/reviews`} style={{ color: "var(--blue)", fontWeight: 600 }}>{p.store.name} ›</a></td>
                  <td className="num">{n(p.data.monthCount)}</td>
                  <td className="num">{p.data.averageRating?.toFixed(1) ?? "-"}</td>
                  <td className="num warn">{p.data.recent.filter((r) => r.rating !== null && r.rating <= 3).length}건</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <div className="grid two">
        <section className="card"><h2>별점 분포</h2><p className="note">최근 리뷰 기준</p><ShareList rows={dist} format={(v) => `${v}건`} /></section>
        <section className="card"><h2>채널별</h2><p className="note">최근 리뷰 기준</p><ShareList rows={sources} format={(v) => `${v}건`} /></section>
      </div>

      <section className="card">
        <h2>리뷰 목록</h2>
        <Tabs base={`/${scope.id}/reviews`} current={filter} items={filters} />
        {rows.length === 0 && <p className="sub">해당하는 리뷰가 없습니다.</p>}
        {rows.map((r, i) => (
          <div className="review" key={i}>
            <div className="meta">
              {scope.isAll && <span className="store-tag">{r.store}</span>}
              {r.source} · {r.author} · {r.date} <Stars n={r.rating} />
              {r.rating !== null && r.rating <= 3 && <span className="warn"> 답변 필요</span>}
            </div>
            {r.text}
          </div>
        ))}
      </section>
    </DetailPage>
  );
}
