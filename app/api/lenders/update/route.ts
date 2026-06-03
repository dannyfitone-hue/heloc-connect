import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getLenderSession } from "@/lib/lenderAuth";
export async function POST(req: NextRequest) {
  const user = await getLenderSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  const s = supabaseAdmin();
  const { data: lead } = await s.from("leads").select("id,assigned_company_id,assigned_user_id").eq("id", b.leadId).single();
  if (!lead || lead.assigned_company_id !== user.company_id || (user.role === "agent" && lead.assigned_user_id !== user.id)) return NextResponse.json({ error: "Lead not assigned to this account." }, { status: 403 });
  const update: any = { status: b.status, updated_at: new Date().toISOString() };
  if (b.fundedAmount !== undefined) update.funded_amount = Number(b.fundedAmount || 0);
  if (b.status === "Funded") update.funded_at = new Date().toISOString();
  const { error } = await s.from("leads").update(update).eq("id", b.leadId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (b.note) await s.from("lead_notes").insert({ lead_id: b.leadId, note: `${user.name} (${user.role}) note: ${b.note}` });
  return NextResponse.json({ ok: true });
}
