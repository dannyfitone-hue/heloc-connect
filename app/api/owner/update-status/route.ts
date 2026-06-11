import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  const form = await req.formData();
  const leadId = String(form.get("leadId"));
  const status = String(form.get("status"));
  if (!supabaseAdmin) return NextResponse.redirect(new URL("/owner?error=supabase", req.url), 303);
  await supabaseAdmin.from("leads").update({ status, updated_at: new Date().toISOString() }).eq("id", leadId);
  return NextResponse.redirect(new URL(req.headers.get("referer") || "/owner", req.url), 303);
}
