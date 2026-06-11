import { supabaseAdmin } from "@/lib/supabase";
import { CLIENT_STATUSES, money } from "@/lib/statuses";

async function getLeads() {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin.from("leads").select("*").order("created_at", { ascending: false }).limit(200);
  return data || [];
}

export default async function LenderPage() {
  const leads: any[] = await getLeads();
  return (
    <main className="min-h-screen bg-[#06111f] px-5 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <a href="/" className="text-sm font-black text-[#f6c15a]">← HELOC CONNECT</a>
        <h1 className="mt-5 text-4xl font-black">Lender / Agent Portal</h1>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[900px] border-collapse bg-[#071421] text-sm">
            <thead><tr className="bg-black/30 text-left"><th className="p-4">Client</th><th className="p-4">Request</th><th className="p-4">Status</th></tr></thead>
            <tbody>
              {leads.length === 0 ? <tr><td className="p-4" colSpan={3}>No assigned leads yet.</td></tr> : leads.map((l) => (
                <tr key={l.id} className="border-t border-white/10">
                  <td className="p-4 font-black">{l.first_name} {l.last_name}<br/><span className="font-normal text-white/60">{l.phone}<br/>{l.email}</span></td>
                  <td className="p-4">Requested: {money(l.requested_amount)}<br/>Home: {money(l.home_value)}</td>
                  <td className="p-4">
                    <form action="/api/owner/update-status" method="post">
                      <input type="hidden" name="leadId" value={l.id}/>
                      <select name="status" defaultValue={l.status} className="w-full rounded-xl bg-[#06101d] p-3">
                        {CLIENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                      <button className="mt-2 rounded-xl bg-[#f6c15a] px-4 py-2 font-black text-[#06111f]">Update</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
