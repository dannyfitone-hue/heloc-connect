import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function makeToken() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function numberValue(v: any) {
  return Number(String(v || "").replace(/[^0-9.]/g, "")) || 0;
}

export async function POST(req: Request) {
  const body = await req.json();
  const token = makeToken();

  if (!supabaseAdmin) {
    return NextResponse.json({ token, warning: "Supabase not configured. Demo token created." });
  }

  const lead = {
    token,
    first_name: body.first_name,
    last_name: body.last_name,
    phone: body.phone,
    email: body.email,
    address: body.property_address || body.street_address,
    city: body.city,
    state: body.state,
    zip: body.zip,
    home_value: numberValue(body.home_value),
    mortgage_balance: numberValue(body.mortgage_balance),
    requested_amount: numberValue(body.requested_cash),
    equity_room: numberValue(body.possible_equity_room),
    estimated_payment: numberValue(body.estimated_monthly_payment),
    loans_on_property: body.loans_on_property,
    credit_score: body.credit_score,
    income: numberValue(body.monthly_income),
    mortgage_standing: body.mortgage_good_standing,
    missed_payments: body.missed_payments_6_months,
    goal: body.loan_purpose,
    status: "Application Received",
    notes: "Lead submitted from HELOC CONNECT smart calculator."
  };

  const { data, error } = await supabaseAdmin.from("leads").insert(lead).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/send-sms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: body.phone,
        name: body.first_name,
        link: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.helocconnect.com"}/status/${token}`
      })
    });
  } catch {}

  return NextResponse.json({ token, lead: data });
}
