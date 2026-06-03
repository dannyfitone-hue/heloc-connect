import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "hc_owner_auth";

function isProtected(pathname: string) {
  return (
    pathname.startsWith("/owner") ||
    pathname.startsWith("/lender") ||
    pathname.startsWith("/api/owner") ||
    pathname.startsWith("/api/documents/request")
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the login screen and login/logout APIs.
  if (
    pathname.startsWith("/owner-login") ||
    pathname.startsWith("/api/owner/login") ||
    pathname.startsWith("/api/owner/logout")
  ) {
    return NextResponse.next();
  }

  if (!isProtected(pathname)) return NextResponse.next();

  const configuredPassword = process.env.OWNER_DASHBOARD_PASSWORD;
  const cookieValue = req.cookies.get(COOKIE_NAME)?.value;

  // If the password is not configured, keep the dashboard locked instead of exposing lead data.
  if (!configuredPassword || cookieValue !== configuredPassword) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/owner-login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/owner/:path*", "/lender/:path*", "/api/owner/:path*", "/api/documents/request/:path*"],
};
