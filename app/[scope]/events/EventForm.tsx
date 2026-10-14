"use client";

import { useState } from "react";
import { EVENT_TYPE_LABEL, lineTotal, templateLines, type EventLine, type EventRecord, type EventType, type PriceList } from "@/lib/events";

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function EventForm({
  prices, initial, action, deleteAction, disabled,
}: {
  prices: PriceList;
  initial?: EventRecord;
  action: (form: FormData) => Promise<void>;
  deleteAction?: () => Promise<void>;
  disabled?: boolean;
}) {
  const [type, setType] = useState<EventType>(initial?.type ?? "banquet");
  const [lines, setLines] = useState<EventLine[]>(initial?.lines ?? templateLines(prices, "banquet"));
  const total = lines.reduce((a, l) => a + lineTotal(l), 0);

  function changeType(next: EventType) {
    // 수량을 아직 안 넣었을 때만 새 유형의 항목으로 바꾼다
    if (lines.every((l) => l.qty === 0) || confirm("항목을 새 유형의 기본 항목으로 바꿀까요? 입력한 수량은 사라집니다.")) {
      setLines(templateLines(prices, next));
    }
    setType(next);
  }

  function update(i: number, patch: Partial<EventLine>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  const n = (v: string) => Math.max(0, Math.round(Number(v.replace(/[^\d]/g, "")) || 0));

  return (
    <form action={action} className="grid">
      <input type="hidden" name="id" value={initial?.id ?? ""} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />

      <section className="card">
        <h2>행사 정보</h2>
        <div className="tabs" style={{ marginTop: 12 }}>
          {(Object.keys(EVENT_TYPE_LABEL) as EventType[]).map((t) => (
            <button type="button" key={t} className={`tab ${type === t ? "active" : ""}`} onClick={() => changeType(t)}>
              {EVENT_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        <div className="form-grid">
          <label>날짜<input name="date" type="date" required defaultValue={initial?.date ?? localToday()} /></label>
          <label>상태
            <select name="status" defaultValue={initial?.status ?? "예약"}>
              <option>예약</option><option>완료</option><option>취소</option>
            </select>
          </label>
          <label className="wide">행사명<input name="title" required placeholder="예: 김○○ 돌잔치" defaultValue={initial?.title ?? ""} /></label>
          <label>고객명<input name="customer" defaultValue={initial?.customer ?? ""} /></label>
          <label>받은 계약금<input name="deposit" inputMode="numeric" defaultValue={initial?.deposit ?? 0} /></label>
          <label className="wide">메모<textarea name="memo" rows={2} defaultValue={initial?.memo ?? ""} /></label>
        </div>
      </section>

      <section className="card">
        <h2>항목</h2>
        <p className="note">수량을 넣으면 금액이 자동 계산됩니다. 단가도 행사마다 바꿀 수 있어요.</p>
        <div className="line-head"><span>항목</span><span>단가</span><span>수량</span><span>금액</span><span /></div>
        {lines.map((l, i) => (
          <div className="line-row" key={i}>
            <span>
              <input value={l.name} onChange={(e) => update(i, { name: e.target.value })} aria-label="항목명" />
              <small className="sub">{l.category} · {l.unit}</small>
            </span>
            <input inputMode="numeric" value={l.unitPrice.toLocaleString("ko-KR")} onChange={(e) => update(i, { unitPrice: n(e.target.value) })} aria-label="단가" />
            <input inputMode="numeric" value={l.qty || ""} placeholder="0" onChange={(e) => update(i, { qty: n(e.target.value) })} aria-label="수량" />
            <span className="num">{won(lineTotal(l))}</span>
            <button type="button" className="icon-btn" onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))} aria-label="삭제">✕</button>
          </div>
        ))}
        <button
          type="button"
          className="tab"
          style={{ marginTop: 12 }}
          onClick={() => setLines((ls) => [...ls, { name: "", category: "기타", unit: "건", unitPrice: 0, qty: 1 }])}
        >
          + 항목 추가
        </button>
        <div className="total-row"><span>합계</span><span>{won(total)}</span></div>
      </section>

      <div className="form-actions">
        <button type="submit" className="primary" disabled={disabled}>저장</button>
        {deleteAction && (
          <button
            type="button"
            className="danger"
            disabled={disabled}
            onClick={async () => { if (confirm("이 행사를 삭제할까요?")) await deleteAction(); }}
          >
            삭제
          </button>
        )}
      </div>
    </form>
  );
}
