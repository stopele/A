// CODEF(금융·공공 데이터 API) 클라이언트.
// 카드매출(여신금융협회), 계좌 내역, 홈택스 세금계산서 조회에 쓴다.
// 상품별 요청 형식과 응답 필드는 CODEF 계정의 API 문서에서 확인한 뒤 매출/계좌/세금 소스에 연결한다.
import { env } from "../config";

let cached: { token: string; expiresAt: number } | null = null;

export function codefConfigured(): boolean {
  return Boolean(env("CODEF_CLIENT_ID") && env("CODEF_CLIENT_SECRET") && env("CODEF_CONNECTED_ID"));
}

async function token(): Promise<string> {
  if (cached && cached.expiresAt > Date.now()) return cached.token;
  const id = env("CODEF_CLIENT_ID");
  const secret = env("CODEF_CLIENT_SECRET");
  if (!id || !secret) throw new Error("CODEF_CLIENT_ID / CODEF_CLIENT_SECRET 미설정");
  const res = await fetch("https://oauth.codef.io/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=read",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`CODEF 토큰 발급 실패: HTTP ${res.status}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: json.access_token, expiresAt: Date.now() + (json.expires_in - 60) * 1000 };
  return cached.token;
}

// CODEF 응답 본문은 URL 인코딩된 JSON으로 온다.
export async function codefRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const host = env("CODEF_API_HOST") ?? "https://development.codef.io";
  const res = await fetch(`${host}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ connectedId: env("CODEF_CONNECTED_ID"), ...body }),
    cache: "no-store",
  });
  const text = await res.text();
  const json = JSON.parse(decodeURIComponent(text.replace(/\+/g, " "))) as {
    result: { code: string; message: string };
    data: T;
  };
  if (json.result.code !== "CF-00000") throw new Error(`CODEF ${json.result.code}: ${json.result.message}`);
  return json.data;
}
