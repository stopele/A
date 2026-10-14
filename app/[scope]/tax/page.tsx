import { won } from "@/lib/dashboard";
import { ymd } from "@/lib/demo";
import { getTax } from "@/lib/sources/finance";
import { redirect } from "next/navigation";
import { DetailPage, Tabs, getScope, mmdd } from "@/app/ui";

export const dynamic = "force-dynamic";

// 일반과세자 개인사업자 기준 부가세 일정
function vatSchedule(year: number) {
  return [
    { date: `${year}-01-25`, label: "부가세 확정신고 (전년 7~12월)" },
    { date: `${year}-04-25`, label: "부가세 예정고지 납부" },
    { date: `${year}-05-31`, label: "종합소득세 신고" },
    { date: `${year}-07-25`, label: "부가세 확정신고 (1~6월)" },
    { date: `${year}-10-25`, label: "부가세 예정고지 납부" },
  ];
}

export default async function TaxPage({ params, searchParams }: { params: Promise<{ scope: string }>; searchParams: Promise<{ filter?: string }> }) {
  const scope = await getScope(params);
  // 세금·계좌는 법인 단위라 전체 화면에서만 본다
  if (!scope.isAll) redirect(`/all/tax`);
  const { filter = "전체" } = await searchParams;
  const { mode, note, data: t } = await getTax();
  const today = ymd(new Date());
  const year = Number(today.slice(0, 4));
  const schedule = [...vatSchedule(year), ...vatSchedule(year + 1)].filter((s) => s.date >= today).slice(0, 4);
  const invoices = filter === "전체" ? t.invoices : t.invoices.filter((i) => i.kind === filter);
  const salesVat = Math.round((t.salesInvoiceTotal + t.cashReceiptTotal) / 11);
  const purchaseVat = Math.round(t.purchaseInvoiceTotal / 11);
  return (
    <DetailPage scope={scope} section="/tax" title="세금 (법인)" mode={mode} note={note}>
      <section className="card">
        <h2>예상 부가세</h2>
        <div className="big" style={{ marginTop: 8 }}>{won(t.estimatedVat)}</div>
        <p className="note">{t.nextDeadline.label} · {t.nextDeadline.date}</p>
        <table className="list">
          <tbody>
            <tr><td>매출 세금계산서</td><td className="num">{won(t.salesInvoiceTotal)}</td></tr>
            <tr><td>현금영수증 매출</td><td className="num">{won(t.cashReceiptTotal)}</td></tr>
            <tr><td>매입 세금계산서</td><td className="num">{won(t.purchaseInvoiceTotal)}</td></tr>
            <tr><td className="sub">참고: 계산서 매출세액 − 매입세액 (카드매출 제외)</td><td className="num sub">{won(salesVat - purchaseVat)}</td></tr>
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>다가오는 세금 일정</h2>
        <table className="list">
          <tbody>
            {schedule.map((s) => (
              <tr key={s.date}><td style={{ width: 110 }}>{s.date}</td><td>{s.label}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>세금계산서 · 현금영수증</h2>
        <Tabs
          base={`/${scope.id}/tax`}
          current={filter}
          items={["전체", "매출", "매입", "현금영수증"].map((v) => ({ value: v, label: v }))}
        />
        <table className="list">
          <tbody>
            {invoices.map((i, idx) => (
              <tr key={idx}>
                <td style={{ width: 70 }} className="sub">{mmdd(i.date)}</td>
                <td>{i.partner}<div className="sub" style={{ fontSize: 12 }}>{i.kind}</div></td>
                <td className={`num ${i.kind === "매입" ? "down" : "up"}`}>{won(i.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </DetailPage>
  );
}
