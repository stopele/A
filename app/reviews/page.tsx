import { getReviews } from "@/lib/sources/reviews";
import { DetailPage, ShareList, Stars, Tabs } from "../ui";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "all", label: "전체" },
  { value: "low", label: "답변 필요 (3점 이하)" },
  { value: "네이버", label: "네이버" },
  { value: "구글", label: "구글" },
  { value: "배달의민족", label: "배달의민족" },
];

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter = "all" } = await searchParams;
  const { mode, note, data: rv } = await getReviews();
  const rows = rv.recent.filter((r) =>
    filter === "all" ? true : filter === "low" ? r.rating !== null && r.rating <= 3 : r.source === filter,
  );
  const dist = [5, 4, 3, 2, 1].map((n) => ({ label: `${n}점`, value: rv.recent.filter((r) => r.rating === n).length }));
  const sources = [...new Set(rv.recent.map((r) => r.source))].map((s) => ({
    label: s, value: rv.recent.filter((r) => r.source === s).length,
  }));
  return (
    <DetailPage href="/reviews" title="리뷰 관리" mode={mode} note={note}>
      <section className="card">
        <div className="tiles">
          <div className="tile"><div className="label">이번 달 새 리뷰</div><div className="value">{rv.monthCount ?? "-"}{rv.monthCount !== null && "건"}</div></div>
          <div className="tile"><div className="label">지난달</div><div className="value">{rv.lastMonthCount ?? "-"}{rv.lastMonthCount !== null && "건"}</div></div>
          <div className="tile"><div className="label">평균 별점</div><div className="value">{rv.averageRating?.toFixed(1) ?? "-"} <Stars n={rv.averageRating} /></div></div>
          <div className="tile"><div className="label">누적 리뷰</div><div className="value">{rv.totalCount?.toLocaleString("ko-KR") ?? "-"}</div></div>
        </div>
      </section>
      <div className="grid two">
        <section className="card"><h2>별점 분포</h2><p className="note">최근 리뷰 기준</p><ShareList rows={dist} format={(n) => `${n}건`} /></section>
        <section className="card"><h2>채널별</h2><p className="note">최근 리뷰 기준</p><ShareList rows={sources} format={(n) => `${n}건`} /></section>
      </div>
      <section className="card">
        <h2>리뷰 목록</h2>
        <Tabs base="/reviews" current={filter} items={FILTERS} />
        {rows.length === 0 && <p className="sub">해당하는 리뷰가 없습니다.</p>}
        {rows.map((r, i) => (
          <div className="review" key={i}>
            <div className="meta">
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
