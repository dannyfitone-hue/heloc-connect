"use client";

import { useMemo, useState } from "react";
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

  const inputClass = "w-full rounded-xl border border-white/15 bg-[#06101d]/90 px-4 py-3.5 text-base text-white placeholder:text-slate-400 outline-none transition focus:border-[#f6c45b] focus:bg-[#09182a]";
  const selectClass = "w-full rounded-xl border border-white/15 bg-[#07172a] px-4 py-3.5 text-base text-white outline-none transition focus:border-[#f6c45b]";

  return (
    <main className="min-h-screen bg-[#030a12] text-white">
      <section className="relative overflow-hidden bg-[#030a12]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(246,196,91,.18),transparent_24%),radial-gradient(circle_at_80%_16%,rgba(15,75,125,.38),transparent_33%),linear-gradient(135deg,#020710_0%,#061221_55%,#02060c_100%)]" />
        <div className="absolute inset-0 opacity-70" style={{backgroundImage:"linear-gradient(90deg,rgba(3,10,18,.86) 0%,rgba(3,10,18,.54) 42%,rgba(3,10,18,.9) 100%)"}} />

        <nav className="relative z-20 border-b border-white/10 bg-[#03101d]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1680px] items-center justify-between px-6 py-4 lg:px-9">
            <a href="#home" className="flex items-center gap-3 no-underline">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#f6c45b]/45 bg-[#071625] text-2xl text-[#f6c45b]">⌂</div>
              <div className="leading-none">
                <div className="text-3xl font-black tracking-[-.06em] text-white">HELOC</div>
                <div className="text-sm font-black tracking-[.42em] text-[#f6c45b]">CONNECT</div>
              </div>
            </a>
            <div className="hidden items-center gap-8 text-sm font-black lg:flex">
              <a href="#how">How It Works</a>
              <a href="#network">Our Network</a>
              <a href="#solutions">Solutions</a>
              <a href="/about">About Us</a>
              <a href="#reviews">Reviews</a>
            </div>
            <div className="flex items-center gap-5">
              <div className="hidden font-black text-white md:block">📞 (833) 999-4356</div>
              <a href="#apply" className="rounded-xl bg-gradient-to-b from-[#ffe28c] to-[#d69422] px-5 py-3 text-sm font-black text-[#07111f] shadow-lg shadow-[#d69422]/20 md:px-7">Explore My Options</a>
            </div>
          </div>
        </nav>

        <div id="home" className="relative z-10 mx-auto grid max-w-[1680px] items-stretch gap-0 px-0 lg:grid-cols-[1.36fr_1fr]">
          <div className="relative min-h-[780px] overflow-hidden lg:min-h-[860px]">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1800&q=90')] bg-cover bg-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#020811] via-[#07172a]/70 to-[#07172a]/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#030a12] via-transparent to-transparent" />

            <div className="relative z-10 flex h-full flex-col justify-between px-6 pb-8 pt-14 md:px-10 lg:px-9 xl:px-12">
              <div className="max-w-[620px] pt-6 lg:pt-12">
                <div className="mb-6 inline-flex rounded-full border border-[#f6c45b]/35 bg-black/25 px-4 py-2 text-xs font-black uppercase tracking-[.32em] text-[#f6c45b]">The Ultimate Way To</div>
                <h1 className="text-5xl font-black leading-[.98] tracking-[-.055em] text-white sm:text-6xl lg:text-7xl xl:text-[5.7rem]">
                  Find The Right<br />Mortgage Company
                </h1>
                <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-.04em] text-[#f6c45b] sm:text-5xl lg:text-[4.1rem]">
                  Lower Payments.<br />More Cash.<br />Less Stress.
                </h2>
                <p className="mt-6 max-w-[520px] text-lg font-semibold leading-relaxed text-slate-100 md:text-xl">
                  HELOC CONNECT is not a lender. We connect homeowners with carefully selected mortgage companies in our network for home purchase, refinance, HELOC and cash-out solutions.
                </p>
                <div className="mt-7 flex items-center gap-1 text-2xl text-[#f6c45b]">★★★★★ <span className="ml-3 text-base font-black text-white">4.9/5 From 2,000+ Homeowners</span></div>
                <div className="mt-6 inline-flex max-w-[340px] items-center gap-4 rounded-2xl border border-[#f6c45b]/30 bg-[#06101d]/70 p-4 backdrop-blur-xl">
                  <div className="grid h-14 w-14 place-items-center rounded-full border border-[#f6c45b]/40 text-3xl text-[#f6c45b]">♢</div>
                  <div>
                    <div className="text-lg font-black">We are not a lender.</div>
                    <div className="text-base font-semibold text-slate-200">We connect you with mortgage companies.</div>
                  </div>
                </div>
              </div>

              <div className="relative z-20 mb-4 ml-auto mr-2 w-full max-w-[540px] rounded-[2rem] border border-black/10 bg-[#d8d2c5]/90 p-5 text-[#07111f] shadow-2xl shadow-black/45 backdrop-blur-md sm:p-6 lg:mr-6 xl:mr-10">
                <div className="flex items-start gap-5">
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#0aa06f] text-4xl font-black text-white shadow-xl">✓</div>
                  <div>
                    <h3 className="text-3xl font-black leading-tight tracking-[-.04em]">Matched To An Amazing Mortgage Company!</h3>
                    <p className="mt-2 text-lg font-black text-[#047857]">Example: lower payment + $100,000 cash access</p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                  <div className="rounded-2xl border border-slate-300/80 bg-slate-100/75 p-4 text-center">
                    <div className="text-sm font-black text-slate-500">Previous Mortgage Company</div>
                    <div className="mt-5 text-4xl font-black tracking-[-.04em] text-red-600">$2,785<span className="text-lg">/mo</span></div>
                    <div className="mt-4 text-lg font-black text-slate-600">$0 Cash Out</div>
                  </div>
                  <div className="text-4xl font-black text-slate-500">→</div>
                  <div className="rounded-2xl border border-emerald-300 bg-emerald-50/75 p-4 text-center">
                    <div className="text-sm font-black text-slate-500">Network Mortgage Company</div>
                    <div className="mt-5 text-4xl font-black tracking-[-.04em] text-emerald-700">$2,125<span className="text-lg">/mo</span></div>
                    <div className="mt-4 text-3xl font-black text-emerald-700">$100,000</div>
                    <div className="text-sm font-black text-emerald-700">Cash Out</div>
                  </div>
                </div>
                <div className="mt-5 rounded-xl bg-gradient-to-r from-[#059669] to-[#11bf7f] px-4 py-4 text-center text-lg font-black text-white shadow-lg shadow-emerald-700/20">
                  $660 lower payment monthly • $100,000 cash at closing
                </div>
                <p className="mt-4 text-center text-sm font-bold leading-relaxed text-slate-600">
                  Illustration only. Final options vary by qualifications and participating mortgage company review.
                </p>
              </div>
            </div>
          </div>

          <aside id="apply" className="relative border-l border-white/10 bg-[#06101d]/95 p-5 shadow-2xl lg:p-7 xl:p-9">
            <div className="sticky top-6 rounded-[2rem] border border-white/10 bg-[#071625]/95 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl xl:p-7">
              <div className="mb-6 flex items-start justify-between gap-4">
                <h3 className="text-3xl font-black tracking-[-.04em]">Smart Homeowner Calculator</h3>
                <div className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-300">● Powered by Real Data</div>
              </div>

              <div className="mb-7 grid grid-cols-4 items-center gap-3 text-center text-xs font-black uppercase text-slate-300">
                {["Address","Value","Goals","Options"].map((step, index) => (
                  <div key={step} className="relative">
                    <div className={`mx-auto mb-2 grid h-9 w-9 place-items-center rounded-full ${index === 0 ? "bg-gradient-to-b from-[#ffe28c] to-[#d69422] text-[#07111f]" : "bg-white/10 text-white"}`}>{index + 1}</div>
                    <div className={index === 0 ? "text-[#f6c45b]" : ""}>{step}</div>
                  </div>
                ))}
              </div>

              <form onSubmit={submitLead} className="grid gap-4">
                <div className="rounded-2xl border border-[#f6c45b]/25 bg-[#08182c] p-4">
                  <div className="mb-2 text-xs font-black uppercase tracking-[.24em] text-[#f6c45b]">Step 1 of 4</div>
                  <label className="block text-lg font-black">Property Address</label>
                  <p className="mb-3 text-sm font-semibold text-slate-300">Enter your property address to get your estimated home value.</p>
                  <div className="flex gap-3">
                    <input
                      className={inputClass}
                      name="street_address"
                      placeholder="Enter property address"
                      value={street}
                      onChange={(e) => searchAddresses(e.target.value)}
                      autoComplete="off"
                      required
                    />
                    <button type="button" onClick={tryManualHomeValueLookup} className="shrink-0 rounded-xl bg-gradient-to-b from-[#ffe28c] to-[#d69422] px-5 text-sm font-black text-[#07111f]">Get Home Value</button>
                  </div>
                  <input type="hidden" name="property_address" value={`${street}${unit ? " " + unit : ""}, ${city}, ${stateName} ${zip}`} />
                  <p className="mt-2 text-xs font-black text-emerald-300">{addressSearching ? "Searching..." : addressLookupStatus}</p>
                  {addressResults.length > 0 && (
                    <div className="mt-2 max-h-56 overflow-y-auto rounded-2xl border border-[#f6c45b]/30 bg-[#071527] p-2 shadow-2xl">
                      {addressResults.map((result, index) => (
                        <button key={`${result.label}-${index}`} type="button" onClick={() => selectAddress(result)} className="mb-2 block w-full rounded-xl border border-white/10 bg-white/[.06] px-4 py-3 text-left text-sm font-bold text-white transition hover:border-[#f6c45b] hover:bg-[#f6c45b]/10">
                          {result.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[.04] p-4">
                    <div className="flex items-center gap-4">
                      <div className="grid h-14 w-14 place-items-center rounded-full border border-[#f6c45b]/35 text-3xl text-[#f6c45b]">⌂</div>
                      <div>
                        <div className="font-black">Estimated Home Value</div>
                        <div className="text-3xl font-black">{homeValue ? formatMoney(homeValue) : "$---"}</div>
                      </div>
                    </div>
                    <button type="button" onClick={tryManualHomeValueLookup} className="rounded-xl border border-[#f6c45b]/30 px-4 py-2 text-sm font-black text-[#f6c45b]">↻ Update</button>
                  </div>
                  {valueLookupStatus && <p className="mt-2 text-xs font-black text-[#f6c45b]">{valueLookupStatus}</p>}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <input className={inputClass} name="first_name" placeholder="First Name" required />
                  <input className={inputClass} name="last_name" placeholder="Last Name" required />
                  <input className={inputClass} name="phone" placeholder="Phone Number" required />
                  <input className={inputClass} name="email" placeholder="Email Address" type="email" required />
                  <input className={inputClass} name="unit" placeholder="Unit / Apt (optional)" value={unit} onChange={(e) => setUnit(e.target.value)} />
                  <input className={inputClass} name="city" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} onBlur={() => tryManualHomeValueLookup()} />
                  <input className={inputClass} name="state" placeholder="State" value={stateName} onChange={(e) => setStateName(e.target.value)} onBlur={() => tryManualHomeValueLookup()} />
                  <input className={inputClass} name="zip" placeholder="ZIP Code" value={zip} onChange={(e) => setZip(e.target.value)} onBlur={() => tryManualHomeValueLookup()} />
                  <input className={inputClass} name="home_value" placeholder="Estimated Market Value" value={homeValueInput} onChange={(e) => setHomeValueInput(e.target.value)} />
                  <input className={inputClass} name="mortgage_balance" placeholder="Current Mortgage Balance" value={mortgageBalanceInput} onChange={(e) => setMortgageBalanceInput(e.target.value)} />
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#08182c] p-4">
                  <div className="mb-2 text-xs font-black uppercase tracking-[.24em] text-[#f6c45b]">Step 2 of 4</div>
                  <label className="mb-2 block text-lg font-black">Mortgage & Payment Standing</label>
                  <div className="grid gap-3 md:grid-cols-2">
                    <select className={selectClass} name="loans_on_property" value={loansCount} onChange={(e) => setLoansCount(e.target.value)}>
                      <option value="">How many loans are on the property?</option><option>1 loan</option><option>2 loans</option><option>3+ loans</option><option>Not sure</option>
                    </select>
                    <select className={selectClass} name="mortgage_good_standing" value={goodStanding} onChange={(e) => setGoodStanding(e.target.value)}>
                      <option value="">Mortgage payments in good standing?</option><option>Yes, current and on time</option><option>Mostly current</option><option>No / behind</option>
                    </select>
                    <select className={`${selectClass} md:col-span-2`} name="missed_payments_6_months" value={missedPayments} onChange={(e) => setMissedPayments(e.target.value)}>
                      <option value="">Any missed mortgage payments in the last 6 months?</option><option>No missed payments</option><option>1 missed payment</option><option>2+ missed payments</option><option>Not sure</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#08182c] p-4">
                  <div className="mb-2 text-xs font-black uppercase tracking-[.24em] text-[#f6c45b]">Step 3 of 4</div>
                  <label className="mb-3 block text-lg font-black">What Is Your Goal?</label>
                  <select className={selectClass} name="loan_purpose">
                    <option>HELOC / Home Equity Line</option><option>Cash-Out Refinance</option><option>Home Equity Loan</option><option>Maximum Cash-Out Review</option><option>Pay Down High-Interest Balances</option><option>Home Purchase</option><option>Refinance</option>
                  </select>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <input className={inputClass} name="requested_cash" placeholder="How much funding do you want?" value={requestedCashInput} onChange={(e) => setRequestedCashInput(e.target.value)} />
                    <select className={selectClass} name="credit_score"><option value="">Credit Score Range</option><option>720+</option><option>680-719</option><option>620-679</option><option>580-619</option><option>Under 580</option></select>
                    <input className={inputClass} name="monthly_income" placeholder="Monthly Income" />
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-400/10 to-[#0b2036] p-4">
                  <div className="mb-4 text-xs font-black uppercase tracking-[.24em] text-emerald-300">Smart Funding Breakdown</div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-emerald-400/25 bg-black/20 p-4 text-center"><div className="text-xs font-black uppercase text-emerald-300">Estimated Maximum Equity Access</div><div className="mt-2 text-3xl font-black text-emerald-300">{homeValue && mortgageBalance ? formatMoney(possibleRoom) : "—"}</div></div>
                    <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center"><div className="text-xs font-black uppercase text-blue-100">Payment If Using Maximum Equity</div><div className="mt-2 text-2xl font-black text-white">{maxCashOutPaymentPreview ? `${formatMoney(maxCashOutPaymentPreview)}/mo` : "—"}</div></div>
                    <div className="rounded-xl border border-blue-300/20 bg-blue-500/10 p-4 text-center"><div className="text-xs font-black uppercase text-blue-100">Your Requested Funding Amount</div><div className="mt-2 text-3xl font-black text-white">{requestedCash ? formatMoney(requestedCash) : "—"}</div></div>
                    <div className="rounded-xl border border-[#f6c45b]/25 bg-[#f6c45b]/10 p-4 text-center"><div className="text-xs font-black uppercase text-[#f6c45b]">Payment For Requested Amount</div><div className="mt-2 text-2xl font-black text-white">{requestedCash ? `${formatMoney(paymentPreview)}/mo` : "—"}</div></div>
                  </div>
                  <div className="mt-3 text-center text-xs font-semibold text-slate-300">Preview estimates only. Final terms depend on participating mortgage company review.</div>
                  <input type="hidden" name="possible_equity_room" value={possibleRoom} />
                  <input type="hidden" name="estimated_monthly_payment" value={paymentPreview} />
                  <input type="hidden" name="estimated_max_cashout_payment" value={maxCashOutPaymentPreview} />
                </div>

                <button disabled={loading} className="rounded-xl bg-gradient-to-b from-[#ffe28c] to-[#d69422] p-5 text-lg font-black text-[#07111f] shadow-xl transition hover:-translate-y-1">
                  {loading ? "Submitting..." : "🔒 SEE MY OPTIONS"}
                </button>
                <p className="text-center text-xs font-bold text-slate-300">This will not affect your credit score.</p>
              </form>
            </div>
          </aside>
        </div>

        <div className="relative z-10 border-y border-white/10 bg-[#03101d]/95">
          <div className="mx-auto grid max-w-[1680px] gap-0 md:grid-cols-4">
            {[
              ["♢", "We Are Not A Lender", "We connect you with mortgage companies."],
              ["◎", "Carefully Selected Mortgage Companies", "We partner with reputable lending professionals."],
              ["♧", "Lower Payments Better Options", "Our network companies help you save more."],
              ["▣", "100% Free To Explore", "No obligation to move forward."]
            ].map(([icon,title,desc]) => (
              <div key={title} className="border-b border-white/10 p-6 md:border-b-0 md:border-r">
                <div className="flex items-center gap-4"><div className="text-5xl text-[#f6c45b]">{icon}</div><div><h3 className="font-black">{title}</h3><p className="mt-1 text-sm font-semibold text-slate-300">{desc}</p></div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="bg-[#f1f0ec] px-6 py-12 text-[#07111f]">
        <div className="mx-auto max-w-[1560px]">
          <div className="text-center"><p className="text-sm font-black uppercase tracking-[.35em] text-[#d69422]">How It Works</p><h2 className="mt-3 text-4xl font-black tracking-[-.04em]">A Simple Process That Puts You First</h2></div>
          <div className="mt-10 grid gap-6 md:grid-cols-5">
            {[
              ["1", "Enter Your Information", "Tell us about your property and goals."],
              ["2", "We Find The Right Match", "We compare options from our carefully selected network."],
              ["3", "You Get Better Options", "See real solutions with lower payments and more benefits."],
              ["4", "Review & Choose", "Compare offers and choose what works best for you."],
              ["5", "Move Forward With Confidence", "Close with the mortgage company you choose."]
            ].map(([num,title,desc]) => (
              <div key={title} className="text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#07111f] text-2xl font-black text-[#f6c45b]">{num}</div><h3 className="mt-4 font-black">{title}</h3><p className="mt-2 text-sm font-semibold text-slate-600">{desc}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section id="network" className="bg-[#030a12] px-6 py-14">
        <div className="mx-auto max-w-[1560px] rounded-[2rem] border border-white/10 bg-[#071625] p-8 shadow-2xl md:p-12">
          <p className="text-sm font-black uppercase tracking-[.35em] text-[#f6c45b]">Our Mortgage Company Network</p>
          <h2 className="mt-4 max-w-4xl text-4xl font-black leading-tight tracking-[-.04em] md:text-6xl">Connecting homeowners with carefully selected mortgage companies.</h2>
          <p className="mt-5 max-w-4xl text-lg font-semibold leading-relaxed text-slate-300">HELOC CONNECT is not a lender, bank, mortgage company, or loan originator. We introduce homeowners to carefully selected mortgage companies in our network. All lending decisions, approvals, rates, terms, and funding are determined solely by participating mortgage companies.</p>
        </div>
      </section>
    </main>
  );
}
