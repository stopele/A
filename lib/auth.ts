// DASHBOARD_PASSWORD 가 설정되어 있으면 로그인한 사람만 대시보드를 볼 수 있다.
export const AUTH_COOKIE = "dashboard_auth";

export async function authToken(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`store-dashboard:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
