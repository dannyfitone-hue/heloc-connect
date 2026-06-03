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

  const inputClass = "w-full rounded-2xl border border-white/15 bg-[#071321] px-4 py-3.5 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-[#f2bc53] focus:bg-[#0b1a2c]";
  const selectClass = "w-full rounded-2xl border border-white/15 bg-[#071321] px-4 py-3.5 text-sm text-white outline-none transition focus:border-[#f2bc53]";

  return (
    <main className="min-h-screen bg-[#020913] text-white">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_0%,rgba(242,188,83,.16),transparent_28%),linear-gradient(135deg,#020913_0%,#051426_52%,#020913_100%)]">
        <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#020913]/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <a href="#home" className="flex shrink-0 items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#f2bc53]/50 bg-[#071321] text-[#f2bc53] shadow-lg shadow-black/30">⌂</div>
              <div className="leading-none">
                <div className="text-2xl font-black tracking-[-.06em] sm:text-3xl">HELOC</div>
                <div className="text-xs font-black tracking-[.42em] text-[#f2bc53] sm:text-sm">CONNECT</div>
              </div>
            </a>

            <div className="hidden items-center gap-7 text-sm font-black text-white/90 xl:flex">
              <a href="#how" className="hover:text-[#f2bc53]">How It Works</a>
              <a href="#network" className="hover:text-[#f2bc53]">Our Network</a>
              <a href="#solutions" className="hover:text-[#f2bc53]">Solutions</a>
              <a href="/about" className="hover:text-[#f2bc53]">About Us</a>
              <a href="#reviews" className="hover:text-[#f2bc53]">Reviews</a>
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
              <a href="tel:8339994356" className="hidden whitespace-nowrap text-sm font-black text-white lg:block">☎ (833) 999-4356</a>
              <a href="#apply" className="whitespace-nowrap rounded-2xl bg-gradient-to-b from-[#ffd56f] to-[#c88620] px-4 py-3 text-sm font-black text-[#071321] shadow-xl shadow-[#f2bc53]/20 sm:px-6 sm:py-4">
                Explore My Options
              </a>
            </div>
          </div>
        </nav>

        <div id="home" className="mx-auto grid max-w-[1500px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,.82fr)] lg:px-8 lg:py-10 xl:gap-10">
          <div className="min-w-0">
            <div className="grid gap-8 xl:grid-cols-[.78fr_1.05fr] xl:items-center">
              <div className="relative z-10">
                <div className="mb-5 inline-flex rounded-full border border-[#f2bc53]/45 bg-black/25 px-5 py-2 text-xs font-black uppercase tracking-[.35em] text-[#f2bc53]">
                  The Ultimate Way To
                </div>
                <h1 className="max-w-[560px] text-5xl font-black leading-[.98] tracking-[-.06em] sm:text-6xl lg:text-7xl xl:text-[76px]">
                  Find The Right Mortgage Company
                </h1>
                <h2 className="mt-6 max-w-[520px] text-4xl font-black leading-[1.02] tracking-[-.04em] text-[#f2bc53] sm:text-5xl lg:text-6xl">
                  Lower Payments. More Cash. Less Stress.
                </h2>
                <p className="mt-7 max-w-[510px] text-base font-bold leading-relaxed text-slate-100 sm:text-lg">
                  HELOC CONNECT is not a lender. We connect homeowners with carefully selected mortgage companies in our network for home purchase, refinance, HELOC and cash-out solutions.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <span className="text-2xl text-[#f2bc53]">★★★★★</span>
                  <span className="text-sm font-black text-white sm:text-base">4.9/5 From 2,000+ Homeowners</span>
                </div>

                <div className="mt-7 max-w-[390px] rounded-3xl border border-[#f2bc53]/35 bg-[#071321]/85 p-5 shadow-2xl backdrop-blur-xl">
                  <div className="flex gap-4">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[#f2bc53]/45 text-2xl text-[#f2bc53]">🛡️</div>
                    <div>
                      <div className="text-lg font-black">We are not a lender.</div>
                      <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-200">We connect you with mortgage companies. They make the lending decisions.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative min-h-[520px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#06101d] shadow-2xl shadow-black/40 sm:min-h-[620px] xl:min-h-[670px]">
                <div className="absolute inset-0 bg-[url('/hero-couple-clean.png')] bg-cover bg-center" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#020913]/75 via-[#020913]/25 to-transparent" />
                <div className="absolute inset-x-4 bottom-4 sm:inset-x-8 sm:bottom-8">
                  <div className="mx-auto max-w-[560px] rounded-[2rem] border border-white/20 bg-[#d9d2c3]/90 p-5 text-[#071321] shadow-2xl backdrop-blur-md sm:p-6">
                    <div className="flex gap-4">
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-emerald-600 text-3xl text-white shadow-lg">✓</div>
                      <div>
                        <h3 className="text-2xl font-black leading-tight sm:text-3xl">Matched To An Amazing Mortgage Company!</h3>
                        <p className="mt-2 text-sm font-black text-emerald-700 sm:text-base">Example: lower payment + $100,000 cash access</p>
                      </div>
                    </div>
                    <div className="mt-5 grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
                      <div className="rounded-2xl border border-slate-300/80 bg-slate-100/80 p-4 text-center">
                        <div className="text-sm font-black text-slate-600">Previous Mortgage Company</div>
                        <div className="mt-3 text-3xl font-black text-red-600">$2,785<span className="text-base">/mo</span></div>
                        <div className="mt-2 text-sm font-black text-slate-600">$0 Cash Out</div>
                      </div>
                      <div className="hidden text-3xl font-black text-slate-500 sm:block">→</div>
                      <div className="rounded-2xl border border-emerald-300 bg-emerald-50/85 p-4 text-center">
                        <div className="text-sm font-black text-slate-600">Network Mortgage Company</div>
                        <div className="mt-3 text-3xl font-black text-emerald-700">$2,125<span className="text-base">/mo</span></div>
                        <div className="mt-2 text-2xl font-black text-emerald-700">$100,000</div>
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl bg-emerald-600 px-4 py-3 text-center text-sm font-black text-white sm:text-base">
                      $660 lower payment monthly • $100,000 cash at closing
                    </div>
                    <p className="mt-3 text-center text-xs font-bold leading-relaxed text-slate-600">Illustration only. Final options vary by qualifications and participating mortgage company review.</p>
                  </div>
                </div>
              </div>
            </div>

            <div id="network" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["🛡️", "We Are Not A Lender", "We connect you with mortgage companies."],
                ["👥", "Carefully Selected Mortgage Companies", "We partner with reputable lending professionals."],
                ["🐖", "Lower Payments Better Options", "Network companies may help you save more."],
                ["🔒", "100% Free To Explore", "No obligation to move forward."]
              ].map(([icon, title, desc]) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-[#06101d]/80 p-5 shadow-xl backdrop-blur-xl">
                  <div className="text-4xl text-[#f2bc53]">{icon}</div>
                  <h3 className="mt-3 text-base font-black">{title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-300">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <aside id="apply" className="min-w-0 rounded-[2rem] border border-white/12 bg-[#04111f]/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-6 lg:sticky lg:top-28 lg:self-start">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h3 className="text-3xl font-black tracking-[-.04em] sm:text-4xl">Smart Homeowner Calculator</h3>
              <div className="w-fit rounded-full border border-emerald-400/35 bg-emerald-500/15 px-4 py-2 text-xs font-black text-emerald-300">● Powered by Real Data</div>
            </div>

            <div className="mb-5 grid grid-cols-4 gap-2 text-center text-[11px] font-black uppercase text-slate-300 sm:text-xs">
              {["Address", "Value", "Goals", "Options"].map((label, i) => (
                <div key={label} className="rounded-2xl bg-white/[.06] p-3">
                  <div className={`mx-auto mb-2 grid h-8 w-8 place-items-center rounded-full ${i === 0 ? "bg-[#f2bc53] text-[#071321]" : "bg-slate-700 text-white"}`}>{i + 1}</div>
                  {label}
                </div>
              ))}
            </div>

            <form onSubmit={submitLead} className="grid gap-4">
              <section className="rounded-3xl border border-[#f2bc53]/35 bg-[#07192c] p-4 sm:p-5">
                <div className="text-xs font-black uppercase tracking-[.32em] text-[#f2bc53]">Step 1 of 4</div>
                <h4 className="mt-3 text-xl font-black">Property Address</h4>
                <p className="mt-1 text-sm font-semibold text-slate-300">Enter your property address to get your estimated home value.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    className={inputClass}
                    name="street_address"
                    placeholder="Enter property address"
                    value={street}
                    onChange={(e) => searchAddresses(e.target.value)}
                    autoComplete="off"
                    required
                  />
                  <button type="button" onClick={tryManualHomeValueLookup} className="rounded-2xl bg-gradient-to-b from-[#ffd56f] to-[#c88620] px-5 py-3 text-sm font-black text-[#071321]">
                    Get Home Value
                  </button>
                </div>
                <input type="hidden" name="property_address" value={`${street}${unit ? " " + unit : ""}, ${city}, ${stateName} ${zip}`} />
                <p className="mt-3 text-xs font-black text-emerald-300">{addressSearching ? "Searching..." : addressLookupStatus}</p>
                {addressResults.length > 0 && (
                  <div className="mt-3 max-h-56 overflow-y-auto rounded-2xl border border-emerald-400/30 bg-[#071527] p-2 shadow-2xl">
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
                {valueLookupStatus && <p className="mt-2 text-xs font-black text-[#f2bc53]">{valueLookupStatus}</p>}
                <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[.05] p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-full border border-[#f2bc53]/40 text-[#f2bc53]">⌂</div>
                    <div>
                      <div className="text-sm font-black">Estimated Home Value</div>
                      <div className="text-3xl font-black">{homeValue ? formatMoney(homeValue) : "$---"}</div>
                    </div>
                  </div>
                  <button type="button" onClick={tryManualHomeValueLookup} className="rounded-2xl border border-[#f2bc53]/35 px-4 py-3 text-sm font-black text-[#f2bc53]">↻ Update</button>
                </div>
              </section>

              <div className="grid gap-3 sm:grid-cols-2">
                <input className={inputClass} name="first_name" placeholder="First Name" required />
                <input className={inputClass} name="last_name" placeholder="Last Name" required />
                <input className={inputClass} name="phone" placeholder="Phone Number" required />
                <input className={inputClass} name="email" placeholder="Email Address" type="email" required />
                <input className={inputClass} name="unit" placeholder="Unit / Apt (optional)" value={unit} onChange={(e) => setUnit(e.target.value)} />
                <input className={inputClass} name="city" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                <input className={inputClass} name="state" placeholder="State" value={stateName} onChange={(e) => setStateName(e.target.value)} />
                <input className={inputClass} name="zip" placeholder="ZIP Code" value={zip} onChange={(e) => setZip(e.target.value)} />
                <input className={inputClass} name="estimated_home_value" placeholder="Estimated Market Value" value={homeValueInput} onChange={(e) => setHomeValueInput(e.target.value)} />
                <input className={inputClass} name="mortgage_balance" placeholder="Current Mortgage Balance" value={mortgageBalanceInput} onChange={(e) => setMortgageBalanceInput(e.target.value)} />
              </div>

              <section className="rounded-3xl border border-white/10 bg-[#07192c] p-4 sm:p-5">
                <div className="text-xs font-black uppercase tracking-[.32em] text-[#f2bc53]">Step 2 of 4</div>
                <h4 className="mt-3 text-xl font-black">Mortgage & Payment Standing</h4>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <select className={selectClass} name="loans_count" value={loansCount} onChange={(e) => setLoansCount(e.target.value)}>
                    <option value="">How many loans on the property?</option>
                    <option>1 loan</option>
                    <option>2 loans</option>
                    <option>3+ loans</option>
                    <option>Not sure</option>
                  </select>
                  <select className={selectClass} name="mortgage_good_standing" value={goodStanding} onChange={(e) => setGoodStanding(e.target.value)}>
                    <option value="">Mortgage payments in good standing?</option>
                    <option>Yes, current</option>
                    <option>Behind or struggling</option>
                    <option>Not sure</option>
                  </select>
                  <select className={`${selectClass} sm:col-span-2`} name="missed_payments_6_months" value={missedPayments} onChange={(e) => setMissedPayments(e.target.value)}>
                    <option value="">Any missed mortgage payments in the last 6 months?</option>
                    <option>No missed payments</option>
                    <option>1 missed payment</option>
                    <option>2+ missed payments</option>
                    <option>Not sure</option>
                  </select>
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-[#07192c] p-4 sm:p-5">
                <div className="text-xs font-black uppercase tracking-[.32em] text-[#f2bc53]">Step 3 of 4</div>
                <h4 className="mt-3 text-xl font-black">What Is Your Goal?</h4>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <select className={`${selectClass} sm:col-span-2`} name="loan_purpose">
                    <option>HELOC / Home Equity Line</option>
                    <option>Cash-Out Refinance</option>
                    <option>Home Purchase</option>
                    <option>Home Equity Loan</option>
                    <option>Maximum Cash-Out Review</option>
                    <option>Pay Down High-Interest Balances</option>
                  </select>
                  <input className={inputClass} name="requested_cash" placeholder="How much funding do you want?" value={requestedCashInput} onChange={(e) => setRequestedCashInput(e.target.value)} />
                  <select className={selectClass} name="credit_score">
                    <option value="">Credit Score Range</option>
                    <option>720+</option>
                    <option>680-719</option>
                    <option>620-679</option>
                    <option>580-619</option>
                    <option>Under 580</option>
                  </select>
                  <input className={inputClass} name="monthly_income" placeholder="Monthly Income" />
                </div>
              </section>

              <section className="rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-emerald-400/10 to-blue-500/10 p-4 sm:p-5">
                <div className="mb-4 text-center">
                  <div className="text-xs font-black uppercase tracking-[.32em] text-emerald-300">Smart Funding Breakdown</div>
                  <p className="mt-2 text-xs font-semibold text-blue-100">Preview maximum equity separately from the amount you want to request.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-400/30 bg-black/25 p-4 text-center">
                    <div className="text-xs font-black uppercase tracking-[.12em] text-emerald-300">Estimated Maximum Equity Access</div>
                    <div className="mt-2 text-2xl font-black text-emerald-300">{homeValue && mortgageBalance ? formatMoney(possibleRoom) : "—"}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
                    <div className="text-xs font-black uppercase tracking-[.12em] text-blue-200">Payment If Using Maximum Equity</div>
                    <div className="mt-2 text-2xl font-black text-white">{maxCashOutPaymentPreview ? `${formatMoney(maxCashOutPaymentPreview)}/mo` : "—"}</div>
                  </div>
                  <div className="rounded-2xl border border-blue-300/30 bg-blue-500/10 p-4 text-center">
                    <div className="text-xs font-black uppercase tracking-[.12em] text-blue-200">Your Requested Funding Amount</div>
                    <div className="mt-2 text-2xl font-black text-white">{requestedCash ? formatMoney(requestedCash) : "—"}</div>
                  </div>
                  <div className="rounded-2xl border border-[#f2bc53]/30 bg-[#f2bc53]/10 p-4 text-center">
                    <div className="text-xs font-black uppercase tracking-[.12em] text-[#f2bc53]">Payment For Requested Amount</div>
                    <div className="mt-2 text-2xl font-black text-white">{requestedCash ? `${formatMoney(paymentPreview)}/mo` : "—"}</div>
                  </div>
                </div>
                <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-center text-[11px] font-semibold leading-relaxed text-blue-100">Preview estimates only. Final terms depend on mortgage company review, verified property details, equity, credit profile, and documents.</p>
                <input type="hidden" name="possible_equity_room" value={possibleRoom} />
                <input type="hidden" name="estimated_monthly_payment" value={paymentPreview} />
                <input type="hidden" name="estimated_max_cashout_payment" value={maxCashOutPaymentPreview} />
              </section>

              <button disabled={loading} className="rounded-2xl bg-gradient-to-b from-[#ffd56f] to-[#c88620] p-5 text-lg font-black text-[#071321] shadow-xl shadow-[#f2bc53]/20 transition hover:-translate-y-1 disabled:opacity-60">
                {loading ? "Submitting..." : "SEE MY OPTIONS"}
              </button>
              <p className="text-center text-xs font-semibold text-slate-300">This will not affect your credit score</p>
            </form>
          </aside>
        </div>

        <section id="how" className="mx-auto max-w-[1500px] px-4 pb-14 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-[#06101d]/85 p-6 shadow-2xl sm:p-8">
            <div className="text-center">
              <div className="text-xs font-black uppercase tracking-[.35em] text-[#f2bc53]">How It Works</div>
              <h2 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-4xl">A Simple Process That Puts You First</h2>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["1", "Enter Your Information", "Share property details and goals."],
                ["2", "We Find The Right Match", "We compare options from our selected network."],
                ["3", "You Get Better Options", "Review real solutions with lower payment possibilities."],
                ["4", "Review & Choose", "Compare offers and choose what works best."],
                ["5", "Move Forward", "Close with the mortgage company you choose."]
              ].map(([num, title, desc]) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-white/[.04] p-5 text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f2bc53] text-lg font-black text-[#071321]">{num}</div>
                  <h3 className="mt-4 text-base font-black">{title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-300">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
