"use client";

import { useMemo, useState } from "react";
import { guessCategory, HQ, HQ_LABEL, type Expense } from "@/lib/expenses";

type Cell = string | number | boolean | Date | null;
type Row = Cell[];

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

// 엑셀 셀 → YYYY-MM-DD. 이카운트의 "2026/10/03 -1" 같은 일자-번호 형식도 처리
function toDate(v: Cell): string | null {
  if (v instanceof Date && !isNaN(v.getTime())) {
    return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}`;
  }
  const s = String(v ?? "").trim();
  let m = s.match(/(\d{4})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = s.match(/^(\d{4})(\d{2})(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
}

function toAmount(v: Cell): number {
  if (typeof v === "number") return Math.round(v);
  const n = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function parseCsv(text: string): Row[] {
  const rows: Row[] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const HEADER = {
  date: /일자|날짜|거래일|전표일|일시/,
  amount: /금액|출금|차변|합계|공급가|지출/,
  vendor: /거래처|적요|내용|상호|가맹점|비고/,
  account: /계정|분류|항목/,
};

function detect(rows: Row[]) {
  for (let r = 0; r < Math.min(rows.length, 20); r++) {
    const cells = rows[r].map((c) => String(c ?? ""));
    const find = (re: RegExp) => cells.findIndex((c) => re.test(c));
    const date = find(HEADER.date);
    const amount = find(HEADER.amount);
    if (date >= 0 && amount >= 0) return { headerRow: r, date, amount, vendor: find(HEADER.vendor), account: find(HEADER.account) };
  }
  return { headerRow: 0, date: 0, amount: 1, vendor: 2, account: -1 };
}

export default function ImportForm({
  stores, defaultStore, action, disabled,
}: {
  stores: { id: string; name: string }[];
  defaultStore: string;
  action: (rowsJson: string) => Promise<{ added: number; skipped: number }>;
  disabled?: boolean;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState("");
  const [map, setMap] = useState({ headerRow: 0, date: 0, amount: 1, vendor: 2, account: -1 });
  const [store, setStore] = useState(defaultStore);
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  // 같은 파일을 다시 고를 수 있도록 가져온 뒤 파일 입력을 새로 만든다
  const [inputKey, setInputKey] = useState(0);

  async function onFile(file: File) {
    setStatus("");
    setFileName(file.name);
    let parsed: Row[];
    if (/\.csv$/i.test(file.name)) {
      const buf = await file.arrayBuffer();
      let text = new TextDecoder("utf-8").decode(buf);
      // 한글이 깨지면 EUC-KR 로 다시 읽는다
      if (text.includes("�")) text = new TextDecoder("euc-kr").decode(buf);
      parsed = parseCsv(text.replace(/^﻿/, ""));
    } else {
      const { readSheet } = await import("read-excel-file/browser");
      parsed = (await readSheet(file)) as Row[];
    }
    setRows(parsed);
    setMap(detect(parsed));
  }

  const header = rows[map.headerRow] ?? [];
  const mapped: Omit<Expense, "id" | "method" | "source">[] = useMemo(() => {
    return rows.slice(map.headerRow + 1).flatMap((r) => {
      const date = toDate(r[map.date] ?? null);
      const amount = toAmount(r[map.amount] ?? null);
      if (!date || amount <= 0) return [];
      const vendor = map.vendor >= 0 ? String(r[map.vendor] ?? "").trim() : "";
      const account = map.account >= 0 ? String(r[map.account] ?? "").trim() : "";
      return [{ date, amount, vendor: vendor || account, store, category: guessCategory(`${account} ${vendor}`), memo: account }];
    });
  }, [rows, map, store]);
  const total = mapped.reduce((a, r) => a + r.amount, 0);

  const colSelect = (key: "date" | "amount" | "vendor" | "account", label: string, optional = false) => (
    <label>{label}
      <select value={map[key]} onChange={(e) => setMap({ ...map, [key]: Number(e.target.value) })}>
        {optional && <option value={-1}>(사용 안 함)</option>}
        {header.map((h, i) => <option key={i} value={i}>{String(h ?? `${i + 1}번째 열`) || `${i + 1}번째 열`}</option>)}
      </select>
    </label>
  );

  return (
    <div className="grid">
      <section className="card">
        <h2>1. 파일 선택</h2>
        <p className="note">이카운트에서 내려받은 엑셀(.xlsx) 또는 CSV 파일을 고르세요. 아이패드에서는 &lsquo;파일&rsquo; 앱에 저장한 파일을 고를 수 있습니다.</p>
        <input key={inputKey} type="file" accept=".xlsx,.csv" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        {fileName && <p className="sub" style={{ marginTop: 8 }}>{fileName} · {rows.length}줄</p>}
      </section>

      {rows.length > 0 && (
        <>
          <section className="card">
            <h2>2. 열 맞추기</h2>
            <p className="note">자동으로 찾은 열이 맞는지 확인하세요. 분류는 계정명·적요를 보고 자동으로 정합니다.</p>
            <div className="form-grid">
              <label>제목 줄
                <select value={map.headerRow} onChange={(e) => setMap({ ...map, headerRow: Number(e.target.value) })}>
                  {rows.slice(0, 20).map((r, i) => <option key={i} value={i}>{i + 1}줄: {r.slice(0, 4).map((c) => String(c ?? "")).join(" | ")}</option>)}
                </select>
              </label>
              <label>매장
                <select value={store} onChange={(e) => setStore(e.target.value)}>
                  {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  <option value={HQ}>{HQ_LABEL}</option>
                </select>
              </label>
              {colSelect("date", "날짜 열")}
              {colSelect("amount", "금액 열")}
              {colSelect("vendor", "거래처·적요 열", true)}
              {colSelect("account", "계정명 열", true)}
            </div>
          </section>

          <section className="card">
            <h2>3. 미리보기</h2>
            <p className="note">{mapped.length}건 · 합계 {won(total)} (날짜·금액이 없는 줄은 제외) · 같은 날짜·금액·거래처는 중복으로 건너뜁니다.</p>
            <table className="list">
              <tbody>
                {mapped.slice(0, 30).map((r, i) => (
                  <tr key={i}>
                    <td className="sub" style={{ width: 96 }}>{r.date}</td>
                    <td>{r.vendor}<div className="sub" style={{ fontSize: 12 }}>{r.category}</div></td>
                    <td className="num">{won(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {mapped.length > 30 && <p className="sub">… 외 {mapped.length - 30}건</p>}
          </section>

          <div className="form-actions">
            <button
              type="button"
              className="primary"
              disabled={disabled || busy || mapped.length === 0}
              onClick={async () => {
                setBusy(true);
                try {
                  const r = await action(JSON.stringify(mapped));
                  setStatus(`가져오기 완료: ${r.added}건 추가, ${r.skipped}건 중복 제외`);
                  setRows([]);
                  setFileName("");
                  setInputKey((k) => k + 1);
                } catch (err) {
                  setStatus(`오류: ${err instanceof Error ? err.message : String(err)}`);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {mapped.length}건 가져오기
            </button>
          </div>
        </>
      )}
      {status && <section className="card"><p style={{ margin: 0, fontWeight: 600 }}>{status}</p></section>}
    </div>
  );
}
