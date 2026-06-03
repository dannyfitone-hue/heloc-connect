"use client";
import {useEffect,useMemo,useState} from "react";
import {clientStatuses} from "@/lib/status";

function money(n:any){return `$${Number(n||0).toLocaleString()}`}

export default function LenderPortal(){
  const[leads,setLeads]=useState<any[]>([]),[user,setUser]=useState<any>(null),[selectedId,setSelectedId]=useState(""),[status,setStatus]=useState("Application Being Processed"),[fundedAmount,setFundedAmount]=useState(""),[note,setNote]=useState(""),[error,setError]=useState("");
  async function load(){
    const res=await fetch("/api/lenders/leads");
    if(res.status===401){window.location.href="/lender-login";return;}
    const data=await res.json();
    if(!res.ok){setError(data.error||"Unable to load leads.");return;}
    setLeads(data.leads||[]);setUser(data.user||null);if(!selectedId&&data.leads?.[0])setSelectedId(data.leads[0].id)
  }
  useEffect(()=>{load()},[]);
  const selected=useMemo(()=>leads.find(l=>l.id===selectedId),[leads,selectedId]);
  useEffect(()=>{if(selected){setStatus(selected.status||"Application Being Processed");setFundedAmount(String(selected.funded_amount||""))}},[selectedId,selected]);
  const stats=useMemo(()=>({received:leads.length,funded:leads.filter(l=>l.status==="Funded").length,totalFunded:leads.reduce((s,l)=>s+Number(l.funded_amount||0),0),pending:leads.filter(l=>l.status!=="Funded"&&l.status!=="Declined").length}),[leads]);
  async function update(){
    const res=await fetch("/api/lenders/update",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({leadId:selectedId,status,fundedAmount:Number(fundedAmount||0),note})});
    const data=await res.json().catch(()=>({}));
    if(!res.ok){alert(data.error||"Could not update lead.");return;}
    setNote("");await load();
  }
  async function logout(){await fetch("/api/lenders/logout",{method:"POST"});window.location.href="/lender-login"}
  return <main className="min-h-screen overflow-x-hidden bg-slate-50"><header className="border-b bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><div className="font-black"><span className="text-blue-700">HELOC CONNECT</span> Lender Portal</div><button onClick={logout} className="rounded-xl bg-slate-900 px-4 py-2 font-black text-white">Logout</button></div></header><div className="mx-auto w-full max-w-7xl px-5 py-7">
    <section className="rounded-[1.4rem] bg-gradient-to-br from-navy to-[#132946] p-6 text-white"><p className="text-sm font-black tracking-[.25em] text-amber-300">{user?.mortgage_companies?.name || "Mortgage Company"}</p><h1 className="mt-2 text-3xl font-black">Lead Dashboard</h1><p className="mt-2 text-blue-100">View leads assigned by HELOC CONNECT, update status, and report funded volume.</p></section>
    {error&&<div className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}
    <div className="mt-5 grid gap-4 md:grid-cols-4"><Kpi label="Leads Received" value={stats.received}/><Kpi label="Pending" value={stats.pending}/><Kpi label="Funded Deals" value={stats.funded}/><Kpi label="Total Funded Volume" value={money(stats.totalFunded)}/></div>
    <div className="mt-5 grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><section className="rounded-[1.4rem] border bg-white p-6 shadow"><h2 className="text-2xl font-black">Assigned Leads</h2><select className="mt-4 w-full rounded-xl border p-3" value={selectedId} onChange={e=>setSelectedId(e.target.value)}>{leads.map(lead=><option key={lead.id} value={lead.id}>{lead.tracking_id} - {lead.first_name} {lead.last_name}</option>)}</select>{selected&&<div className="mt-5 space-y-2 rounded-2xl bg-slate-50 p-5"><Info label="Name" value={`${selected.first_name} ${selected.last_name}`}/><Info label="Phone" value={selected.phone}/><Info label="Email" value={selected.email}/><Info label="Goal" value={selected.loan_purpose}/><Info label="Credit" value={selected.credit_score}/><Info label="Requested" value={money(selected.requested_cash)}/><Info label="Funded" value={money(selected.funded_amount)}/></div>}</section>
    <section className="rounded-[1.4rem] border bg-white p-6 shadow"><h2 className="text-2xl font-black">Update Lead</h2>{selected?<><label className="mt-4 block text-xs font-black text-slate-500">Status</label><select className="mt-2 w-full rounded-xl border p-3" value={status} onChange={e=>setStatus(e.target.value)}>{clientStatuses.map(s=><option key={s}>{s}</option>)}</select><label className="mt-4 block text-xs font-black text-slate-500">Funded Amount</label><input className="mt-2 w-full rounded-xl border p-3" value={fundedAmount} onChange={e=>setFundedAmount(e.target.value)} placeholder="Funded amount"/><label className="mt-4 block text-xs font-black text-slate-500">Note</label><textarea className="mt-2 min-h-28 w-full rounded-xl border p-3" value={note} onChange={e=>setNote(e.target.value)} placeholder="Add update note"/><button onClick={update} className="mt-4 w-full rounded-xl bg-blue-700 p-4 font-black text-white">Save Update</button></>:<p className="mt-4 text-slate-500">No assigned leads yet.</p>}</section></div>
    <section className="mt-5 rounded-[1.4rem] border bg-white p-6 shadow"><h2 className="text-2xl font-black">Funding Report</h2><div className="mt-4 overflow-auto"><table className="w-full min-w-[900px] text-left"><thead className="bg-slate-100 text-xs font-black uppercase text-slate-500"><tr><th className="p-3">Lead</th><th className="p-3">Status</th><th className="p-3">Goal</th><th className="p-3">Requested</th><th className="p-3">Funded</th><th className="p-3">Created</th></tr></thead><tbody>{leads.map(l=><tr className="border-b" key={l.id}><td className="p-3 font-bold">{l.tracking_id}<br/>{l.first_name} {l.last_name}</td><td className="p-3">{l.status}</td><td className="p-3">{l.loan_purpose}</td><td className="p-3">{money(l.requested_cash)}</td><td className="p-3 font-black">{money(l.funded_amount)}</td><td className="p-3">{new Date(l.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div></section>
  </div></main>
}
function Kpi({label,value}:{label:string,value:any}){return <div className="rounded-[1.4rem] border bg-white p-5 shadow"><p className="text-sm font-black text-slate-500">{label}</p><b className="mt-1 block text-2xl">{value}</b></div>}
function Info({label,value}:{label:string,value:any}){return <div className="flex justify-between gap-4 border-b pb-2"><span className="font-bold text-slate-500">{label}</span><b className="text-right">{value || "—"}</b></div>}
