import {NextRequest,NextResponse} from "next/server";
import {supabaseAdmin} from "@/lib/supabaseAdmin";

function token(){return crypto.randomUUID().replaceAll("-","")}
function tracking(){return "EQ-"+Math.floor(1000+Math.random()*9000)}

function normalizePhone(phone:string){
  const digits = String(phone || "").replace(/\D/g,"");
  if(digits.length===10) return "+1"+digits;
  if(digits.length===11 && digits.startsWith("1")) return "+"+digits;
  if(String(phone || "").startsWith("+")) return String(phone);
  return "";
}

async function sendClientSMS(phone:string, name:string, link:string){
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const auth = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const to = normalizePhone(phone);

  if(!sid || !auth || !from || !to) return {skipped:true};

  const body =
`Hi ${name || "there"}, your HELOC CONNECT funding request has been received.

Track your private funding status here:
${link}

If documents are needed, they will appear inside your secure portal.`;

  const params = new URLSearchParams();
  params.append("To", to);
  params.append("From", from);
  params.append("Body", body);

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + Buffer.from(`${sid}:${auth}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  if(!res.ok){
    const err = await res.text();
    console.error("Twilio SMS failed:", err);
    return {error:err};
  }

  return {ok:true};
}

export async function POST(req:NextRequest){
  const b=await req.json(),s=supabaseAdmin();
  const client_token=token(),tracking_id=tracking();

  const{data,error}=await s.from("leads").insert({
    tracking_id,
    client_token,
    first_name:b.first_name||"",
    last_name:b.last_name||"",
    phone:b.phone||"",
    email:b.email||"",
    property_address:b.property_address||"",
    home_value:Number(b.home_value||0),
    credit_score:b.credit_score||"",
    monthly_income:Number(String(b.monthly_income||"0").replace(/[^0-9.]/g,"")),
    requested_cash:Number(String(b.requested_cash||"0").replace(/[^0-9.]/g,"")),
    loan_purpose:b.loan_purpose||"",
    lead_source:"Landing Page / Instagram Ad",
    status:"Application Received"
  }).select().single();

  if(error)return NextResponse.json({error:error.message},{status:500});

  await s.from("lead_notes").insert({
    lead_id:data.id,
    note:"New intake submitted. Private status link created."
  });

  const smartSummary = [
    `Street Address: ${b.street_address || ""}`,
    `Unit: ${b.unit || ""}`,
    `City: ${b.city || ""}`,
    `State: ${b.state || ""}`,
    `ZIP: ${b.zip || ""}`,
    `Mortgage Balance: ${b.mortgage_balance || ""}`,
    `Loans On Property: ${b.loans_on_property || ""}`,
    `Mortgage Good Standing: ${b.mortgage_good_standing || ""}`,
    `Missed Payments Last 6 Months: ${b.missed_payments_6_months || ""}`,
    `Possible Equity Room: ${b.possible_equity_room || ""}`,
    `Estimated Monthly Payment Preview: ${b.estimated_monthly_payment || ""}`,
    `Estimated Max Cashout Payment Preview: ${b.estimated_max_cashout_payment || ""}`
  ].join("\n");

  await s.from("lead_notes").insert({
    lead_id:data.id,
    note:`Smart calculator details:\n${smartSummary}`
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://heloc-connect.vercel.app";
  const statusLink = `${siteUrl}/status/${client_token}`;

  await sendClientSMS(
    b.phone || "",
    b.first_name || "",
    statusLink
  );

  return NextResponse.json({token:client_token,trackingId:tracking_id});
}
