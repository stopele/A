import { store } from "@/lib/config";
import { getKeywordRanks } from "@/lib/sources/naver";
import { DetailPage } from "../ui";

export const dynamic = "force-dynamic";

const same = (a: string) => a.replace(/\s/g, "").includes(store.name.replace(/\s/g, ""));

export default async function RanksPage() {
  const { mode, note, data } = await getKeywordRanks();
  return (
    <DetailPage href="/ranks" title="검색순위 관리" mode={mode} note={note}>
      {data.map((r) => (
        <section className="card" key={r.keyword}>
          <div className="card-head">
            <h2>#{r.keyword}</h2>
            <a
              className="more"
              href={`https://map.naver.com/p/search/${encodeURIComponent(r.keyword)}`}
              target="_blank"
              rel="noreferrer"
            >
              네이버 지도에서 보기 ›
            </a>
          </div>
          <div className="tiles" style={{ margin: "12px 0" }}>
            <div className="tile"><div className="label">오늘 순위</div><div className="value">{r.rank ? `${r.rank}위` : "5위 밖"}</div></div>
            <div className="tile">
              <div className="label">월간 검색량</div>
              <div className="value">{r.monthlySearches !== null ? `${r.monthlySearches.toLocaleString("ko-KR")}회` : "미연동"}</div>
            </div>
          </div>
          <ol className="rank-list">
            {r.stores.map((name, i) => (
              <li key={name + i} className={same(name) ? "mine" : ""}>
                <span className="pos">{i + 1}</span>
                <span>{name}{same(name) && " (내 가게)"}</span>
              </li>
            ))}
          </ol>
        </section>
      ))}
      <section className="card">
        <h2>순위 올리는 팁</h2>
        <ul className="sub" style={{ lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
          <li>네이버 플레이스 사진·메뉴·영업시간을 최신으로 유지하세요.</li>
          <li>영수증 리뷰와 저장(찜) 수가 순위에 영향을 줍니다.</li>
          <li>답글이 달린 리뷰가 많을수록 활동성이 높게 평가됩니다.</li>
        </ul>
      </section>
    </DetailPage>
  );
}
