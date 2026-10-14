import { store } from "@/lib/config";
import { getOpenings } from "@/lib/sources/openings";
import { DetailPage, Tabs, mmdd } from "../ui";

export const dynamic = "force-dynamic";

export default async function OpeningsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter = "all" } = await searchParams;
  const { mode, note, data } = await getOpenings();
  const rows = filter === "competitor" ? data.filter((o) => o.competitor) : data;
  return (
    <DetailPage href="/openings" title="주변 개업" mode={mode} note={note}>
      <section className="card">
        <div className="tiles">
          <div className="tile"><div className="label">최근 개업</div><div className="value">{data.length}곳</div></div>
          <div className="tile"><div className="label">경쟁 업종</div><div className="value warn">{data.filter((o) => o.competitor).length}곳</div></div>
        </div>
        <p className="note" style={{ marginTop: 12 }}>경쟁 업종 기준: {store.competitorTerms.join(", ")}</p>
      </section>
      <section className="card">
        <Tabs base="/openings" current={filter} items={[{ value: "all", label: "전체" }, { value: "competitor", label: "경쟁 업종만" }]} />
        {rows.length === 0 && <p className="sub">해당하는 곳이 없습니다.</p>}
        <table className="list">
          <tbody>
            {rows.map((o) => (
              <tr key={o.name + o.openedOn}>
                <td style={{ width: 70 }} className="sub">{mmdd(o.openedOn)}</td>
                <td>
                  <a href={`https://map.naver.com/p/search/${encodeURIComponent(o.name)}`} target="_blank" rel="noreferrer">
                    {o.name}
                  </a>{" "}
                  {o.competitor && <span className="warn">경쟁</span>}
                  <div className="sub" style={{ fontSize: 12 }}>{o.category} · {o.address}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </DetailPage>
  );
}
