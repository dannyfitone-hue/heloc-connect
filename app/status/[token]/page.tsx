import { supabaseAdmin } from "@/lib/supabase";
import { CLIENT_STATUSES, money } from "@/lib/statuses";

async function getLead(token: string) {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin.from("leads").select("*").eq("token", token).single();
  return data;
}

export default async function StatusPage({ params }: { params: { token: string } }) {
  const lead: any = await getLead(params.token);
  const current = lead?.status || "Application Received";
  return (
    <main className="min-h-screen bg-[#06111f] px-5 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <a href="/" className="text-sm font-black text-[#f6c15a]">← HELOC CONNECT</a>
        <h1 className="mt-5 text-4xl font-black">Welcome, {lead?.first_name || "Client"}</h1>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-[#071421] p-6">
            <h2 className="text-2xl font-black">Current Status</h2>
            <div className="mt-4 space-y-3">
              {CLIENT_STATUSES.slice(0,7).map((s, i) => (
                <div key={s} className={`rounded-2xl border p-4 ${s === current ? "border-[#f6c15a] bg-[#f6c15a]/10" : "border-white/10 bg-white/[.04]"}`}>
                  <strong>{i + 1}. {s}</strong>
                  <p className="text-sm text-white/60">{s === current ? "Current step" : "Pending"}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-[#071421] p-6">
            <h2 className="text-2xl font-black">Application Snapshot</h2>
            <p className="mt-4">Requested Amount: <strong>{money(lead?.requested_amount)}</strong></p>
            <p>Home Value: <strong>{money(lead?.home_value)}</strong></p>
            <p>Estimated Equity Room: <strong>{money(lead?.equity_room)}</strong></p>
          </div>
        </div>
      </div>
    </main>
  );
}
