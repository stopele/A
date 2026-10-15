import Link from "next/link";
import { notFound } from "next/navigation";
import { stores } from "@/lib/config";
import { ALL, resolveScope, type Scope } from "@/lib/scope";
import type { Mode } from "@/lib/types";

const SECTIONS = [
  { path: "/sales", label: "매출 입금", icon: "💳", allOnly: false },
  { path: "/calendar", label: "매출 캘린더", icon: "📅", allOnly: false },
  { path: "/expenses", label: "비용 · 손익", icon: "💸", allOnly: false },
  { path: "/tax", label: "세금", icon: "🧾", allOnly: true },
  { path: "/pos", label: "포스", icon: "🖥️", allOnly: false },
  { path: "/events", label: "행사 매출", icon: "💒", allOnly: false },
  { path: "/bank", label: "계좌", icon: "🏦", allOnly: true },
  { path: "/sns", label: "SNS 관리", icon: "📸", allOnly: false },
  { path: "/ranks", label: "검색순위 관리", icon: "📍", allOnly: false },
  { path: "/reviews", label: "리뷰 관리", icon: "⭐", allOnly: false },
] as const;

export type Section = (typeof SECTIONS)[number]["path"] | "";

// 세금·계좌는 법인 단위, 포스 없는 매장은 포스 메뉴 숨김, 행사 매출은 행사 매장만
function sectionsFor(scope: Scope) {
  return SECTIONS.filter((s) => {
    if (s.allOnly && !scope.isAll) return false;
    if (s.path === "/pos" && !scope.isAll && scope.stores[0].pos === "none") return false;
    // 행사 매출은 행사 매장(웨딩하우스)과 전체 화면에서만
    if (s.path === "/events") return scope.stores.some((st) => st.eventSales);
    return true;
  });
}

export async function getScope(params: Promise<{ scope: string }>): Promise<Scope> {
  const scope = resolveScope((await params).scope);
  if (!scope) notFound();
  return scope;
}

const MODE_LABEL: Record<Mode, string> = { live: "실시간", demo: "샘플", error: "오류", none: "해당 없음" };

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

export function StoreSwitcher({ scope, section = "" }: { scope: Scope; section?: Section }) {
  const options = [{ id: ALL, name: "전체" }, ...stores.map((s) => ({ id: s.id, name: s.name }))];
  return (
    <nav className="switcher">
      {options.map((o) => {
        // 법인 전용 메뉴(세금·계좌)에서 매장으로 바꾸면 매장 홈으로 간다
        const target = resolveScope(o.id)!;
        const keep = section && sectionsFor(target).some((s) => s.path === section);
        return (
          <Link key={o.id} href={`/${o.id}${keep ? section : ""}`} className={`chip ${scope.id === o.id ? "active" : ""}`}>
            {o.name}
          </Link>
        );
      })}
    </nav>
  );
}

export function MenuBar({ scope, active }: { scope: Scope; active?: Section }) {
  return (
    <nav className="menu">
      {sectionsFor(scope).map((m) => (
        <Link key={m.path} href={`/${scope.id}${m.path}`} className={`menu-item ${active === m.path ? "active" : ""}`}>
          <span className="menu-icon">{m.icon}</span>
          <span className="menu-label">{m.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function TopBar({ scope, section }: { scope: Scope; section: Section }) {
  return (
    <>
      <header className="top">
        {section ? (
          <Link href={`/${scope.id}`} className="back">‹ {scope.label}</Link>
        ) : (
          <h1>{scope.label}</h1>
        )}
        <span className="date">
          {new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Seoul" })}
        </span>
      </header>
      <StoreSwitcher scope={scope} section={section} />
      <MenuBar scope={scope} active={section} />
    </>
  );
}

// 상세 화면 공통 틀
export function DetailPage({
  scope, section, title, mode, note, children,
}: { scope: Scope; section: Section; title: string; mode: Mode; note?: string; children: React.ReactNode }) {
  return (
    <main className="wrap">
      <TopBar scope={scope} section={section} />
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
          href={t.value === items[0].value ? base : `${base}${base.includes("?") ? "&" : "?"}filter=${encodeURIComponent(t.value)}`}
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
