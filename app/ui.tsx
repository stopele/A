import Link from "next/link";
import { store } from "@/lib/config";
import type { Mode } from "@/lib/types";

export const MENU = [
  { href: "/sales", label: "매출 입금", icon: "💳" },
  { href: "/tax", label: "세금", icon: "🧾" },
  { href: "/pos", label: "포스", icon: "🖥️" },
  { href: "/bank", label: "계좌", icon: "🏦" },
  { href: "/openings", label: "주변 개업", icon: "🏪" },
  { href: "/sns", label: "SNS 관리", icon: "📸" },
  { href: "/ranks", label: "검색순위 관리", icon: "📍" },
  { href: "/reviews", label: "리뷰 관리", icon: "⭐" },
] as const;

const MODE_LABEL: Record<Mode, string> = { live: "실시간", demo: "샘플", error: "오류" };

export function Badge({ mode }: { mode: Mode }) {
  return <span className={`badge ${mode}`}>{MODE_LABEL[mode]}</span>;
}

// 대시보드 카드 제목. href 가 있으면 "자세히" 링크가 붙는다.
export function Head({ title, mode, note, href }: { title: string; mode: Mode; note?: string; href?: string }) {
  return (
    <>
      <div className="card-head">
        <h2>
          {title} <Badge mode={mode} />
        </h2>
        {href && <Link className="more" href={href}>자세히 ›</Link>}
      </div>
      {note && <p className="note">{note}</p>}
    </>
  );
}

export function Stars({ n }: { n: number | null }) {
  if (n === null) return null;
  const r = Math.round(n);
  return <span className="stars">{"★".repeat(r)}{"☆".repeat(5 - r)}</span>;
}

export function MenuBar({ active }: { active?: string }) {
  return (
    <nav className="menu">
      {MENU.map((m) => (
        <Link key={m.href} href={m.href} className={`menu-item ${active === m.href ? "active" : ""}`}>
          <span className="menu-icon">{m.icon}</span>
          <span className="menu-label">{m.label}</span>
        </Link>
      ))}
    </nav>
  );
}

// 상세 화면 공통 틀: 뒤로가기 + 제목 + 메뉴
export function DetailPage({
  href, title, mode, note, children,
}: { href: string; title: string; mode: Mode; note?: string; children: React.ReactNode }) {
  return (
    <main className="wrap">
      <header className="top">
        <Link href="/" className="back">‹ {store.name}</Link>
      </header>
      <MenuBar active={href} />
      <h1 className="page-title">
        {title} <Badge mode={mode} />
      </h1>
      {note && <p className="note" style={{ marginTop: -4 }}>{note}</p>}
      <div className="grid">{children}</div>
    </main>
  );
}

// ?filter= 로 바꾸는 탭
export function Tabs({ base, current, items }: { base: string; current: string; items: { value: string; label: string }[] }) {
  return (
    <div className="tabs">
      {items.map((t) => (
        <Link
          key={t.value}
          href={t.value === items[0].value ? base : `${base}?filter=${encodeURIComponent(t.value)}`}
          className={`tab ${current === t.value ? "active" : ""}`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

export function Bars({ values, labels, highlightLast = true }: { values: number[]; labels: string[]; highlightLast?: boolean }) {
  const max = Math.max(...values, 1);
  return (
    <>
      <div className="bars">
        {values.map((v, i) => (
          <div
            key={i}
            className={`bar ${highlightLast && i === values.length - 1 ? "today" : ""}`}
            style={{ height: `${(v / max) * 100}%` }}
          />
        ))}
      </div>
      <div className="bar-labels">{labels.map((l, i) => <span key={i}>{l}</span>)}</div>
    </>
  );
}

// 가로 막대 비율 목록 (카드사별, 결제수단별 등)
export function ShareList({ rows, format }: { rows: { label: string; value: number }[]; format: (n: number) => string }) {
  const total = rows.reduce((a, r) => a + r.value, 0) || 1;
  return (
    <div className="share">
      {rows.map((r) => (
        <div key={r.label} className="share-row">
          <div className="share-top">
            <span>{r.label}</span>
            <span className="num">{format(r.value)} · {((r.value / total) * 100).toFixed(0)}%</span>
          </div>
          <div className="share-track"><div className="share-fill" style={{ width: `${(r.value / total) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

export const mmdd = (date: string) => date.slice(5).replace("-", "/");
