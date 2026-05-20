"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Clock,
  Users,
  CheckCircle,
  DollarSign,
  Star,
  BadgeCheck,
  Trophy,
  FileCheck,
  TrendingUp,
  Home,
  Zap
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function submitLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const payload = Object.fromEntries(new FormData(e.currentTarget).entries());

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
  }

  return (
    <main className="min-h-screen bg-[#03142a] text-white">
      <section
        className="relative overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(90deg,rgba(2,15,35,.97),rgba(3,20,42,.86),rgba(3,20,42,.42)), url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2200&q=90')"
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(37,99,235,.35),transparent_26%),radial-gradient(circle_at_65%_12%,rgba(245,183,25,.28),transparent_20%)]" />
        <div className="pointer-events-none absolute -left-20 top-32 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-[420px] w-[420px] rounded-full bg-gold/20 blur-3xl" />

        <nav className="relative z-10 mx-auto flex max-w-[1500px] items-center justify-between border-b border-white/10 px-6 py-5 backdrop-blur-xl">
          <div className="flex items-center gap-3 font-black">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 shadow-xl shadow-blue-900/40">HC</div>
            <div>
              <div className="text-2xl leading-none">HELOC</div>
              <div className="mt-1 tracking-[.32em] text-gold">CONNECT</div>
            </div>
          </div>

          <div className="hidden items-center gap-6 font-bold text-blue-100 lg:flex">
            <a href="#featured">Featured</a>
            <a href="#trust">Why Us</a>
            <a href="#apply">Apply</a>
          </div>

          <div className="hidden rounded-full border border-gold bg-gold/10 px-4 py-3 font-black text-gold md:block">
            Speak With A Funding Specialist
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid max-w-[1500px] gap-10 px-6 py-12 lg:grid-cols-[1.08fr_.76fr] lg:py-16">
          <div>
            <div className="mb-5 inline-flex max-w-full items-center gap-4 rounded-3xl border border-gold/60 bg-white px-5 py-4 text-slate-950 shadow-2xl shadow-gold/20">
              <div className="rounded-xl bg-[#6001d2] px-4 py-3 text-3xl font-black text-white">Y!</div>
              <div>
                <div className="text-xs font-black uppercase tracking-[.32em] text-amber-700">As Featured In</div>
                <div className="text-3xl font-black tracking-[-.04em] md:text-4xl">
                  Yahoo <span className="text-[#6001d2]">Finance</span>
                </div>
                <div className="mt-1 text-sm font-bold text-slate-500">
                  Recognized for fast HELOC funding, rate-focused matching & streamlined homeowner approvals
                </div>
                <div className="mt-3 rounded-xl bg-[#eef4ff] px-4 py-3 text-sm font-black text-[#12315c]">
                  We compete for better rates, faster review, and lower-document funding pathways.
                </div>
              </div>
            </div>

            <div className="gold-flash mb-8 inline-flex items-center gap-4 rounded-3xl border-2 border-gold/80 bg-white/10 px-5 py-4 backdrop-blur-xl">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-yellow-200 via-gold to-yellow-800 text-5xl text-white shadow-2xl shadow-gold/30">
                ★
              </div>
              <div>
                <div className="text-4xl font-black leading-none text-gold md:text-5xl">TOP-RATED</div>
                <div className="mt-1 text-xl font-black md:text-2xl">FAST HELOC CONNECT FUNDING</div>
              </div>
            </div>

            <h1 className="max-w-4xl text-5xl font-black uppercase leading-[1.02] tracking-[-.04em] md:text-7xl">
              Getting Access To Your Home Equity Has Never Been Easier
            </h1>

            <p className="mt-6 max-w-3xl text-xl font-semibold leading-relaxed text-blue-100 md:text-2xl">
              Stop waiting weeks for slow banks. HELOC CONNECT is built to help homeowners get a direct funding-pathway answer fast, with competitive rate-focused lender matching, faster funding partners, and minimum-document review options.
            </p>

            <div className="mt-8 grid max-w-4xl gap-4 md:grid-cols-2">
              {[
                "Same-day funding pathway review",
                "Rate-focused lender matching",
                "Minimum docs — often bank statements",
                "Complex homeowner scenarios welcome"
              ].map((i) => (
                <div key={i} className="glass rounded-2xl p-4 font-black shadow-xl">
                  ✅ {i}
                </div>
              ))}
            </div>

            <div className="mt-8 grid max-w-5xl overflow-hidden rounded-2xl border border-white/20 bg-[#03142a]/70 md:grid-cols-5">
              {[
                [DollarSign, "Beat The Slow Bank Process"],
                [Shield, "Rate-Focused Matching"],
                [CheckCircle, "Same-Day Review Path"],
                [Clock, "2x Faster Funding Partners"],
                [Users, "Real Client Support"]
              ].map(([Icon, text]: any) => (
                <div key={text} className="border-white/15 p-5 md:border-r">
                  <Icon className="mb-3 text-blue-400" size={34} />
                  <div className="font-black">{text}</div>
                </div>
              ))}
            </div>
          </div>

          <div id="apply" className="rounded-3xl border border-white/25 bg-[#03142a]/92 p-7 shadow-2xl backdrop-blur-xl">
            <h2 className="text-center text-3xl font-black">
              See What You May Qualify For <span className="text-blue-400">In Minutes</span>
            </h2>
            <div className="mt-5 flex flex-wrap justify-center gap-4 border-b border-white/15 pb-5 text-sm font-bold text-blue-100">
              <span>✅ No obligation</span>
              <span>🔒 Secure & confidential</span>
            </div>

            <form onSubmit={submitLead} className="mt-6 grid gap-4 md:grid-cols-2">
              <input className="rounded-xl border border-blue-200/30 bg-white/10 p-4 outline-none transition focus:border-gold focus:bg-white/15" name="first_name" placeholder="First Name" required />
              <input className="rounded-xl border border-blue-200/30 bg-white/10 p-4 outline-none transition focus:border-gold focus:bg-white/15" name="last_name" placeholder="Last Name" required />
              <input className="rounded-xl border border-blue-200/30 bg-white/10 p-4 outline-none transition focus:border-gold focus:bg-white/15" name="phone" placeholder="Phone Number" required />
              <input className="rounded-xl border border-blue-200/30 bg-white/10 p-4 outline-none transition focus:border-gold focus:bg-white/15" name="email" placeholder="Email Address" type="email" required />
              <input className="rounded-xl border border-blue-200/30 bg-white/10 p-4 outline-none transition focus:border-gold focus:bg-white/15 md:col-span-2" name="property_address" placeholder="Property Address" />
              <select className="rounded-xl border border-blue-200/30 bg-[#0b2445] p-4 outline-none transition focus:border-gold" name="home_value">
                <option value="">Estimated Property Value</option>
                <option value="500000">$500k - $750k</option>
                <option value="850000">$750k - $1M</option>
                <option value="1200000">$1M+</option>
              </select>
              <select className="rounded-xl border border-blue-200/30 bg-[#0b2445] p-4 outline-none transition focus:border-gold" name="credit_score">
                <option value="">Credit Score Range</option>
                <option>720+</option>
                <option>680-719</option>
                <option>620-679</option>
                <option>580-619</option>
                <option>Under 580</option>
              </select>
              <input className="rounded-xl border border-blue-200/30 bg-white/10 p-4 outline-none transition focus:border-gold focus:bg-white/15" name="monthly_income" placeholder="Monthly Income" />
              <input className="rounded-xl border border-blue-200/30 bg-white/10 p-4 outline-none transition focus:border-gold focus:bg-white/15" name="requested_cash" placeholder="Requested Cash Amount" />
              <select className="rounded-xl border border-blue-200/30 bg-[#0b2445] p-4 outline-none transition focus:border-gold md:col-span-2" name="loan_purpose">
                <option>HELOC / Home Equity Line</option>
                <option>Cash-Out Refinance</option>
                <option>Home Equity Loan</option>
                <option>Maximum Cash-Out Review</option>
                <option>Pay Down High-Interest Balances</option>
              </select>
              <button disabled={loading} className="rounded-xl bg-gradient-to-b from-yellow-300 to-amber-600 p-5 text-xl font-black text-white shadow-xl transition hover:-translate-y-1 hover:shadow-gold/30 md:col-span-2">
                {loading ? "Submitting..." : "GET MY MATCHED OPTIONS ›"}
              </button>
            </form>
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-[1500px] px-6 pb-12">
          <div className="grid gap-4 rounded-[2rem] border border-gold/30 bg-white/10 p-5 shadow-2xl backdrop-blur-xl md:grid-cols-4">
            {[
              ["SAME-DAY REVIEW", "Get a direct funding-pathway answer fast — without getting bounced around."],
              ["MINIMUM DOCS", "Many files can begin review with only basic bank statements and homeowner details."],
              ["2X FASTER FUNDING", "Our lender network is built around speed-focused funding and fast follow-up."],
              ["NO TIME WASTING", "Clear next steps, private status tracking, and serious lender matching from the start."]
            ].map(([title, desc]) => (
              <div key={title} className="rounded-3xl border border-white/15 bg-[#03142a]/70 p-5">
                <div className="text-lg font-black text-gold">{title}</div>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-blue-100">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="featured" className="bg-[#071527] px-6 py-10">
        <div className="mx-auto max-w-[1500px] rounded-[2rem] border border-white/10 bg-white/[.06] p-6 shadow-2xl backdrop-blur-xl md:p-9">
          <div className="grid items-center gap-6 lg:grid-cols-[.85fr_1.15fr]">
            <div className="rounded-[1.75rem] border border-gold/40 bg-gradient-to-br from-white to-blue-50 p-7 text-slate-950 shadow-2xl">
              <p className="text-sm font-black uppercase tracking-[.32em] text-amber-700">Featured Financial Media Trust</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="rounded-xl bg-[#6001d2] px-4 py-3 text-3xl font-black text-white">Y!</div>
                <div>
                  <div className="text-4xl font-black tracking-[-.04em] md:text-5xl">
                    Yahoo <span className="text-[#6001d2]">Finance</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-500">Financial media recognition badge</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start gap-3">
                  <BadgeCheck className="mt-1 text-blue-700" />
                  <div>
                    <h3 className="text-xl font-black">Featured For Speed, Rate-Focused Matching & Streamlined Homeowner Funding</h3>
                    <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">
                      HELOC CONNECT is positioned as a modern funding match platform built for homeowners who want a faster, cleaner, and easier path to access equity.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-[.35em] text-gold">Trust, Speed & Client Convenience</p>
              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-.04em] md:text-5xl">
                Why Homeowners Choose Us Before Slow Banks & Traditional Lenders
              </h2>
              <p className="mt-5 max-w-4xl text-lg font-semibold leading-relaxed text-blue-100">
                We are built for homeowners who want speed, low-document review options, competitive lender matching, and a direct answer without wasting weeks in traditional lending delays.
              </p>

              <div className="mt-7 grid gap-4 md:grid-cols-3">
                {[
                  ["★★★★★", "Certified 5-Star Client Experience"],
                  ["TOP CHOICE", "2026 Homeowner Funding Choice"],
                  ["FAST PATH", "Speed-Focused Funding Process"]
                ].map(([top, bottom]) => (
                  <div key={bottom} className="rounded-2xl border border-white/15 bg-white/10 p-5 text-center shadow-xl">
                    <div className="text-2xl font-black text-gold">{top}</div>
                    <div className="mt-2 text-sm font-black text-white">{bottom}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="trust" className="mx-auto max-w-[1500px] px-6 py-10">
        <div className="rounded-3xl bg-white p-8 text-slate-900 shadow-2xl">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[.32em] text-blue-700">Why Homeowners Choose HELOC CONNECT</p>
            <h2 className="mt-2 text-4xl font-black tracking-[-.04em]">Built To Get Homeowners A Faster, Clearer Funding Pathway</h2>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              [Trophy, "2026 Top-Rated Choice", "Positioned for homeowner convenience, speed, support, approval pathways, and funding experience."],
              [Zap, "Same-Day Review Pathway", "Get routed quickly for a direct funding-pathway answer instead of waiting weeks."],
              [FileCheck, "Minimum Document Experience", "Many files can begin with a few bank statements and basic homeowner verification."],
              [TrendingUp, "More Approval Pathways", "Built for clients with hardships, complex income, damaged credit, high balances, or unique scenarios."],
              [Shield, "Rate-Focused Matching", "Our system is designed to connect homeowners with competitive lender options for their situation."],
              [Clock, "2x Faster Funding Partners", "We work with speed-focused lending partners that move faster than traditional bank processes."],
              [Home, "Homeowner Hardship Support", "Cash-flow needs, divorce-related funding, refinance goals, debt pressure, and urgent cash-out reviews."],
              [BadgeCheck, "No Time Wasting", "Clear next steps, private status tracking, and direct lender matching from the moment you submit."]
            ].map(([Icon, title, desc]: any) => (
              <div key={title} className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
                <Icon className="mb-4 text-blue-700" size={36} />
                <h3 className="text-xl font-black">{title}</h3>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
