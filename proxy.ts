import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, authToken } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) return NextResponse.next();
  if (req.cookies.get(AUTH_COOKIE)?.value === (await authToken(password))) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith("/api/")) return new NextResponse("Unauthorized", { status: 401 });
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  // 로그인 화면, 텔레그램 cron(자체 인증), 아이콘·manifest는 제외
  matcher: ["/((?!login|api/login|api/notify|_next|icon.svg|manifest.webmanifest|favicon.ico).*)"],
};
