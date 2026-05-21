"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function submitLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const payload = Object.fromEntries(new FormData(e.currentTarget).entries());

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data?.token) {
        router.push(`/thank-you/${data.token}`);
      } else {
        alert("Something went wrong.");
        setLoading(false);
      }
    } catch {
      alert("Something went wrong.");
      setLoading(false);
    }
  }

  const benefitCards = [
    ["⚡", "Express Approval • Fast Funding"],
    ["📄", "Only 3 Months Bank Statements • No Tax Docs"],
    ["✅", "Lower Credit Scores Welcome"],
    ["⏱️", "No Weeks Of Waiting • Approvals As Fast As 1 Hour"],
    ["💰", "Exclusive Lower-APR Lender Network Access"]
  ];

  return (
    <main className="min-h-screen bg-[#030b13] text-white">
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "radial-gradient(circle at 15% 10%, rgba(69,255,35,.18), transparent 24%), radial-gradient(circle at 80% 18%, rgba(53,126,255,.18), transparent 28%), linear-gradient(135deg,#03070d 0%,#06101d 54%,#02060b 100%)"
        }}
      >
        <div className="absolute inset-0 opacity-[.13] bg-[linear-gradient(rgba(111,255,39,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(111,255,39,.12)_1px,transparent_1px)] bg-[size:55px_55px]" />

        {/* Yahoo Finance feature bar */}
        <div className="relative z-10 px-6 pt-5">
          <div className="mx-auto flex max-w-[1560px] items-center gap-5 rounded-[2rem] border border-[#8b6b23] bg-gradient-to-r from-[#07101f]/95 via-[#102039]/95 to-[#07101f]/95 px-7 py-5 shadow-2xl shadow-black/40">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#a000ff] to-[#4b00c9] text-4xl font-black shadow-2xl shadow-purple-900/50">
              Y!
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black uppercase tracking-[.45em] text-[#f7b733] md:text-sm">
                Featured In
              </div>
              <div className="mt-1 flex flex-col gap-2 md:flex-row md:items-end md:gap-8">
                <div className="text-4xl font-black tracking-[-.06em] md:text-6xl">
                  Yahoo <span className="text-[#9b5cff]">Finance</span>
                </div>
                <p className="pb-2 text-base font-extrabold leading-snug text-blue-100 md:text-xl">
                  Recognized for fast HELOC funding, lower-document pathways & premium homeowner support.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 mx-auto mt-4 flex max-w-[1560px] items-center justify-between border-y border-white/10 bg-black/20 px-6 py-5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="text-4xl text-[#6fff27]">⌂</div>
            <div className="text-3xl font-black tracking-[-.05em]">
              HELOC <span className="text-[#6fff27]">CONNECT</span>
            </div>
          </div>

          <div className="hidden items-center gap-9 text-sm font-black lg:flex">
            <a className="text-[#6fff27]" href="#home">Home</a>
            <a href="#how">How It Works</a>
            <a href="#benefits">Benefits</a>
            <a href="#requirements">Requirements</a>
            <a href="#faqs">FAQs</a>
            <a href="#about">About Us</a>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            <div className="font-black text-white">☎ (888) 892-1101</div>
            <a href="#apply" className="rounded-lg bg-gradient-to-b from-[#8cff24] to-[#4eb800] px-7 py-4 text-sm font-black text-white shadow-lg shadow-[#6fff27]/25">
              Check My Eligibility
            </a>
          </div>
        </nav>

        {/* Hero */}
        <div id="home" className="relative z-10 mx-auto grid max-w-[1560px] gap-10 px-6 py-14 lg:grid-cols-[.92fr_.82fr]">
          <div>
            <h1 className="max-w-4xl text-6xl font-black leading-[1.02] tracking-[-.06em] md:text-8xl">
              The Smartest Way To Access Your <span className="text-[#6fff27]">Home Equity</span>
            </h1>

            <h2 className="mt-7 text-2xl font-black md:text-3xl">
              Fast Approvals. Low Rates. More Options.
            </h2>

            <p className="mt-5 max-w-3xl text-xl font-semibold leading-relaxed text-slate-200">
              At HELOC CONNECT, we simplify the process with fewer documents, flexible credit-score options, and a network of lenders offering better rate pathways than traditional banks.
            </p>

            <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center">
              <a href="#apply" className="inline-flex items-center justify-center rounded-lg bg-gradient-to-b from-[#8cff24] to-[#4eb800] px-9 py-5 text-xl font-black text-white shadow-xl shadow-[#6fff27]/25">
                Check My Eligibility →
              </a>
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-full border border-[#6fff27]/50 bg-[#6fff27]/10 text-2xl shadow-lg shadow-[#6fff27]/20">🔒</div>
                <div className="text-sm font-bold leading-relaxed text-slate-200">
                  Secure • Private • No Impact<br />To Your Credit Score
                </div>
              </div>
            </div>
          </div>

          <div id="apply" className="rounded-[2rem] border border-[#6fff27]/55 bg-black/35 p-7 shadow-2xl shadow-[#6fff27]/10 backdrop-blur-xl">
            <div
              className="mb-6 rounded-[1.5rem] border border-[#6fff27]/45 bg-cover bg-center p-7 shadow-2xl"
              style={{
                backgroundImage:
                  "linear-gradient(90deg,rgba(2,8,15,.96),rgba(2,8,15,.72)),url('https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=90')"
              }}
            >
              <div className="text-2xl font-black uppercase">Tap Into Your Equity</div>
              <div className="mt-5 text-xl font-black text-slate-300">UP TO</div>
              <div className="mt-1 text-6xl font-black tracking-[-.06em] text-[#6fff27] md:text-7xl">$500,000+</div>
              <div className="mt-6 h-1 w-20 rounded-full bg-[#6fff27]" />
              <p className="mt-6 max-w-md text-lg font-semibold leading-relaxed text-slate-200">
                Use your funds for renovations, debt consolidation, investments, emergencies, and more.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-[#06101d]/90 p-5">
              <h3 className="text-center text-2xl font-black">
                See What You May Qualify For <span className="text-[#6fff27]">In Minutes</span>
              </h3>
              <div className="mt-3 border-b border-white/10 pb-4 text-center text-sm font-bold text-slate-300">
                ✅ No obligation &nbsp; 🔒 Secure & confidential
              </div>

              <form onSubmit={submitLead} className="mt-5 grid gap-3 md:grid-cols-2">
                <input className="rounded-xl border border-white/15 bg-white/10 p-4 text-white placeholder:text-slate-300 outline-none focus:border-[#6fff27]" name="first_name" placeholder="First Name" required />
                <input className="rounded-xl border border-white/15 bg-white/10 p-4 text-white placeholder:text-slate-300 outline-none focus:border-[#6fff27]" name="last_name" placeholder="Last Name" required />
                <input className="rounded-xl border border-white/15 bg-white/10 p-4 text-white placeholder:text-slate-300 outline-none focus:border-[#6fff27]" name="phone" placeholder="Phone Number" required />
                <input className="rounded-xl border border-white/15 bg-white/10 p-4 text-white placeholder:text-slate-300 outline-none focus:border-[#6fff27]" name="email" type="email" placeholder="Email Address" required />
                <input className="rounded-xl border border-white/15 bg-white/10 p-4 text-white placeholder:text-slate-300 outline-none focus:border-[#6fff27] md:col-span-2" name="property_address" placeholder="Property Address" />
                <select className="rounded-xl border border-white/15 bg-[#0a1d35] p-4 text-white outline-none focus:border-[#6fff27]" name="home_value">
                  <option value="">Estimated Property Value</option>
                  <option value="500000">$500k - $750k</option>
                  <option value="850000">$750k - $1M</option>
                  <option value="1200000">$1M+</option>
                </select>
                <select className="rounded-xl border border-white/15 bg-[#0a1d35] p-4 text-white outline-none focus:border-[#6fff27]" name="credit_score">
                  <option value="">Credit Score Range</option>
                  <option>720+</option>
                  <option>680-719</option>
                  <option>620-679</option>
                  <option>580-619</option>
                  <option>Under 580</option>
                </select>
                <input className="rounded-xl border border-white/15 bg-white/10 p-4 text-white placeholder:text-slate-300 outline-none focus:border-[#6fff27]" name="monthly_income" placeholder="Monthly Income" />
                <input className="rounded-xl border border-white/15 bg-white/10 p-4 text-white placeholder:text-slate-300 outline-none focus:border-[#6fff27]" name="requested_cash" placeholder="Requested Cash Amount" />
                <select className="rounded-xl border border-white/15 bg-[#0a1d35] p-4 text-white outline-none focus:border-[#6fff27] md:col-span-2" name="loan_purpose">
                  <option>HELOC / Home Equity Line</option>
                  <option>Cash-Out Refinance</option>
                  <option>Home Equity Loan</option>
                  <option>Pay Down High-Interest Balances</option>
                </select>
                <button disabled={loading} className="rounded-xl bg-gradient-to-b from-[#8cff24] to-[#4eb800] p-4 text-lg font-black sm:p-5 sm:text-xl text-white shadow-xl shadow-[#6fff27]/25 transition hover:-translate-y-1 md:col-span-2">
                  {loading ? "Submitting..." : "GET MY MATCHED OPTIONS ›"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Neon benefit cards */}
        <div id="benefits" className="relative z-10 mx-auto max-w-[1560px] px-6 pb-12">
          <div className="grid gap-5 md:grid-cols-5">
            {benefitCards.map(([icon, title]) => (
              <div key={title} className="neon-benefit rounded-[1.6rem] border border-[#6fff27]/75 bg-black/25 p-6 text-center shadow-2xl backdrop-blur-xl">
                <div className="mb-4 text-5xl">{icon}</div>
                <div className="mx-auto max-w-[210px] text-2xl font-black leading-tight text-white">
                  {title}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 flex items-center gap-6 rounded-2xl border border-white/15 bg-black/25 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
            <div className="text-5xl text-[#6fff27]">🛡️</div>
            <p className="text-xl font-semibold leading-relaxed text-slate-200">
              <span className="font-black text-[#6fff27]">HELOC CONNECT</span> is built for homeowners who want faster approvals, fewer documents, lower APR options, flexible credit-score pathways, and direct lender access without traditional bank delays.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#06101f] px-6 py-14">
        <div className="mx-auto max-w-[1560px] rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-[#0b1d36] via-[#071527] to-[#050b14] p-8 shadow-2xl md:p-12">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[.35em] text-[#6fff27]">Why Homeowners Choose HELOC CONNECT</p>
            <h2 className="mx-auto mt-4 max-w-5xl text-3xl font-black leading-tight tracking-[-.04em] sm:text-4xl md:text-5xl lg:text-6xl">
              Built For Homeowners Who Want Faster Answers, Less Paperwork & Premium Funding Pathways
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              ["🏆", "2026 Top-Rated Choice", "Positioned for homeowner convenience, speed, support, approval pathways, and premium funding experience."],
              ["⚡", "Approvals As Fast As 1 Hour", "Get routed quickly for a direct approval-pathway answer instead of waiting weeks."],
              ["📄", "Only 3 Months Bank Statements", "No tax docs needed in many cases — start with only 3 months of bank statements."],
              ["✅", "Lower Credit Scores Welcome", "Flexible lender pathways for lower credit scores, hardships, complex income, and unique homeowner scenarios."],
              ["💰", "Exclusive Lower-APR Network", "Access lower-APR lender options outside many traditional banks and mortgage company pathways."],
              ["⏱️", "No Weeks Of Waiting", "Clear next steps, private status tracking, and direct lender matching from the moment you submit."]
            ].map(([icon, title, desc]) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-white/[.055] p-5 shadow-2xl backdrop-blur-xl sm:p-6 transition hover:-translate-y-1 hover:border-[#6fff27]/70">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#6fff27]/40 bg-[#6fff27]/10 text-3xl">
                  {icon}
                </div>
                <h3 className="text-2xl font-black text-[#6fff27]">{title}</h3>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-blue-100">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
