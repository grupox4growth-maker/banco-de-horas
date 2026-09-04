import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "bh_session";

async function readSession(token: string | undefined) {
  if (!token) return null;
  try {
    const key = new TextEncoder().encode(process.env.SESSION_SECRET);
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return payload as { userId?: string; role?: string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await readSession(req.cookies.get(COOKIE)?.value);

  const isManagerArea =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/employees") ||
    pathname.startsWith("/produtividade") ||
    pathname.startsWith("/rotinas");
  const isEmployeeArea = pathname.startsWith("/me");
  const isProtected = isManagerArea || isEmployeeArea;

  if (isProtected && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isManagerArea && session?.role !== "MANAGER") {
    const url = req.nextUrl.clone();
    url.pathname = "/me";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/employees/:path*", "/produtividade/:path*", "/rotinas/:path*", "/me/:path*"],
};
