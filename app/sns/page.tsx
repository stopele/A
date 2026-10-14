import { store } from "@/lib/config";
import { getSns } from "@/lib/sources/instagram";
import { DetailPage } from "../ui";

export const dynamic = "force-dynamic";

export default async function SnsPage() {
  const { mode, note, data } = await getSns();
  return (
    <DetailPage href="/sns" title="SNS 관리" mode={mode} note={note}>
      <section className="card">
        <div className="tiles">
          <div className="tile"><div className="label">어제 언급</div><div className="value">{data.yesterdayMentions}건</div></div>
          <div className="tile"><div className="label">추적 해시태그</div><div className="value" style={{ fontSize: 15 }}>#{store.hashtags.join(" #")}</div></div>
        </div>
      </section>
      <section className="card">
        <h2>최근 게시물</h2>
        <p className="note">누르면 인스타그램에서 열립니다.</p>
        {data.recent.length === 0 && <p className="sub">최근 게시물이 없습니다.</p>}
        {data.recent.map((p, i) => (
          <a className="review" key={i} href={p.url} target="_blank" rel="noreferrer" style={{ display: "block" }}>
            <div className="meta">{p.date}</div>
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
