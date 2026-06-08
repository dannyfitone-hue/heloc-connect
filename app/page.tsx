"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [addressResults, setAddressResults] = useState<any[]>([]);
  const [addressSearching, setAddressSearching] = useState(false);
  const [addressSelected, setAddressSelected] = useState(false);

  const [addressLookupStatus, setAddressLookupStatus] = useState("Start typing your property address");
  const [valueLookupStatus, setValueLookupStatus] = useState("");

  const [street, setStreet] = useState("");
  const [unit, setUnit] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [zip, setZip] = useState("");
  const [homeValueInput, setHomeValueInput] = useState("");
  const [mortgageBalanceInput, setMortgageBalanceInput] = useState("");
  const [requestedCashInput, setRequestedCashInput] = useState("");
  const [loansCount, setLoansCount] = useState("");
  const [goodStanding, setGoodStanding] = useState("");
  const [missedPayments, setMissedPayments] = useState("");

  function moneyNumber(value: string) {
    return Number(String(value || "").replace(/[^0-9.]/g, "")) || 0;
  }

  function formatMoney(value: number) {
    if (!value || value < 0) return "$0";
    return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }

  function formatCurrencyDisplay(value: string) {
    const n = moneyNumber(value);
    if (!n) return "";
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }

  const homeValue = moneyNumber(homeValueInput);
  const mortgageBalance = moneyNumber(mortgageBalanceInput);
  const requestedCash = moneyNumber(requestedCashInput);

  const possibleRoom = useMemo(() => {
    if (!homeValue || !mortgageBalance) return 0;
    return Math.max(0, Math.round(homeValue * 0.85 - mortgageBalance));
  }, [homeValue, mortgageBalance]);

  const paymentPreview = useMemo(() => {
    if (!requestedCash) return 0;
    const monthlyRate = 0.053 / 12;
    const months = 240;
    return Math.round((requestedCash * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months)));
  }, [requestedCash]);

  const maxCashOutPaymentPreview = useMemo(() => {
    if (!possibleRoom) return 0;
    const monthlyRate = 0.053 / 12;
    const months = 240;
    return Math.round((possibleRoom * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months)));
  }, [possibleRoom]);

  const smartAddressSuggestions = [
    "123 Main St, Irvine, CA 92618",
    "123 Main St, Lake Forest, CA 92630",
    "123 Main Ave, Anaheim, CA 92805",
    "123 Main Street, Los Angeles, CA 90012"
  ];
  function parseAddressParts(fullAddress: string) {
    const parts = fullAddress.split(",").map((p) => p.trim());
    const streetLine = parts[0] || fullAddress;
    const cityLine = parts[1] || "";
    const stateZip = parts[2] || "";
    const stateZipParts = stateZip.split(" ").filter(Boolean);
    return {
      streetLine,
      cityLine,
      stateLine: stateZipParts[0] || "",
      zipLine: stateZipParts[1] || ""
    };
  }

  async function searchAddresses(query: string) {
    setStreet(query);
    setAddressSelected(false);

    if (!query || query.trim().length < 3) {
      setAddressResults([]);
      setAddressLookupStatus("Type at least 3 characters to search address");
      return;
    }

    try {
      setAddressSearching(true);
      setAddressLookupStatus("Searching matching addresses...");
      const res = await fetch(`/api/address-autocomplete?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setAddressResults(data?.results || []);
      setAddressLookupStatus(data?.results?.length ? "Select your address below" : (data?.message || "No address matches yet"));
    } catch (error) {
      setAddressResults([]);
      setAddressLookupStatus("Address search temporarily unavailable");
    } finally {
      setAddressSearching(false);
    }
  }

  function selectAddress(result: any) {
    const label = result?.label || "";
    const parsed = parseAddressParts(label);
    const streetLine = result?.street || parsed.streetLine;
    const cityLine = result?.city || parsed.cityLine;
    const stateLine = result?.state || parsed.stateLine;
    const zipLine = result?.zip || parsed.zipLine;

    setStreet(streetLine);
    setCity(cityLine);
    setStateName(stateLine);
    setZip(zipLine);
    setAddressResults([]);
    setAddressSelected(true);
    setAddressLookupStatus("Address selected and auto-filled");

    lookupHomeValue(label || `${streetLine}, ${cityLine}, ${stateLine} ${zipLine}`);
  }

  async function lookupHomeValue(fullAddress: string) {
    try {
      setValueLookupStatus("Looking up estimated home value...");
      const res = await fetch("/api/property-value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: fullAddress })
      });

      const data = await res.json();

      if (data?.value) {
        setHomeValueInput(String(data.value));
        setValueLookupStatus(
          data.source === "assessed_fallback"
            ? `Assessed value found: ${formatMoney(Number(data.value))}. You can update to current market value.`
            : `Estimated market value found: ${formatMoney(Number(data.value))}`
        );
      } else {
        setValueLookupStatus(data?.message || "Home value lookup needs property data API activation.");
      }
    } catch (error) {
      setValueLookupStatus("Home value lookup is not connected yet.");
    }
  }

  function buildFullAddress() {
    return `${street}${unit ? " " + unit : ""}, ${city}, ${stateName} ${zip}`.replace(/\s+/g, " ").trim();
  }

  function tryManualHomeValueLookup() {
    const fullAddress = buildFullAddress();
    if (street && city && stateName && zip) {
      lookupHomeValue(fullAddress);
    }
  }


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
        router.push(`/status/${data.token}`);
      } else {
        alert(data?.error ? `Application submit failed: ${data.error}` : "Something went wrong.");
        setLoading(false);
      }
    } catch {
      alert("Something went wrong.");
      setLoading(false);
    }
  }

  const trustCards = [
    ["🔐", "SSL Secured Website", "Encrypted HTTPS connection helps protect information submitted through HELOC CONNECT."],
    ["🛡️", "Client Protection Shield", "We help homeowners avoid bad-fit companies, unwanted products, and unrealistic expectations."],
    ["💚", "100% Free To Homeowners", "No consultation fee, matching fee, or hidden HELOC CONNECT charge."],
    ["🚫", "No SSN • No Credit Check", "No Social Security Number is required and this initial request does not pull credit."],
  ];

  const securityBadges = [
    ["🔐", "SSL Secured", "Encrypted website connection"],
    ["🛡️", "Privacy Protected", "Secure homeowner intake"],
    ["🚫", "No SSN Required", "Initial review only"],
    ["📉", "No Credit Check", "No impact to credit score"],
    ["💚", "100% Free", "Homeowners pay nothing"],
    ["🏠", "Property Data Powered", "Address-based value preview"],
    ["📁", "Secure Upload Portal", "Docs appear only when requested"],
    ["🤝", "Selected Network", "Carefully reviewed companies"],
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#06111f] pb-20 text-white md:pb-0">
      <section className="relative overflow-hidden bg-[#07101c]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_8%,rgba(246,190,78,.18),transparent_30%),linear-gradient(135deg,#07101c_0%,#071421_48%,#030812_100%)]" />

        <nav className="relative z-20 border-b border-white/10 bg-[#06101d]/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1540px] items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <a href="#home" className="flex shrink-0 items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[#d9a94e]/60 bg-[#0a1727] text-[#f6c15a]">⌂</div>
              <div className="leading-none">
                <div className="text-2xl font-black tracking-[-.04em]">HELOC</div>
                <div className="text-[11px] font-black uppercase tracking-[.45em] text-[#f6c15a]">Connect</div>
                <div className="mt-1 hidden text-[9px] font-black uppercase tracking-[.18em] text-white/55 sm:block">Lower payments. Smarter options.</div>
              </div>
            </a>

            <div className="hidden items-center gap-5 text-sm font-black text-white/90 lg:flex xl:gap-7">
              <a href="#home" className="text-[#f6c15a] underline decoration-[#f6c15a] underline-offset-8">Home</a>
              <a href="#how" className="hover:text-[#f6c15a]">How It Works</a>
              <a href="#network" className="hover:text-[#f6c15a]">Our Network</a>
              <a href="#protection" className="hover:text-[#f6c15a]">Protection Shield</a>
              <a href="#trust" className="hover:text-[#f6c15a]">Trust & Security</a>
              <a href="#solutions" className="hover:text-[#f6c15a]">Solutions</a>
              <a href="#reviews" className="hover:text-[#f6c15a]">Reviews</a>
              <a href="/about" className="hover:text-[#f6c15a]">About Us</a>
            </div>

            <a href="#apply" className="rounded-2xl bg-gradient-to-b from-[#ffd36d] to-[#d89425] px-4 py-3 text-sm font-black text-[#07101c] shadow-lg shadow-[#d89425]/25 sm:px-6">
              Get Started Free →
            </a>
          </div>

          <div className="border-t border-white/10 bg-[#06101d]/98 px-4 pb-3 lg:hidden">
            <div className="mx-auto flex max-w-[1540px] gap-2 overflow-x-auto pt-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[
                ['Home', '#home'],
                ['How It Works', '#how'],
                ['Our Network', '#network'],
                ['Protection', '#protection'],
                ['Trust', '#trust'],
                ['Solutions', '#solutions'],
                ['Reviews', '#reviews'],
                ['About Us', '/about'],
              ].map(([label, href]) => (
                <a key={label} href={href} className="shrink-0 rounded-full border border-white/10 bg-white/[.06] px-4 py-2 text-xs font-black text-white/90">{label}</a>
              ))}
            </div>
          </div>
        </nav>

        <section id="home" className="relative z-10 mx-auto max-w-[1540px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[#081421] shadow-2xl shadow-black/40 sm:rounded-[34px]">
            <div className="absolute inset-0 bg-gradient-to-r from-[#06101d] via-[#06101d]/78 to-[#06101d]/20" />
            <img src="/heloc-office-consultation.png" alt="HELOC CONNECT consultation office with homeowners and specialist" className="absolute inset-y-0 right-0 h-full w-full object-cover object-center opacity-70 lg:w-[68%] lg:opacity-95" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06101d] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#06101d] lg:via-[#06101d]/78 lg:to-transparent" />

            <div className="relative z-10 grid min-h-[620px] gap-6 p-5 sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10 xl:p-14">
              <div className="flex flex-col justify-center">
                <div className="inline-flex w-fit rounded-full border border-[#d9a94e]/70 bg-[#06101d]/70 px-4 py-2 text-[11px] font-black uppercase tracking-[.28em] text-[#f7c35e] sm:text-xs">
                  Find your best mortgage option
                </div>
                <h1 className="mt-5 max-w-[690px] text-[42px] font-black leading-[.92] tracking-[-.065em] text-white sm:text-6xl lg:text-7xl">
                  Lower Your Payment.
                  <span className="block bg-gradient-to-r from-[#f6c15a] via-[#ffe7a3] to-white bg-clip-text text-transparent">Access Your Equity.</span>
                </h1>
                <p className="mt-5 max-w-[620px] text-base font-bold leading-relaxed text-white/88 sm:text-xl">
                  HELOC CONNECT helps homeowners explore HELOC and refinance options, lower monthly payments, and access equity through carefully selected mortgage companies in our network.
                </p>

                <div className="mt-6 grid gap-2 text-sm font-black text-white/95 sm:grid-cols-2 sm:text-base">
                  {['Lower monthly payments','Access home equity','Refinance options','HELOC options','Compare selected mortgage companies','100% free to homeowners'].map((item) => (
                    <div key={item} className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#f6c15a] text-xs text-[#06101d]">✓</span>{item}</div>
                  ))}
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <a href="#apply" className="rounded-2xl bg-gradient-to-b from-[#ffd36d] to-[#d89425] px-7 py-4 text-center text-base font-black uppercase tracking-[.04em] text-[#06101d] shadow-xl shadow-[#d89425]/25">Get Started — It’s 100% Free →</a>
                  <div className="text-sm font-bold text-white/80">🔒 No SSN Required • No Credit Check To Start</div>
                </div>
              </div>

              <div className="hidden items-start justify-end gap-4 lg:flex">
                <div className="mt-2 rounded-2xl border border-white/30 bg-white/90 px-7 py-5 text-center text-[#06101d] shadow-2xl">
                  <div className="text-[11px] font-black uppercase tracking-[.12em] text-slate-600">Featured On</div>
                  <div className="mt-1 text-4xl font-black text-purple-700">yahoo!</div>
                  <div className="-mt-2 text-xl font-black">finance</div>
                </div>
                <div className="mt-28 rounded-[28px] border border-[#f6c15a]/60 bg-[#071421]/88 px-7 py-6 text-center shadow-2xl backdrop-blur">
                  <div className="text-xs font-black uppercase tracking-[.18em] text-white/80">Top Rated</div>
                  <div className="mt-1 text-[11px] font-black uppercase tracking-[.12em] text-[#f6c15a]">Customer Experience</div>
                  <div className="mt-2 text-5xl font-black text-[#f6c15a]">2026</div>
                  <div className="mt-2 text-[#f6c15a]">★★★★★</div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-20 mx-auto -mt-5 grid max-w-[1320px] grid-cols-2 gap-2 rounded-[22px] border border-white/10 bg-white/95 p-2 text-[#06101d] shadow-2xl sm:grid-cols-3 lg:grid-cols-5 lg:gap-0 lg:divide-x lg:divide-slate-200">
            {[
              ['Featured On','yahoo! finance','text-purple-700'],
              ['Top Rated','Customer Experience 2026','text-[#0b1730]'],
              ['Homeowner','Protection Shield','text-[#0b1730]'],
              ['SSL','Secured','text-[#0b1730]'],
              ['100% Free','To Homeowners','text-[#0b1730]'],
            ].map(([top, bottom, color]) => (
              <div key={top} className="rounded-2xl px-3 py-3 text-center lg:rounded-none">
                <div className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{top}</div>
                <div className={`mt-1 text-sm font-black uppercase leading-tight ${color}`}>{bottom}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="trust" className="relative z-10 mx-auto max-w-[1540px] px-4 pb-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[1.35fr_.8fr_.8fr]">
            <div id="protection" className="rounded-[24px] border border-[#f6c15a]/25 bg-[#071421]/95 p-5 shadow-xl lg:p-7">
              <div className="flex gap-4">
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl border border-[#f6c15a]/35 bg-[#f6c15a]/10 text-5xl">🛡️</div>
                <div>
                  <div className="text-xs font-black uppercase tracking-[.22em] text-[#f6c15a]">HELOC CONNECT Protection Shield</div>
                  <h2 className="mt-2 text-2xl font-black tracking-[-.04em] text-white">Protecting homeowners from bad-fit mortgage experiences.</h2>
                  <div className="mt-4 grid gap-2 text-sm font-bold text-white/85 sm:grid-cols-2">
                    {['Fake approvals','Bad-fit mortgage companies','Excessive fees','Loan products they never wanted','Overpromising and underdelivering','Unnecessary pressure'].map((item) => <div key={item}>✓ {item}</div>)}
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-[24px] border border-[#f6c15a]/15 bg-gradient-to-br from-[#fff4d0] to-[#f0ddb5] p-5 text-[#06101d] shadow-xl lg:p-7">
              <div className="text-4xl">💚</div>
              <h3 className="mt-3 text-xl font-black">100% Free To Homeowners</h3>
              <p className="mt-2 text-sm font-bold leading-relaxed text-slate-700">HELOC CONNECT services are free to homeowners. We receive service compensation from participating mortgage companies in our network.</p>
            </div>
            <div className="rounded-[24px] border border-emerald-300/20 bg-emerald-100/10 p-5 shadow-xl lg:p-7">
              <div className="text-4xl">⚡</div>
              <h3 className="mt-3 text-xl font-black text-white">Fast. Simple. Secure.</h3>
              <div className="mt-3 space-y-2 text-sm font-bold text-white/80">
                <div>✓ No SSN Required</div>
                <div>✓ No Credit Check To Start</div>
                <div>✓ Takes Less Than 2 Minutes</div>
                <div>✓ Won’t affect your credit score</div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-[1540px] px-4 pb-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[1fr_.9fr]">
            <div className="rounded-[24px] border border-white/10 bg-white/[.04] p-5 shadow-xl lg:p-7">
              <div className="grid gap-4 lg:grid-cols-[.7fr_1fr] lg:items-center">
                <div>
                  <h2 className="text-2xl font-black tracking-[-.04em] text-white">Real Results. <span className="text-[#f6c15a]">For Homeowners Like You.</span></h2>
                  <p className="mt-2 text-sm font-bold leading-relaxed text-white/72">Example only: our network can help homeowners compare options that may lower payments and access equity.</p>
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
                    <div className="text-xs font-black uppercase tracking-[.12em] text-red-300">Before</div>
                    <div className="mt-2 text-xs font-bold text-white/75">Previous Mortgage</div>
                    <div className="mt-2 text-3xl font-black text-red-400">$2,785<span className="text-sm">/mo</span></div>
                    <div className="mt-2 text-sm font-bold text-white">$0 Cash Out</div>
                  </div>
                  <div className="text-3xl font-black text-[#f6c15a]">→</div>
                  <div className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-4 text-center">
                    <div className="text-xs font-black uppercase tracking-[.12em] text-emerald-300">After With Our Network</div>
                    <div className="mt-2 text-xs font-bold text-white/75">New Mortgage Option</div>
                    <div className="mt-2 text-3xl font-black text-emerald-300">$2,125<span className="text-sm">/mo</span></div>
                    <div className="mt-2 text-xl font-black text-emerald-300">$100,000 Cash Access</div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-xs font-semibold text-white/50">Illustration only. Results vary by qualifications, property details, mortgage company review, programs, rates, and terms.</p>
            </div>
            <div className="rounded-[24px] border border-[#f6c15a]/20 bg-[#071421]/92 p-5 shadow-xl lg:p-7">
              <h3 className="text-2xl font-black text-white">Ready to see your options?</h3>
              <p className="mt-2 text-sm font-bold text-white/72">Scroll down and start with your property address. It only takes a minute.</p>
              <a href="#apply" className="mt-5 flex items-center justify-between rounded-2xl border border-[#f6c15a]/30 bg-[#f6c15a]/10 px-5 py-4 text-sm font-black uppercase tracking-[.08em] text-[#f6c15a]">
                <span>Scroll Down To Get Started</span><span className="text-2xl">↓</span>
              </a>
            </div>
          </div>
        </section>

        <section id="apply" className="relative z-10 mx-auto max-w-[1240px] px-4 pb-6 sm:px-6 lg:px-8">
          <div className="rounded-[26px] border border-white/10 bg-[#071421] p-4 shadow-2xl shadow-black/35 sm:rounded-[30px] sm:p-7 lg:p-9">
            <form onSubmit={submitLead} className="grid min-w-0 gap-3 sm:gap-4">
              <div className="rounded-[22px] border border-white/10 bg-gradient-to-br from-white/[.09] to-white/[.03] p-4 sm:rounded-[24px] sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[.38em] text-[#f6c15a]">Smart Homeowner Calculator</div>
                    <h2 className="mt-3 text-3xl font-black leading-[1.02] tracking-[-.04em] text-white sm:text-5xl">Let’s Get Started</h2>
                    <p className="mt-3 max-w-[720px] text-sm font-semibold leading-relaxed text-white/72">Enter your property address to get an estimated home value and preview possible HELOC or refinance paths.</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <div className="rounded-full border border-emerald-300/35 bg-emerald-400/15 px-4 py-2 text-xs font-black text-emerald-200">● Powered by property data</div>
                    <div className="rounded-full border border-[#f6c15a]/35 bg-[#f6c15a]/10 px-4 py-2 text-xs font-black text-[#f6c15a]">🔐 SSL secured</div>
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] border border-[#d9a94e]/45 bg-[#091a2f] p-3 sm:rounded-[24px] sm:p-5">
                <div className="text-xs font-black uppercase tracking-[.38em] text-[#f6c15a]">Step 1 of 4</div>
                <label className="mt-4 block text-lg font-black">Property Address</label>
                <input className="mt-3 w-full rounded-2xl border border-white/15 bg-[#06101d] p-3 text-base outline-none transition placeholder:text-slate-400 focus:border-[#f6c15a] sm:p-4" name="street_address" placeholder="Start typing property address" value={street} onChange={(e) => searchAddresses(e.target.value)} autoComplete="off" required />
                <input type="hidden" name="property_address" value={`${street}${unit ? " " + unit : ""}, ${city}, ${stateName} ${zip}`} />
                <p className="mt-2 text-xs font-black text-emerald-200">{addressSearching ? "Searching..." : addressLookupStatus}</p>
                {addressResults.length > 0 && (
                  <div className="mt-2 max-h-56 overflow-y-auto rounded-2xl border border-emerald-400/30 bg-[#071527] p-2 shadow-2xl">
                    {addressResults.map((result, index) => (
                      <button key={`${result.label}-${index}`} type="button" onClick={() => selectAddress(result)} className="mb-2 block w-full rounded-xl border border-white/10 bg-white/[.06] px-4 py-3 text-left text-sm font-bold text-white transition hover:border-emerald-300 hover:bg-emerald-400/10">{result.label}</button>
                    ))}
                  </div>
                )}
                {valueLookupStatus && <p className="mt-1 text-xs font-black text-[#f6c15a]">{valueLookupStatus}</p>}
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/[.04] p-3 sm:mt-4 sm:p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-black">Estimated Home Value</div>
                      <input className="mt-1 w-full min-w-0 bg-transparent text-3xl font-black text-white outline-none placeholder:text-white sm:mt-2 sm:text-4xl" name="home_value" placeholder="$---" value={formatCurrencyDisplay(homeValueInput)} onChange={(e) => setHomeValueInput(e.target.value)} />
                    </div>
                    <button type="button" onClick={tryManualHomeValueLookup} className="w-full rounded-xl border border-[#d9a94e]/50 px-4 py-2.5 text-sm font-black text-[#f6c15a] sm:w-auto sm:shrink-0 sm:py-3">↻ Update</button>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 outline-none placeholder:text-slate-400 focus:border-[#f6c15a] sm:p-4" name="first_name" placeholder="First Name" required />
                <input className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 outline-none placeholder:text-slate-400 focus:border-[#f6c15a] sm:p-4" name="last_name" placeholder="Last Name" required />
                <input className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 outline-none placeholder:text-slate-400 focus:border-[#f6c15a] sm:p-4" name="phone" placeholder="Phone Number" required />
                <input className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 outline-none placeholder:text-slate-400 focus:border-[#f6c15a] sm:p-4" name="email" placeholder="Email Address" type="email" required />
                <input className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 outline-none placeholder:text-slate-400 focus:border-[#f6c15a] sm:p-4" name="unit" placeholder="Unit / Apt (optional)" value={unit} onChange={(e) => setUnit(e.target.value)} />
                <input className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 outline-none placeholder:text-slate-400 focus:border-[#f6c15a] sm:p-4" name="city" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} onBlur={() => tryManualHomeValueLookup()} />
                <input className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 outline-none placeholder:text-slate-400 focus:border-[#f6c15a] sm:p-4" name="state" placeholder="State" value={stateName} onChange={(e) => setStateName(e.target.value)} onBlur={() => tryManualHomeValueLookup()} />
                <input className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 outline-none placeholder:text-slate-400 focus:border-[#f6c15a] sm:p-4" name="zip" placeholder="ZIP Code" value={zip} onChange={(e) => setZip(e.target.value)} onBlur={() => tryManualHomeValueLookup()} />
                <input className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 outline-none placeholder:text-slate-400 focus:border-[#f6c15a] sm:p-4" name="mortgage_balance" placeholder="Current Mortgage Balance" value={mortgageBalanceInput} onChange={(e) => setMortgageBalanceInput(e.target.value)} />
                <input className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 outline-none placeholder:text-slate-400 focus:border-[#f6c15a] sm:p-4" name="requested_cash" placeholder="How much funding do you want?" value={requestedCashInput} onChange={(e) => setRequestedCashInput(e.target.value)} />
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-[22px] border border-white/10 bg-[#091a2f] p-3 sm:rounded-[24px] sm:p-5">
                  <div className="text-xs font-black uppercase tracking-[.38em] text-[#f6c15a]">Step 2 of 4</div>
                  <h3 className="mt-3 text-xl font-black">Mortgage & Payment Standing</h3>
                  <div className="mt-3 grid gap-3 sm:mt-4">
                    <select className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 outline-none sm:p-4" name="loans_on_property" value={loansCount} onChange={(e) => setLoansCount(e.target.value)}><option value="">How many loans are on the property?</option><option>1 loan</option><option>2 loans</option><option>3+ loans</option><option>Not sure</option></select>
                    <select className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 outline-none sm:p-4" name="mortgage_good_standing" value={goodStanding} onChange={(e) => setGoodStanding(e.target.value)}><option value="">Mortgage payments in good standing?</option><option>Yes, current and on time</option><option>Mostly current</option><option>No / behind</option></select>
                    <select className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 outline-none sm:p-4" name="missed_payments_6_months" value={missedPayments} onChange={(e) => setMissedPayments(e.target.value)}><option value="">Any missed mortgage payments in the last 6 months?</option><option>No missed payments</option><option>1 missed payment</option><option>2+ missed payments</option><option>Not sure</option></select>
                  </div>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-[#091a2f] p-3 sm:rounded-[24px] sm:p-5">
                  <div className="text-xs font-black uppercase tracking-[.38em] text-[#f6c15a]">Step 3 of 4</div>
                  <h3 className="mt-3 text-xl font-black">What Is Your Goal?</h3>
                  <div className="mt-3 grid gap-3 sm:mt-4">
                    <select className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 outline-none sm:p-4" name="loan_purpose"><option>HELOC / Home Equity Line</option><option>Cash-Out Refinance</option><option>Home Equity Loan</option><option>Maximum Cash-Out Review</option><option>Pay Down High-Interest Balances</option></select>
                    <select className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 outline-none sm:p-4" name="credit_score"><option value="">Credit Score Range</option><option>720+</option><option>680-719</option><option>620-679</option><option>580-619</option><option>Under 580</option></select>
                    <input className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 outline-none placeholder:text-slate-400 sm:p-4" name="monthly_income" placeholder="Monthly Income" />
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-emerald-400/30 bg-gradient-to-br from-emerald-400/10 to-blue-500/10 p-4 sm:p-5">
                <div className="text-center text-xs font-black uppercase tracking-[.3em] text-emerald-300">Smart Funding Breakdown</div>
                <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-emerald-400/25 bg-black/20 p-4 text-center"><div className="text-xs font-black uppercase tracking-[.14em] text-emerald-300">Estimated Maximum Equity Access</div><div className="mt-2 text-2xl font-black text-emerald-300">{homeValue && mortgageBalance ? formatMoney(possibleRoom) : "—"}</div></div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center"><div className="text-xs font-black uppercase tracking-[.14em] text-blue-200">Payment If Using Maximum Equity</div><div className="mt-2 text-2xl font-black text-white">{maxCashOutPaymentPreview ? `${formatMoney(maxCashOutPaymentPreview)}/mo` : "—"}</div></div>
                  <div className="rounded-2xl border border-blue-300/25 bg-blue-500/10 p-4 text-center"><div className="text-xs font-black uppercase tracking-[.14em] text-blue-200">Your Requested Funding Amount</div><div className="mt-2 text-2xl font-black text-white">{requestedCash ? formatMoney(requestedCash) : "—"}</div></div>
                  <div className="rounded-2xl border border-[#d9a94e]/25 bg-[#d9a94e]/10 p-4 text-center"><div className="text-xs font-black uppercase tracking-[.14em] text-[#f6c15a]">Payment For Requested Amount</div><div className="mt-2 text-2xl font-black text-white">{requestedCash ? `${formatMoney(paymentPreview)}/mo` : "—"}</div></div>
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-center text-[11px] font-semibold leading-relaxed text-blue-100">Preview estimates only. Final options vary by participating mortgage company review, verified property details, equity, credit profile, documents, rates and terms.</div>
                <input type="hidden" name="possible_equity_room" value={possibleRoom} />
                <input type="hidden" name="estimated_monthly_payment" value={paymentPreview} />
                <input type="hidden" name="estimated_max_cashout_payment" value={maxCashOutPaymentPreview} />
              </div>

              <button disabled={loading} className="rounded-2xl bg-gradient-to-b from-[#ffd36d] to-[#d89425] p-4 text-lg font-black text-[#06101d] shadow-xl transition hover:-translate-y-1 sm:p-5">
                {loading ? "Submitting..." : "SEE MY OPTIONS"}
              </button>
              <p className="text-center text-xs font-bold leading-relaxed text-white/75">No Social Security Number required for this initial request • Not a credit check • 100% free for homeowners</p>
            </form>
          </div>
        </section>

        <section id="how" className="relative z-10 mx-auto max-w-[1540px] px-4 pb-5 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-white/10 bg-[#071421]/90 p-6 shadow-2xl">
            <div className="text-center text-xs font-black uppercase tracking-[.35em] text-[#f6c15a]">How It Works</div>
            <h2 className="mt-3 text-center text-3xl font-black tracking-[-.04em]">A Simple Process That Puts You First</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-5">
              {['Enter Your Information','We Find The Right Match','You Get Better Options','Review & Choose','Move Forward'].map((step, i) => (
                <div key={step} className="rounded-2xl border border-white/10 bg-white/[.04] p-4 text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f6c15a] text-lg font-black text-[#06101d]">{i + 1}</div>
                  <div className="mt-4 text-sm font-black">{step}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="network" className="relative z-10 mx-auto max-w-[1540px] px-4 pb-5 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-white/10 bg-[#071421]/90 p-6 shadow-2xl">
            <div className="text-xs font-black uppercase tracking-[.35em] text-[#f6c15a]">Our Network</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-.04em]">Carefully Selected Mortgage Companies</h2>
            <p className="mt-3 max-w-4xl text-sm font-bold leading-relaxed text-white/75">HELOC CONNECT carefully hand-picks mortgage companies in our network so homeowners and homebuyers can be directed to a company that better fits their needs. Our role is to help clients avoid poor-fit lending experiences, inflated expectations, unnecessary pressure, and options they never asked for, while giving them a clearer path toward the mortgage company best suited for their goals.</p>
          </div>
        </section>

        <section id="solutions" className="relative z-10 mx-auto max-w-[1540px] px-4 pb-5 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-4">
            {['Home Purchase','Refinance','HELOC','Cash-Out'].map((item) => (
              <div key={item} className="rounded-[24px] border border-white/10 bg-[#071421]/90 p-5 shadow-xl">
                <div className="text-lg font-black text-[#f6c15a]">{item}</div>
                <p className="mt-2 text-sm font-bold leading-relaxed text-white/70">Connect with a selected mortgage company from our network to review available lending paths.</p>
              </div>
            ))}
          </div>
        </section>

        <section id="reviews" className="relative z-10 mx-auto max-w-[1540px] px-4 pb-10 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-white/10 bg-[#071421]/90 p-6 shadow-2xl">
            <div className="text-xs font-black uppercase tracking-[.35em] text-[#f6c15a]">Reviews</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-.04em]">Trusted By Homeowners</h2>
            <p className="mt-3 text-sm font-bold leading-relaxed text-white/75">Homeowners use HELOC CONNECT to explore options and connect with mortgage companies that can review their unique situation.</p>
          </div>
        </section>
      </section>

      <a href="tel:+19498662466" aria-label="Connect with a live agent" className="group fixed bottom-6 right-6 z-50 hidden items-center gap-3 rounded-full border border-[#f6c15a]/60 bg-gradient-to-r from-[#fff0b8] via-[#f6c15a] to-[#d89425] px-6 py-4 text-sm font-black uppercase tracking-[.14em] text-[#06101d] shadow-[0_18px_55px_rgba(216,148,37,.35)] ring-1 ring-white/20 transition hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_22px_70px_rgba(246,193,90,.45)] md:inline-flex">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#06101d] text-[#f6c15a] shadow-inner">☎</span>
        <span>Connect With A Live Agent</span>
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,.95)]" />
      </a>
      <a href="tel:+19498662466" aria-label="Connect with a live agent" className="fixed bottom-4 right-4 z-50 inline-flex max-w-[calc(100vw-2rem)] items-center justify-center gap-2 rounded-full border border-[#f6c15a]/60 bg-gradient-to-r from-[#fff0b8] via-[#f6c15a] to-[#d89425] px-4 py-3 text-[11px] font-black uppercase tracking-[.08em] text-[#06101d] shadow-[0_14px_42px_rgba(216,148,37,.35)] ring-1 ring-white/20 md:hidden">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#06101d] text-[#f6c15a]">☎</span>
        Live Agent
      </a>
    </main>
  );
}
