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
                <div className="text-4xl font-black tracking-[-.06em] md:text-5xl sm:text-6xl">
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
            <a href="/about">About Us</a>
            <a href="/privacy-policy">Privacy Policy</a>
            <a href="/terms">Terms</a>
          </div>

          <div className="hidden items-center gap-6 md:flex">

            <a href="#apply" className="rounded-lg bg-gradient-to-b from-[#8cff24] to-[#4eb800] px-7 py-4 text-sm font-black text-white shadow-lg shadow-[#6fff27]/25">
              How Much Can I Get?
            </a>
          </div>
        </nav>

        {/* Hero */}
        <div id="home" className="relative z-10 mx-auto grid max-w-[1560px] gap-10 px-6 py-14 lg:grid-cols-[.92fr_.82fr]">
          <div>
            <h1 className="max-w-4xl text-5xl sm:text-6xl font-black leading-[1.02] tracking-[-.06em] md:text-8xl">
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
                How Much Can I Get? →
              </a>
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-full border border-[#6fff27]/50 bg-[#6fff27]/10 text-2xl shadow-lg shadow-[#6fff27]/20">🔒</div>
                <div className="text-sm font-bold leading-relaxed text-slate-200">
                  Secure • Private • No Impact<br />To Your Credit Score
                </div>
              </div>
            </div>

            <div className="mt-10 max-w-[650px]">
              <div className="rounded-[28px] border border-[#6fff27]/25 bg-[#07192f]/80 p-6 shadow-2xl shadow-[#6fff27]/10 backdrop-blur-xl">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.35em] text-[#6fff27]">
                      Homeowner Reviews
                    </div>
                    <h3 className="mt-2 text-3xl font-black leading-tight text-white">
                      Fast Closings.<br />Less Stress.
                    </h3>
                  </div>
                  <div className="rounded-full border border-[#6fff27]/30 bg-[#6fff27]/10 px-4 py-2 text-sm font-black text-[#6fff27]">
                    ★★★★★
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-lg font-black text-white">Michael R.</div>
                      <div className="text-sm text-yellow-300">★★★★★</div>
                    </div>
                    <div className="mt-1 text-sm font-black text-[#6fff27]">Fast approval process</div>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-blue-100">
                      “Way easier than going through my bank. The process moved quickly and I understood my options almost immediately.”
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-lg font-black text-white">Angela T.</div>
                      <div className="text-sm text-yellow-300">★★★★★</div>
                    </div>
                    <div className="mt-1 text-sm font-black text-[#6fff27]">Much less paperwork</div>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-blue-100">
                      “Other lenders kept asking for more documents. This process was cleaner, faster, and much more organized.”
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-lg font-black text-white">David M.</div>
                      <div className="text-sm text-yellow-300">★★★★★</div>
                    </div>
                    <div className="mt-1 text-sm font-black text-[#6fff27]">Flexible credit situation</div>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-blue-100">
                      “I had a difficult credit situation and still got realistic options explained clearly without pressure.”
                    </p>
                  </div>
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
              <div className="mt-1 text-5xl sm:text-6xl font-black tracking-[-.06em] text-[#6fff27] md:text-5xl sm:text-5xl sm:text-6xl lg:text-7xl">$500,000+</div>
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
              <div className="md:col-span-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 shadow-lg shadow-emerald-500/10">
                <div className="text-sm font-black uppercase tracking-[.22em] text-emerald-300">Smart Funding Preview</div>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-blue-100">
                  Enter your property details and mortgage balance to instantly preview possible equity room and estimated payment range before submitting.
                </p>
              </div>

              <input className="rounded-xl border border-blue-200/30 bg-white/10 p-3.5 text-base outline-none transition focus:border-gold focus:bg-white/15" name="first_name" placeholder="First Name" required />
              <input className="rounded-xl border border-blue-200/30 bg-white/10 p-3.5 text-base outline-none transition focus:border-gold focus:bg-white/15" name="last_name" placeholder="Last Name" required />
              <input className="rounded-xl border border-blue-200/30 bg-white/10 p-3.5 text-base outline-none transition focus:border-gold focus:bg-white/15" name="phone" placeholder="Phone Number" required />
              <input className="rounded-xl border border-blue-200/30 bg-white/10 p-3.5 text-base outline-none transition focus:border-gold focus:bg-white/15" name="email" placeholder="Email Address" type="email" required />

              <div className="md:col-span-2">
                <input
                  className="w-full rounded-xl border border-emerald-400/30 bg-white/10 p-3.5 text-base outline-none transition focus:border-emerald-300 focus:bg-white/15"
                  name="street_address"
                  placeholder="Start typing property address"
                  value={street}
                  onChange={(e) => searchAddresses(e.target.value)}
                  autoComplete="off"
                  required
                />
                <input type="hidden" name="property_address" value={`${street}${unit ? " " + unit : ""}, ${city}, ${stateName} ${zip}`} />
                <p className="mt-2 text-xs font-black text-emerald-200">
                  {addressSearching ? "Searching..." : addressLookupStatus}
                </p>
                {addressResults.length > 0 && (
                  <div className="mt-2 max-h-56 overflow-y-auto rounded-2xl border border-emerald-400/30 bg-[#071527] p-2 shadow-2xl">
                    {addressResults.map((result, index) => (
                      <button
                        key={`${result.label}-${index}`}
                        type="button"
                        onClick={() => selectAddress(result)}
                        className="mb-2 block w-full rounded-xl border border-white/10 bg-white/[.06] px-4 py-3 text-left text-sm font-bold text-white transition hover:border-emerald-300 hover:bg-emerald-400/10"
                      >
                        {result.label}
                      </button>
                    ))}
                  </div>
                )}
                {valueLookupStatus && (
                  <p className="mt-1 text-xs font-black text-gold">
                    {valueLookupStatus}
                  </p>
                )}
              </div>

              <input className="rounded-xl border border-blue-200/30 bg-white/10 p-3.5 text-base outline-none transition focus:border-gold focus:bg-white/15" name="unit" placeholder="Unit / Apt (optional)" value={unit} onChange={(e) => setUnit(e.target.value)} />
              <input className="rounded-xl border border-blue-200/30 bg-white/10 p-3.5 text-base outline-none transition focus:border-gold focus:bg-white/15" name="city" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} onBlur={() => tryManualHomeValueLookup()} />
              <input className="rounded-xl border border-blue-200/30 bg-white/10 p-3.5 text-base outline-none transition focus:border-gold focus:bg-white/15" name="state" placeholder="State" value={stateName} onChange={(e) => setStateName(e.target.value)} onBlur={() => tryManualHomeValueLookup()} />
              <input className="rounded-xl border border-blue-200/30 bg-white/10 p-3.5 text-base outline-none transition focus:border-gold focus:bg-white/15" name="zip" placeholder="ZIP Code" value={zip} onChange={(e) => setZip(e.target.value)} onBlur={() => tryManualHomeValueLookup()} />

              <div>
                <input
                  className="w-full rounded-xl border border-emerald-400/30 bg-white/10 p-3.5 text-base outline-none transition focus:border-emerald-300 focus:bg-white/15"
                  name="home_value"
                  placeholder="Estimated Market Value — Auto-filled after address selection"
                  value={homeValueInput}
                  onChange={(e) => setHomeValueInput(e.target.value)}
                />
                <button
                  type="button"
                  onClick={tryManualHomeValueLookup}
                  className="mt-2 w-full rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-200 transition hover:bg-emerald-400/20"
                >
                  Refresh Home Value
                </button>
              </div>
              <input
                className="rounded-xl border border-emerald-400/30 bg-white/10 p-3.5 text-base outline-none transition focus:border-emerald-300 focus:bg-white/15"
                name="mortgage_balance"
                placeholder="Current Mortgage Balance"
                value={mortgageBalanceInput}
                onChange={(e) => setMortgageBalanceInput(e.target.value)}
              />

              <select className="rounded-xl border border-blue-200/30 bg-[#0b2445] p-3.5 text-base outline-none transition focus:border-gold" name="loans_on_property" value={loansCount} onChange={(e) => setLoansCount(e.target.value)}>
                <option value="">How many loans are on the property?</option>
                <option>1 loan</option>
                <option>2 loans</option>
                <option>3+ loans</option>
                <option>Not sure</option>
              </select>
              <select className="rounded-xl border border-blue-200/30 bg-[#0b2445] p-3.5 text-base outline-none transition focus:border-gold" name="mortgage_good_standing" value={goodStanding} onChange={(e) => setGoodStanding(e.target.value)}>
                <option value="">Mortgage payments in good standing?</option>
                <option>Yes, current and on time</option>
                <option>Mostly current</option>
                <option>No / behind</option>
              </select>

              <select className="rounded-xl border border-blue-200/30 bg-[#0b2445] p-3.5 text-base outline-none transition focus:border-gold md:col-span-2" name="missed_payments_6_months" value={missedPayments} onChange={(e) => setMissedPayments(e.target.value)}>
                <option value="">Any missed mortgage payments in the last 6 months?</option>
                <option>No missed payments</option>
                <option>1 missed payment</option>
                <option>2+ missed payments</option>
                <option>Not sure</option>
              </select>

              <input
                className="rounded-xl border border-emerald-400/30 bg-white/10 p-3.5 text-base outline-none transition focus:border-emerald-300 focus:bg-white/15"
                name="requested_cash"
                placeholder="How much funding do you want?"
                value={requestedCashInput}
                onChange={(e) => setRequestedCashInput(e.target.value)}
              />
              <select className="rounded-xl border border-blue-200/30 bg-[#0b2445] p-3.5 text-base outline-none transition focus:border-gold" name="credit_score">
                <option value="">Credit Score Range</option>
                <option>720+</option>
                <option>680-719</option>
                <option>620-679</option>
                <option>580-619</option>
                <option>Under 580</option>
              </select>

              <input className="rounded-xl border border-blue-200/30 bg-white/10 p-3.5 text-base outline-none transition focus:border-gold focus:bg-white/15" name="monthly_income" placeholder="Monthly Income" />
              <select className="rounded-xl border border-blue-200/30 bg-[#0b2445] p-3.5 text-base outline-none transition focus:border-gold" name="loan_purpose">
                <option>HELOC / Home Equity Line</option>
                <option>Cash-Out Refinance</option>
                <option>Home Equity Loan</option>
                <option>Maximum Cash-Out Review</option>
                <option>Pay Down High-Interest Balances</option>
              </select>

                            <div className="md:col-span-2 rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-400/10 to-blue-500/10 p-4 shadow-xl shadow-emerald-500/10">
                <div className="mb-4 text-center">
                  <div className="text-xs font-black uppercase tracking-[.26em] text-emerald-300">Smart Funding Breakdown</div>
                  <p className="mt-2 text-xs font-semibold text-blue-100">
                    See your maximum equity potential separately from the amount you personally want to request.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-emerald-400/30 bg-black/25 p-4 text-center shadow-lg shadow-emerald-500/10">
                    <div className="text-xs font-black uppercase tracking-[.16em] text-emerald-300">Estimated Maximum Equity Access</div>
                    <div className="mt-2 text-3xl font-black text-emerald-300">{homeValue && mortgageBalance ? formatMoney(possibleRoom) : "—"}</div>
                    <p className="mt-2 text-[11px] font-semibold leading-relaxed text-blue-100">
                      Based on estimated property value and mortgage balance.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
                    <div className="text-xs font-black uppercase tracking-[.16em] text-blue-200">Payment If Using Maximum Equity</div>
                    <div className="mt-2 text-2xl font-black text-white">{maxCashOutPaymentPreview ? `${formatMoney(maxCashOutPaymentPreview)}/mo` : "—"}</div>
                    <p className="mt-2 text-[11px] font-semibold leading-relaxed text-blue-100">
                      Estimated payment only if the full maximum equity amount is requested.
                    </p>
                  </div>

                  <div className="rounded-xl border border-blue-300/30 bg-blue-500/10 p-4 text-center">
                    <div className="text-xs font-black uppercase tracking-[.16em] text-blue-200">Your Requested Funding Amount</div>
                    <div className="mt-2 text-3xl font-black text-white">{requestedCash ? formatMoney(requestedCash) : "—"}</div>
                    <p className="mt-2 text-[11px] font-semibold leading-relaxed text-blue-100">
                      This is the amount entered into the form.
                    </p>
                  </div>

                  <div className="rounded-xl border border-gold/30 bg-gold/10 p-4 text-center">
                    <div className="text-xs font-black uppercase tracking-[.16em] text-gold">Payment For Requested Amount</div>
                    <div className="mt-2 text-2xl font-black text-white">{requestedCash ? `${formatMoney(paymentPreview)}/mo` : "—"}</div>
                    <p className="mt-2 text-[11px] font-semibold leading-relaxed text-blue-100">
                      Estimated payment preview for only the amount requested.
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-center text-[11px] font-semibold leading-relaxed text-blue-100">
                  These are preview estimates only. Final terms depend on lender review, verified property details, equity, credit profile, and documents.
                </div>

                <input type="hidden" name="possible_equity_room" value={possibleRoom} />
                <input type="hidden" name="estimated_monthly_payment" value={paymentPreview} />
                <input type="hidden" name="estimated_max_cashout_payment" value={maxCashOutPaymentPreview} />
              </div>

              <button disabled={loading} className="rounded-xl bg-gradient-to-b from-yellow-300 to-amber-600 p-4 text-lg font-black text-white shadow-xl transition hover:-translate-y-1 hover:shadow-gold/30 md:col-span-2 sm:p-5 sm:text-xl">
                {loading ? "Submitting..." : "SEE MY FUNDING PREVIEW ›"}
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

          <div className="mt-7 flex items-center gap-6 rounded-2xl border border-white/15 bg-black/25 p-6 shadow-2xl backdrop-blur-xl">
            <div className="text-5xl text-[#6fff27]">🛡️</div>
            <p className="text-xl font-semibold leading-relaxed text-slate-200">
              <span className="font-black text-[#6fff27]">HELOC CONNECT</span> is built for homeowners who want faster approvals, fewer documents, lower APR options, flexible credit-score pathways, and direct lender access without traditional bank delays.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#06101f] px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-[1560px] rounded-[1.75rem] sm:rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-[#0b1d36] via-[#071527] to-[#050b14] p-8 shadow-2xl md:p-12">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[.35em] text-[#6fff27]">Why Homeowners Choose HELOC CONNECT</p>
            <h2 className="mx-auto mt-4 max-w-5xl text-3xl font-black leading-tight tracking-[-.04em] sm:text-4xl md:text-5xl lg:text-5xl sm:text-6xl">
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
              <div key={title} className="rounded-3xl border border-white/10 bg-white/[.055] p-6 shadow-2xl backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#6fff27]/70">
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
