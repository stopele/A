import { won } from "@/lib/dashboard";
import { getBank } from "@/lib/sources/finance";
import { redirect } from "next/navigation";
import { DetailPage, Tabs, getScope, mmdd } from "@/app/ui";

export const dynamic = "force-dynamic";

export default async function BankPage({ params, searchParams }: { params: Promise<{ scope: string }>; searchParams: Promise<{ filter?: string }> }) {
  const scope = await getScope(params);
  // 세금·계좌는 법인 단위라 전체 화면에서만 본다
  if (!scope.isAll) redirect(`/all/bank`);
  const { filter = "all" } = await searchParams;
  const { mode, note, data } = await getBank();
  const inflow = data.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0);
  const outflow = data.filter((t) => t.amount < 0).reduce((a, t) => a + t.amount, 0);
  const rows = data.filter((t) => (filter === "in" ? t.amount > 0 : filter === "out" ? t.amount < 0 : true));
  return (
    <DetailPage scope={scope} section="/bank" title="법인 계좌 입출금" mode={mode} note={note}>
      <section className="card">
        <div className="tiles">
          <div className="tile"><div className="label">입금 합계</div><div className="value up">+{won(inflow)}</div></div>
          <div className="tile"><div className="label">출금 합계</div><div className="value down">{won(outflow)}</div></div>
          <div className="tile"><div className="label">순증감</div><div className="value">{won(inflow + outflow)}</div></div>
        </div>
      </section>
      <section className="card">
        <Tabs base={`/${scope.id}/bank`} current={filter} items={[
          { value: "all", label: "전체" }, { value: "in", label: "입금" }, { value: "out", label: "출금" },
        ]} />
        <table className="list">
          <tbody>
            {rows.map((t, i) => (
              <tr key={i}>
                <td style={{ width: 70 }} className="sub">{mmdd(t.date)}</td>
                <td>{t.description}</td>
                <td className={`num ${t.amount >= 0 ? "up" : "down"}`}>{t.amount >= 0 ? "+" : ""}{won(t.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </DetailPage>
  );
}
