"use client";

import { useState } from "react";
import { EVENT_TYPE_LABEL, type EventType, type PriceItem, type PriceList } from "@/lib/events";

export default function PriceForm({
  initial, action, disabled,
}: { initial: PriceList; action: (form: FormData) => Promise<void>; disabled?: boolean }) {
  const [prices, setPrices] = useState<PriceList>(initial);
  const n = (v: string) => Math.max(0, Math.round(Number(v.replace(/[^\d]/g, "")) || 0));

  function update(type: EventType, i: number, patch: Partial<PriceItem>) {
    setPrices((p) => ({ ...p, [type]: p[type].map((r, idx) => (idx === i ? { ...r, ...patch } : r)) }));
  }

  return (
    <form action={action} className="grid">
      <input type="hidden" name="prices" value={JSON.stringify(prices)} />
      {(Object.keys(EVENT_TYPE_LABEL) as EventType[]).map((type) => (
        <section className="card" key={type}>
          <h2>{EVENT_TYPE_LABEL[type]} 기본 항목</h2>
          <p className="note">새 {EVENT_TYPE_LABEL[type]} 행사를 등록할 때 이 항목과 단가가 자동으로 채워집니다.</p>
          <div className="price-head"><span>항목</span><span>분류</span><span>단위</span><span>단가</span><span /></div>
          {prices[type].map((r, i) => (
            <div className="price-row" key={i}>
              <input value={r.name} onChange={(e) => update(type, i, { name: e.target.value })} aria-label="항목명" />
              <input value={r.category} onChange={(e) => update(type, i, { category: e.target.value })} aria-label="분류" />
              <input value={r.unit} onChange={(e) => update(type, i, { unit: e.target.value })} aria-label="단위" />
              <input inputMode="numeric" value={r.price.toLocaleString("ko-KR")} onChange={(e) => update(type, i, { price: n(e.target.value) })} aria-label="단가" />
              <button
                type="button"
                className="icon-btn"
                aria-label="삭제"
                onClick={() => setPrices((p) => ({ ...p, [type]: p[type].filter((_, idx) => idx !== i) }))}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            className="tab"
            style={{ marginTop: 12 }}
            onClick={() => setPrices((p) => ({ ...p, [type]: [...p[type], { name: "", category: "기타", unit: "건", price: 0 }] }))}
          >
            + 항목 추가
          </button>
        </section>
      ))}
      <div className="form-actions">
        <button type="submit" className="primary" disabled={disabled}>단가표 저장</button>
      </div>
    </form>
  );
}
