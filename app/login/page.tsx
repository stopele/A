import { store } from "@/lib/config";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="wrap" style={{ maxWidth: 420, paddingTop: 80 }}>
      <section className="card">
        <h2>{store.name} 가게 관리</h2>
        <p className="note">비밀번호를 입력하세요.</p>
        <form method="post" action="/api/login" style={{ display: "grid", gap: 12 }}>
          <input
            name="password"
            type="password"
            autoFocus
            required
            style={{ fontSize: 17, padding: "12px 14px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--tile)", color: "var(--text)" }}
          />
          {error && <span className="warn" style={{ fontSize: 14 }}>비밀번호가 맞지 않습니다.</span>}
          <button
            type="submit"
            style={{ fontSize: 17, fontWeight: 600, padding: "12px", borderRadius: 12, border: 0, background: "var(--blue)", color: "#fff" }}
          >
            들어가기
          </button>
        </form>
      </section>
    </main>
  );
}
