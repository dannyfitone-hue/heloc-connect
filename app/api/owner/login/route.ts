import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "hc_owner_auth";
const DEFAULT_OWNER_PASSWORD = "DannyHC2026!";
function getOwnerPassword() {
  return (process.env.OWNER_DASHBOARD_PASSWORD || process.env.OWNER_PASSWORD || process.env.DASHBOARD_PASSWORD || DEFAULT_OWNER_PASSWORD).trim();
}

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const configuredPassword = getOwnerPassword();

  if (password !== configuredPassword) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, configuredPassword, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
