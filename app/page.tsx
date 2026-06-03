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
    <main className="min-h-screen bg-[#030914] text-white">
      <section id="home" className="relative min-h-screen overflow-hidden bg-[#030914]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(245,183,25,.18),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(15,54,96,.55),transparent_34%),linear-gradient(135deg,#020711_0%,#061426_55%,#020711_100%)]" />
        <div className="absolute inset-0 opacity-40" style={{backgroundImage:"url('/happy-couple-success.png')", backgroundSize:'cover', backgroundPosition:'42% 22%'}} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#020711]/95 via-[#031021]/55 to-[#020711]/92" />
        <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-[#030914] to-transparent" />

        <nav className="relative z-20 mx-auto flex max-w-[1560px] items-center justify-between px-6 py-5 lg:px-10">
          <a href="#home" className="flex items-center gap-3 text-white no-underline">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#d6a84f]/60 bg-[#081322]/70 text-2xl text-[#f5c76a] shadow-xl shadow-black/40">⌂</div>
            <div className="leading-none">
              <div className="text-3xl font-black tracking-[-.04em]">HELOC</div>
              <div className="text-sm font-black tracking-[.46em] text-[#f5c76a]">CONNECT</div>
            </div>
          </a>
          <div className="hidden items-center gap-8 text-sm font-black text-white/90 lg:flex">
            <a href="#how" className="hover:text-[#f5c76a]">How It Works</a>
            <a href="#network" className="hover:text-[#f5c76a]">Our Network</a>
            <a href="#solutions" className="hover:text-[#f5c76a]">Solutions</a>
            <a href="/about" className="hover:text-[#f5c76a]">About Us</a>
            <a href="/privacy-policy" className="hover:text-[#f5c76a]">Privacy</a>
            <a href="/terms" className="hover:text-[#f5c76a]">Terms</a>
          </div>
          <div className="hidden items-center gap-5 md:flex">
            <a href="tel:18339994356" className="text-sm font-black text-[#f5c76a]">☎ (833) 999-4356</a>
            <a href="#apply" className="rounded-xl bg-gradient-to-b from-[#ffe49b] to-[#d59424] px-6 py-4 text-sm font-black text-[#09111e] shadow-xl shadow-[#d59424]/25">Explore My Options</a>
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid max-w-[1560px] items-center gap-8 px-6 pb-12 pt-7 lg:grid-cols-[1.04fr_.96fr] lg:px-10 lg:pb-16">
          <div className="relative min-h-[720px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#06101d]/35 shadow-2xl shadow-black/50 backdrop-blur-[1px] lg:min-h-[770px]">
            <div className="absolute inset-0 bg-[url('/happy-couple-tablet.png')] bg-cover bg-center opacity-95" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#031021]/95 via-[#031021]/45 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#031021]/95 via-transparent to-[#031021]/5" />

            <div className="relative z-10 max-w-[560px] px-7 py-12 sm:px-10 lg:px-12 lg:py-16">
              <div className="inline-flex rounded-full border border-[#d6a84f]/55 bg-black/35 px-5 py-2 text-xs font-black uppercase tracking-[.35em] text-[#f5c76a] shadow-xl backdrop-blur-md">The Ultimate Way To</div>
              <h1 className="mt-7 text-5xl font-black leading-[.95] tracking-[-.06em] text-white sm:text-6xl lg:text-7xl">
                Find The Right<br />Mortgage Company
              </h1>
              <h2 className="mt-7 text-4xl font-black leading-tight tracking-[-.04em] text-[#f5c76a] sm:text-5xl">
                Lower Payments.<br />More Cash.<br />Less Stress.
              </h2>
              <p className="mt-7 max-w-[500px] text-lg font-semibold leading-relaxed text-blue-50">
                HELOC CONNECT is not a lender. We connect homeowners with carefully selected mortgage companies in our network for refinance, home purchase, HELOC and cash-out options.
              </p>

              <div className="mt-7 flex items-center gap-2 text-[#f5c76a]">
                <span className="text-xl">★ ★ ★ ★ ★</span>
                <span className="ml-2 text-sm font-black text-white">4.9/5 From Homeowners</span>
              </div>

              <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-[#f5c76a]/45 bg-black/45 px-5 py-4 shadow-2xl backdrop-blur-lg">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#f5c76a] text-xl text-[#06101d]">✓</span>
                <div>
                  <div className="text-sm font-black uppercase tracking-[.18em] text-[#f5c76a]">We are not a lender</div>
                  <div className="text-sm font-semibold text-blue-100">We connect you with mortgage companies.</div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-9 right-7 z-10 w-[min(470px,calc(100%-3.5rem))] rounded-[2rem] border border-white/25 bg-white/95 p-5 text-[#071527] shadow-2xl shadow-black/50 backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-emerald-600 text-2xl text-white shadow-lg">✓</div>
                <div>
                  <h3 className="text-2xl font-black leading-tight tracking-[-.03em]">Matched To An Amazing Mortgage Company!</h3>
                  <p className="mt-1 text-sm font-black text-emerald-700">Example: lower payment + $100,000 cash access</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-stretch gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <div className="text-xs font-black text-slate-500">Previous Mortgage Company</div>
                  <div className="mt-3 text-2xl font-black text-red-600">$2,785<span className="text-sm">/mo</span></div>
                  <div className="mt-2 text-xs font-black text-slate-600">$0 Cash Out</div>
                </div>
                <div className="grid place-items-center text-3xl font-black text-slate-500">›</div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                  <div className="text-xs font-black text-slate-500">Network Mortgage Company</div>
                  <div className="mt-3 text-2xl font-black text-emerald-700">$2,125<span className="text-sm">/mo</span></div>
                  <div className="mt-2 text-lg font-black text-emerald-700">$100,000</div>
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3 text-center text-sm font-black text-white">
                $660 lower payment monthly • $100,000 cash at closing
              </div>
              <p className="mt-2 text-center text-[11px] font-semibold text-slate-500">Illustration only. Final options vary by qualifications and participating mortgage company review.</p>
            </div>
          </div>

          <div id="apply" className="rounded-[2.4rem] border border-[#d6a84f]/55 bg-[#07111f]/82 p-5 shadow-2xl shadow-black/60 backdrop-blur-xl sm:p-7">
            <div className="rounded-[1.75rem] border border-white/12 bg-white/[.06] p-5 sm:p-7">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[.35em] text-[#f5c76a]">Smart Homeowner Calculator</div>
                  <h3 className="mt-2 text-3xl font-black leading-tight tracking-[-.04em] text-white">Address-Based Home Value + Funding Preview</h3>
                </div>
                <div className="rounded-full border border-emerald-400/40 bg-emerald-400/12 px-4 py-2 text-xs font-black text-emerald-200">● Powered by property data</div>
              </div>

              <form onSubmit={submitLead} className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2 rounded-2xl border border-[#d6a84f]/45 bg-[#d6a84f]/10 p-4">
                  <div className="text-xs font-black uppercase tracking-[.30em] text-[#f5c76a]">Step 1 — Property Address</div>
                  <input
                    className="mt-3 w-full rounded-xl border border-[#d6a84f]/35 bg-black/35 p-4 text-base font-semibold text-white outline-none transition placeholder:text-blue-100/60 focus:border-[#f5c76a]"
                    name="street_address"
                    placeholder="Start typing property address"
                    value={street}
                    onChange={(e) => searchAddresses(e.target.value)}
                    autoComplete="off"
                    required
                  />
                  <input type="hidden" name="property_address" value={`${street}${unit ? " " + unit : ""}, ${city}, ${stateName} ${zip}`} />
                  <p className="mt-2 text-xs font-black text-emerald-200">{addressSearching ? "Searching..." : addressLookupStatus}</p>
                  {addressResults.length > 0 && (
                    <div className="mt-2 max-h-56 overflow-y-auto rounded-2xl border border-[#d6a84f]/30 bg-[#071527] p-2 shadow-2xl">
                      {addressResults.map((result, index) => (
                        <button key={`${result.label}-${index}`} type="button" onClick={() => selectAddress(result)} className="mb-2 block w-full rounded-xl border border-white/10 bg-white/[.06] px-4 py-3 text-left text-sm font-bold text-white transition hover:border-[#f5c76a] hover:bg-[#f5c76a]/10">
                          {result.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {valueLookupStatus && <p className="mt-2 text-xs font-black text-[#f5c76a]">{valueLookupStatus}</p>}
                </div>

                <input className="rounded-xl border border-white/15 bg-white/10 p-3.5 text-base outline-none transition placeholder:text-blue-100/55 focus:border-[#f5c76a] focus:bg-white/15" name="first_name" placeholder="First Name" required />
                <input className="rounded-xl border border-white/15 bg-white/10 p-3.5 text-base outline-none transition placeholder:text-blue-100/55 focus:border-[#f5c76a] focus:bg-white/15" name="last_name" placeholder="Last Name" required />
                <input className="rounded-xl border border-white/15 bg-white/10 p-3.5 text-base outline-none transition placeholder:text-blue-100/55 focus:border-[#f5c76a] focus:bg-white/15" name="phone" placeholder="Phone Number" required />
                <input className="rounded-xl border border-white/15 bg-white/10 p-3.5 text-base outline-none transition placeholder:text-blue-100/55 focus:border-[#f5c76a] focus:bg-white/15" name="email" placeholder="Email Address" type="email" required />

                <input className="rounded-xl border border-white/15 bg-white/10 p-3.5 text-base outline-none transition placeholder:text-blue-100/55 focus:border-[#f5c76a] focus:bg-white/15" name="unit" placeholder="Unit / Apt (optional)" value={unit} onChange={(e) => setUnit(e.target.value)} />
                <input className="rounded-xl border border-white/15 bg-white/10 p-3.5 text-base outline-none transition placeholder:text-blue-100/55 focus:border-[#f5c76a] focus:bg-white/15" name="city" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} onBlur={() => tryManualHomeValueLookup()} />
                <input className="rounded-xl border border-white/15 bg-white/10 p-3.5 text-base outline-none transition placeholder:text-blue-100/55 focus:border-[#f5c76a] focus:bg-white/15" name="state" placeholder="State" value={stateName} onChange={(e) => setStateName(e.target.value)} onBlur={() => tryManualHomeValueLookup()} />
                <input className="rounded-xl border border-white/15 bg-white/10 p-3.5 text-base outline-none transition placeholder:text-blue-100/55 focus:border-[#f5c76a] focus:bg-white/15" name="zip" placeholder="ZIP Code" value={zip} onChange={(e) => setZip(e.target.value)} onBlur={() => tryManualHomeValueLookup()} />

                <div>
                  <input className="w-full rounded-xl border border-[#d6a84f]/35 bg-black/25 p-3.5 text-base outline-none transition placeholder:text-blue-100/55 focus:border-[#f5c76a] focus:bg-white/10" name="home_value" placeholder="Estimated Market Value — Auto-filled" value={homeValueInput} onChange={(e) => setHomeValueInput(e.target.value)} />
                  <button type="button" onClick={tryManualHomeValueLookup} className="mt-2 w-full rounded-xl border border-[#d6a84f]/35 bg-[#d6a84f]/10 px-3 py-2 text-xs font-black text-[#f5c76a] transition hover:bg-[#d6a84f]/20">Refresh Home Value</button>
                </div>
                <input className="rounded-xl border border-[#d6a84f]/35 bg-black/25 p-3.5 text-base outline-none transition placeholder:text-blue-100/55 focus:border-[#f5c76a] focus:bg-white/10" name="mortgage_balance" placeholder="Current Mortgage Balance" value={mortgageBalanceInput} onChange={(e) => setMortgageBalanceInput(e.target.value)} />

                <select className="rounded-xl border border-white/15 bg-[#071527] p-3.5 text-base outline-none transition focus:border-[#f5c76a]" name="loans_on_property" value={loansCount} onChange={(e) => setLoansCount(e.target.value)}>
                  <option value="">How many loans are on the property?</option><option>1 loan</option><option>2 loans</option><option>3+ loans</option><option>Not sure</option>
                </select>
                <select className="rounded-xl border border-white/15 bg-[#071527] p-3.5 text-base outline-none transition focus:border-[#f5c76a]" name="mortgage_good_standing" value={goodStanding} onChange={(e) => setGoodStanding(e.target.value)}>
                  <option value="">Mortgage payments in good standing?</option><option>Yes, current and on time</option><option>Mostly current</option><option>No / behind</option>
                </select>
                <select className="rounded-xl border border-white/15 bg-[#071527] p-3.5 text-base outline-none transition focus:border-[#f5c76a] md:col-span-2" name="missed_payments_6_months" value={missedPayments} onChange={(e) => setMissedPayments(e.target.value)}>
                  <option value="">Any missed mortgage payments in the last 6 months?</option><option>No missed payments</option><option>1 missed payment</option><option>2+ missed payments</option><option>Not sure</option>
                </select>
                <input className="rounded-xl border border-white/15 bg-white/10 p-3.5 text-base outline-none transition placeholder:text-blue-100/55 focus:border-[#f5c76a] focus:bg-white/15" name="requested_cash" placeholder="How much funding do you want?" value={requestedCashInput} onChange={(e) => setRequestedCashInput(e.target.value)} />
                <select className="rounded-xl border border-white/15 bg-[#071527] p-3.5 text-base outline-none transition focus:border-[#f5c76a]" name="credit_score">
                  <option value="">Credit Score Range</option><option>720+</option><option>680-719</option><option>620-679</option><option>580-619</option><option>Under 580</option>
                </select>
                <input className="rounded-xl border border-white/15 bg-white/10 p-3.5 text-base outline-none transition placeholder:text-blue-100/55 focus:border-[#f5c76a] focus:bg-white/15" name="monthly_income" placeholder="Monthly Income" />
                <select className="rounded-xl border border-white/15 bg-[#071527] p-3.5 text-base outline-none transition focus:border-[#f5c76a]" name="loan_purpose">
                  <option>HELOC / Home Equity Line</option><option>Cash-Out Refinance</option><option>Home Equity Loan</option><option>Maximum Cash-Out Review</option><option>Pay Down High-Interest Balances</option>
                </select>

                <div className="md:col-span-2 rounded-2xl border border-[#d6a84f]/35 bg-gradient-to-br from-[#d6a84f]/10 to-blue-500/10 p-4 shadow-xl">
                  <div className="text-center text-xs font-black uppercase tracking-[.26em] text-[#f5c76a]">Smart Funding Breakdown</div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-emerald-400/30 bg-black/25 p-4 text-center"><div className="text-xs font-black uppercase tracking-[.16em] text-emerald-300">Estimated Maximum Equity Access</div><div className="mt-2 text-3xl font-black text-emerald-300">{homeValue && mortgageBalance ? formatMoney(possibleRoom) : "—"}</div></div>
                    <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center"><div className="text-xs font-black uppercase tracking-[.16em] text-blue-200">Payment If Using Maximum Equity</div><div className="mt-2 text-2xl font-black text-white">{maxCashOutPaymentPreview ? `${formatMoney(maxCashOutPaymentPreview)}/mo` : "—"}</div></div>
                    <div className="rounded-xl border border-blue-300/30 bg-blue-500/10 p-4 text-center"><div className="text-xs font-black uppercase tracking-[.16em] text-blue-200">Your Requested Funding Amount</div><div className="mt-2 text-3xl font-black text-white">{requestedCash ? formatMoney(requestedCash) : "—"}</div></div>
                    <div className="rounded-xl border border-[#d6a84f]/30 bg-[#d6a84f]/10 p-4 text-center"><div className="text-xs font-black uppercase tracking-[.16em] text-[#f5c76a]">Payment For Requested Amount</div><div className="mt-2 text-2xl font-black text-white">{requestedCash ? `${formatMoney(paymentPreview)}/mo` : "—"}</div></div>
                  </div>
                  <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-center text-[11px] font-semibold leading-relaxed text-blue-100">Preview estimates only. Final terms depend on participating mortgage company review, verified property details, equity, credit profile, and documents.</div>
                  <input type="hidden" name="possible_equity_room" value={possibleRoom} />
                  <input type="hidden" name="estimated_monthly_payment" value={paymentPreview} />
                  <input type="hidden" name="estimated_max_cashout_payment" value={maxCashOutPaymentPreview} />
                </div>

                <button disabled={loading} className="md:col-span-2 rounded-xl bg-gradient-to-b from-[#ffe49b] to-[#d59424] p-5 text-lg font-black text-[#071527] shadow-xl transition hover:-translate-y-1 hover:shadow-[#d59424]/30">
                  {loading ? "Submitting..." : "SEE MY OPTIONS"}
                </button>
                <p className="md:col-span-2 text-center text-xs font-semibold text-blue-100">🔒 Secure • This will not affect your credit score</p>
              </form>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-[1560px] px-6 pb-16 lg:px-10">
          <div className="grid overflow-hidden rounded-[2rem] border border-white/10 bg-[#06101d]/78 shadow-2xl backdrop-blur-xl md:grid-cols-4">
            {[
              ["🛡️", "We Are Not A Lender", "We connect you with mortgage companies."],
              ["👥", "Carefully Selected Mortgage Companies", "We partner with reputable lending professionals."],
              ["💰", "Lower Payment Pathways", "Our network companies help you compare options."],
              ["🔒", "100% Free To Explore", "No obligation to move forward."]
            ].map(([icon,title,desc])=>(
              <div key={title} className="border-b border-white/10 p-6 md:border-b-0 md:border-r md:last:border-r-0">
                <div className="text-4xl text-[#f5c76a]">{icon}</div><h3 className="mt-3 text-lg font-black">{title}</h3><p className="mt-2 text-sm font-semibold text-blue-100">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="bg-[#f7f5f0] px-6 py-16 text-[#071527] lg:px-10">
        <div className="mx-auto max-w-[1560px]">
          <div className="text-center"><div className="text-xs font-black uppercase tracking-[.35em] text-[#b8821f]">How It Works</div><h2 className="mt-3 text-4xl font-black tracking-[-.04em] md:text-5xl">A Simple Process That Puts You First</h2></div>
          <div className="mt-12 grid gap-6 md:grid-cols-5">
            {[
              ["1", "Enter Your Information", "Provide basic details about your property and goals."],
              ["2", "We Find The Right Match", "We compare options from our carefully selected network."],
              ["3", "You Get Better Options", "See potential solutions with lower payments and more benefits."],
              ["4", "Review & Choose", "Compare offers and choose what works for you."],
              ["5", "Move Forward With Confidence", "Connect with the mortgage company you choose."]
            ].map(([num,title,desc])=>(
              <div key={title} className="rounded-3xl bg-white p-6 text-center shadow-xl shadow-slate-200/70"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#071527] text-xl font-black text-[#f5c76a]">{num}</div><h3 className="mt-5 text-lg font-black">{title}</h3><p className="mt-2 text-sm font-semibold text-slate-600">{desc}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section id="network" className="bg-[#030914] px-6 py-16 text-white lg:px-10">
        <div className="mx-auto grid max-w-[1560px] gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div><div className="text-xs font-black uppercase tracking-[.35em] text-[#f5c76a]">Our Mortgage Company Network</div><h2 className="mt-4 text-4xl font-black leading-tight tracking-[-.04em] md:text-5xl">Connecting You With The Right Mortgage Company</h2><p className="mt-5 text-lg font-semibold leading-relaxed text-blue-100">HELOC CONNECT works as a connection platform. We are not a lender, mortgage company, bank, or loan originator. All approvals, rates, terms, and funding decisions are made by participating mortgage companies.</p></div>
          <div className="grid gap-5 md:grid-cols-2">
            {[
              ["Carefully Selected", "Mortgage companies in our network are selected for homeowner-focused lending pathways."],
              ["Multiple Solutions", "Explore home purchase, refinance, HELOC and cash-out options."],
              ["Consumer First", "No obligation and no direct cost to explore your options."],
              ["Secure Process", "Your information is submitted through a secure application flow."]
            ].map(([title,desc])=>(<div key={title} className="rounded-3xl border border-white/10 bg-white/[.06] p-7 shadow-2xl"><h3 className="text-2xl font-black text-[#f5c76a]">{title}</h3><p className="mt-3 font-semibold leading-relaxed text-blue-100">{desc}</p></div>))}
          </div>
        </div>
      </section>
    </main>
  );
}
