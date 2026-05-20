"use client";
import {useState} from "react";import {useRouter} from "next/navigation";import {Shield,Clock,Users,CheckCircle,DollarSign,Star} from "lucide-react";
export default function LandingPage(){const router=useRouter();const[loading,setLoading]=useState(false);async function submitLead(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setLoading(true);const payload=Object.fromEntries(new FormData(e.currentTarget).entries());const res=await fetch("/api/leads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const data=await res.json();if(data?.token)router.push(`/thank-you/${data.token}`);else{alert("Something went wrong.");setLoading(false)}}return <main className="min-h-screen bg-[#03142a] text-white"><section className="relative overflow-hidden bg-cover bg-center" style={{backgroundImage:"linear-gradient(90deg,rgba(2,15,35,.96),rgba(3,20,42,.84),rgba(3,20,42,.35)), url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2200&q=90')"}}><nav className="mx-auto flex max-w-[1500px] items-center justify-between border-b border-white/10 px-6 py-5 backdrop-blur-xl"><div className="flex items-center gap-3 font-black"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500">⌂</div><div><div className="text-2xl leading-none">HELOC</div><div className="mt-1 tracking-[.32em] text-gold">CONNECT</div></div></div><div className="hidden rounded-full border border-gold px-4 py-3 font-black text-gold md:block">Speak With A Funding Specialist</div></nav><div className="mx-auto grid max-w-[1500px] gap-10 px-6 py-12 lg:grid-cols-[1.1fr_.75fr] lg:py-16"><div><div className="gold-flash mb-8 inline-flex items-center gap-4 rounded-3xl border-2 border-gold/80 bg-white/10 px-5 py-4"><div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-yellow-200 via-gold to-yellow-800 text-5xl text-white">★</div><div><div className="text-4xl font-black leading-none text-gold md:text-5xl">TOP-RATED</div><div className="mt-1 text-xl font-black md:text-2xl">FAST HELOC CONNECT</div></div></div><h1 className="max-w-4xl text-5xl font-black uppercase leading-[1.02] tracking-[-.04em] md:text-7xl">Getting Access To Your Home Equity Has Never Been Easier</h1><p className="mt-6 max-w-3xl text-xl font-semibold leading-relaxed text-blue-100 md:text-2xl">Helping homeowners secure maximum funding opportunities with competitive low-rate lender matching, fast funding pathways, and minimum-document approval options.</p><div className="mt-8 grid max-w-4xl gap-4 md:grid-cols-2">{["Maximum cash-out opportunity review","Most cases funded with bank statements","Flexible homeowner scenarios","Fast funding pathways"].map(i=><div key={i} className="glass rounded-2xl p-4 font-black">✅ {i}</div>)}</div><div className="mt-8 grid max-w-5xl overflow-hidden rounded-2xl border border-white/20 bg-[#03142a]/70 md:grid-cols-5">{[[DollarSign,"Maximum Cash-Out"],[Shield,"Competitive Rates"],[CheckCircle,"Higher Approval Paths"],[Clock,"Fast Process"],[Users,"Dedicated Specialists"]].map(([Icon,text]:any)=><div key={text} className="border-white/15 p-5 md:border-r"><Icon className="mb-3 text-blue-400" size={34}/><div className="font-black">{text}</div></div>)}</div></div><div id="apply" className="rounded-3xl border border-white/25 bg-[#03142a]/90 p-7 shadow-2xl backdrop-blur-xl"><h2 className="text-center text-3xl font-black">See What You May Qualify For <span className="text-blue-400">In Minutes</span></h2><div className="mt-5 flex flex-wrap justify-center gap-4 border-b border-white/15 pb-5 text-sm font-bold text-blue-100"><span>✅ No obligation</span><span>🔒 Secure & confidential</span></div><form onSubmit={submitLead} className="mt-6 grid gap-4 md:grid-cols-2"><input className="rounded-xl border border-blue-200/30 bg-white/10 p-4" name="first_name" placeholder="First Name" required/><input className="rounded-xl border border-blue-200/30 bg-white/10 p-4" name="last_name" placeholder="Last Name" required/><input className="rounded-xl border border-blue-200/30 bg-white/10 p-4" name="phone" placeholder="Phone Number" required/><input className="rounded-xl border border-blue-200/30 bg-white/10 p-4" name="email" placeholder="Email Address" type="email" required/><input className="rounded-xl border border-blue-200/30 bg-white/10 p-4 md:col-span-2" name="property_address" placeholder="Property Address"/><select className="rounded-xl border border-blue-200/30 bg-[#0b2445] p-4" name="home_value"><option value="">Estimated Property Value</option><option value="500000">$500k - $750k</option><option value="850000">$750k - $1M</option><option value="1200000">$1M+</option></select><select className="rounded-xl border border-blue-200/30 bg-[#0b2445] p-4" name="credit_score"><option value="">Credit Score Range</option><option>720+</option><option>680-719</option><option>620-679</option><option>580-619</option><option>Under 580</option></select><input className="rounded-xl border border-blue-200/30 bg-white/10 p-4" name="monthly_income" placeholder="Monthly Income"/><input className="rounded-xl border border-blue-200/30 bg-white/10 p-4" name="requested_cash" placeholder="Requested Cash Amount"/><select className="rounded-xl border border-blue-200/30 bg-[#0b2445] p-4 md:col-span-2" name="loan_purpose"><option>HELOC / Home Equity Line</option><option>Cash-Out Refinance</option><option>Home Equity Loan</option><option>Maximum Cash-Out Review</option><option>Pay Down High-Interest Balances</option></select><button disabled={loading} className="rounded-xl bg-gradient-to-b from-yellow-300 to-amber-600 p-5 text-xl font-black text-white shadow-xl md:col-span-2">{loading?"Submitting...":"GET MY MATCHED OPTIONS ›"}</button></form></div></div></section>
      <section className="mx-auto max-w-[1500px] px-6 pb-4">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 text-white shadow-2xl backdrop-blur-xl">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[.35em] text-gold">As Featured In Financial Media</p>
            <h2 className="mt-2 text-2xl font-black md:text-3xl">
              Recognized For Fast HELOC Funding, Competitive Rate Matching & Streamlined Homeowner Approvals
            </h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {["Yahoo Finance", "MarketWatch", "Benzinga", "AP News"].map((brand) => (
              <div
                key={brand}
                className="rounded-2xl border border-white/15 bg-white/10 px-6 py-5 text-center text-2xl font-black tracking-tight text-white shadow-lg transition hover:-translate-y-1 hover:border-gold/70 hover:bg-white/15"
              >
                {brand}
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-5">
            {[
              "Minimum-document pathways",
              "Most cases reviewed with bank statements",
              "Fast lender matching",
              "Flexible homeowner scenarios",
              "Private status portal tracking"
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-[#03142a]/50 p-4 text-center text-sm font-black text-blue-100">
                ✅ {item}
              </div>
            ))}
          </div>
        </div>
      </section>


<section className="mx-auto max-w-[1500px] px-6 py-10"><div className="rounded-3xl bg-white p-8 text-slate-900 shadow-2xl"><h2 className="text-center text-3xl font-black tracking-wide">WHY HOMEOWNERS TRUST OUR PLATFORM</h2><div className="mt-8 grid gap-5 md:grid-cols-3 lg:grid-cols-6">{["Top-rated lender network","Maximum funding opportunity","Competitive rate matching","Flexible homeowner situations","Real-time status dashboard","End-to-end support"].map(item=><div key={item} className="rounded-2xl border border-slate-200 p-5 text-center font-black"><Star className="mx-auto mb-3 text-blue-700"/>{item}</div>)}</div></div></section></main>}
