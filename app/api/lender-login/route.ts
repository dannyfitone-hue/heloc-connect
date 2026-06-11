import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const form = await req.formData();
  const password = String(form.get("password") || "");
  const next = String(form.get("next") || "/lender");
  const configured = process.env.LENDER_DASHBOARD_PASSWORD || process.env.OWNER_DASHBOARD_PASSWORD || "";

  if (!configured || password !== configured) {
    return NextResponse.redirect(new URL(`/lender-login?error=1&next=${encodeURIComponent(next)}`, req.url), 303);
  }

  const res = NextResponse.redirect(new URL(next, req.url), 303);
  res.cookies.set("hc_lender_session", password, { httpOnly: true, path: "/", sameSite: "lax", secure: true });
  return res;
}
