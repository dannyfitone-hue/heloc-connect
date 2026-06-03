import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getLenderSession } from "@/lib/lenderAuth";
export async function GET(req: NextRequest) {
  const user = await getLenderSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const s = supabaseAdmin();
  let query = s.from("leads").select("*").eq("assigned_company_id", user.company_id).order("created_at", { ascending: false });
  if (user.role === "agent") query = query.eq("assigned_user_id", user.id);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ leads: data || [], user });
}
