import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const form = await req.formData();
  const password = String(form.get("password") || "");
  const next = String(form.get("next") || "/owner");
  const configured = process.env.OWNER_DASHBOARD_PASSWORD || "";

  if (!configured || password !== configured) {
    return NextResponse.redirect(new URL(`/owner-login?error=1&next=${encodeURIComponent(next)}`, req.url), 303);
  }

  const res = NextResponse.redirect(new URL(next, req.url), 303);
  res.cookies.set("hc_owner_auth", password, { httpOnly: true, path: "/", sameSite: "lax", secure: true });
  return res;
}
