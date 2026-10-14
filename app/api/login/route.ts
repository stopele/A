import { AUTH_COOKIE, authToken } from "@/lib/auth";

export async function POST(req: Request) {
  const form = await req.formData();
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password || form.get("password") !== password) {
    return Response.redirect(new URL("/login?error=1", req.url), 303);
  }
  const res = Response.redirect(new URL("/", req.url), 303);
  const headers = new Headers(res.headers);
  headers.append(
    "Set-Cookie",
    `${AUTH_COOKIE}=${await authToken(password)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 180}`,
  );
  return new Response(null, { status: 303, headers });
}
