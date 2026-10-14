import { loadSns } from "@/lib/scope";
import { DetailPage, getScope } from "@/app/ui";

export const dynamic = "force-dynamic";

export default async function SnsPage({ params }: { params: Promise<{ scope: string }> }) {
  const scope = await getScope(params);
  const { mode, note, data, perStore } = await loadSns(scope);
  return (
    <DetailPage scope={scope} section="/sns" title="SNS 관리" mode={mode} note={note}>
      <section className="card">
        <div className="tiles">
          <div className="tile"><div className="label">어제 언급</div><div className="value">{data.yesterdayMentions}건</div></div>
          {!scope.isAll && (
            <div className="tile"><div className="label">추적 해시태그</div><div className="value" style={{ fontSize: 15 }}>#{scope.stores[0].hashtags.join(" #")}</div></div>
          )}
        </div>
      </section>

      {scope.isAll && (
        <section className="card">
          <h2>매장별</h2>
          <table className="list">
            <thead><tr className="sub"><td>매장</td><td>해시태그</td><td className="num">어제 언급</td></tr></thead>
            <tbody>
              {perStore.map((p) => (
                <tr key={p.store.id}>
                  <td><a href={`/${p.store.id}/sns`} style={{ color: "var(--blue)", fontWeight: 600 }}>{p.store.name} ›</a></td>
                  <td className="sub">#{p.store.hashtags.join(" #")}</td>
                  <td className="num">{p.data.yesterdayMentions}건</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="card">
        <h2>최근 게시물</h2>
        <p className="note">누르면 인스타그램에서 열립니다.</p>
        {data.recent.length === 0 && <p className="sub">최근 게시물이 없습니다.</p>}
        {data.recent.map((p, i) => (
          <a className="review" key={i} href={p.url} target="_blank" rel="noreferrer" style={{ display: "block" }}>
            <div className="meta">{scope.isAll && <span className="store-tag">{p.store}</span>}{p.date}</div>
            {p.caption || "(내용 없음)"}
          </a>
        ))}
      </section>
      <section className="card">
        <h2>함께 쓰인 해시태그</h2>
        <p className="note">손님들이 같이 쓰는 태그입니다. 게시물 올릴 때 참고하세요.</p>
        <div>
          {data.relatedTags.map((t) => (
            <a key={t} className="tag" href={`https://www.instagram.com/explore/tags/${encodeURIComponent(t)}/`} target="_blank" rel="noreferrer">#{t}</a>
          ))}
        </div>
      </section>
    </DetailPage>
  );
}
