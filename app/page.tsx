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

  const inputClass = "min-w-0 rounded-[18px] border border-white/15 bg-[#071321] px-4 py-4 text-[16px] font-semibold text-white outline-none transition placeholder:text-slate-400 focus:border-[#f7c75d] focus:bg-[#0a1829]";
  const selectClass = "min-w-0 rounded-[18px] border border-white/15 bg-[#071321] px-4 py-4 text-[15px] font-bold text-white outline-none transition focus:border-[#f7c75d]";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020811] text-white">
      <section id="home" className="relative min-h-screen bg-[radial-gradient(circle_at_35%_0%,rgba(247,199,93,.16),transparent_24%),linear-gradient(135deg,#020811_0%,#06101e_48%,#02060d_100%)]">
        <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#020811]/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-4 md:px-8">
            <a href="#home" className="flex shrink-0 items-center gap-3 text-white no-underline">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#f7c75d]/45 bg-[#081321] text-xl text-[#f7c75d]">⌂</div>
              <div className="leading-none">
                <div className="text-2xl font-black tracking-[-.05em]">HELOC</div>
                <div className="text-xs font-black uppercase tracking-[.52em] text-[#f7c75d]">Connect</div>
              </div>
            </a>

            <div className="hidden items-center gap-7 text-sm font-black lg:flex xl:gap-9">
              <a href="#how">How It Works</a>
              <a href="#network">Our Network</a>
              <a href="#solutions">Solutions</a>
              <a href="/about">About Us</a>
              <a href="#reviews">Reviews</a>
              <a href="/privacy-policy">Privacy</a>
              <a href="/terms">Terms</a>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <a href="tel:8339994356" className="hidden whitespace-nowrap text-sm font-black text-[#f7c75d] xl:block">☎ (833) 999-4356</a>
              <a href="#apply" className="rounded-2xl bg-gradient-to-b from-[#ffe18b] to-[#d99324] px-4 py-3 text-sm font-black text-[#08111e] shadow-lg shadow-[#f7c75d]/20 sm:px-6 sm:py-4">
                Explore My Options
              </a>
            </div>
          </div>
        </nav>

        <div className="mx-auto grid max-w-[1500px] gap-5 px-5 py-6 md:px-8 lg:grid-cols-[minmax(0,.88fr)_minmax(430px,.72fr)] lg:gap-8 lg:py-9 xl:grid-cols-[minmax(0,1fr)_minmax(520px,.68fr)]">
          <div className="min-w-0 rounded-[34px] border border-white/10 bg-[#050e19] shadow-2xl shadow-black/35 lg:min-h-[760px]">
            <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,.92fr)_minmax(260px,.78fr)] xl:grid-cols-[minmax(0,.82fr)_minmax(390px,.88fr)]">
              <div className="relative z-10 min-w-0 p-6 sm:p-8 xl:p-10">
                <div className="inline-flex rounded-full border border-[#f7c75d]/45 bg-[#091929] px-4 py-2 text-xs font-black uppercase tracking-[.32em] text-[#f7c75d]">
                  The Ultimate Way To
                </div>
                <h1 className="mt-7 max-w-[620px] text-[43px] font-black leading-[.94] tracking-[-.075em] text-white sm:text-[58px] md:text-[72px] xl:text-[82px]">
                  Find The Right Mortgage Company
                </h1>
                <h2 className="mt-5 max-w-[580px] text-[36px] font-black leading-[.97] tracking-[-.055em] text-[#f7c75d] sm:text-[46px] md:text-[58px] xl:text-[66px]">
                  Lower Payments. More Cash. Less Stress.
                </h2>
                <p className="mt-7 max-w-[560px] text-[17px] font-bold leading-relaxed text-slate-100 sm:text-[19px]">
                  HELOC CONNECT is not a lender. We connect homeowners with carefully selected mortgage companies in our network for home purchase, refinance, HELOC and cash-out solutions.
                </p>

                <div className="mt-8 flex items-center gap-3 text-[#f7c75d]">
                  <span className="text-2xl">★★★★★</span>
                  <span className="text-sm font-black text-white sm:text-base">4.9/5 From 2,000+ Homeowners</span>
                </div>

                <div className="mt-8 max-w-[390px] rounded-3xl border border-[#f7c75d]/35 bg-[#071321]/85 p-5 shadow-xl">
                  <div className="flex items-center gap-4">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[#f7c75d]/45 text-2xl text-[#f7c75d]">🛡️</div>
                    <div>
                      <div className="text-xl font-black">We are not a lender.</div>
                      <div className="mt-1 text-sm font-bold leading-relaxed text-slate-200">We connect you with mortgage companies.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-w-0 p-4 sm:p-6 lg:pl-0 xl:p-8 xl:pl-0">
                <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#071321] shadow-2xl shadow-black/35">
                  <img src="/hero-couple-clean.png" alt="Happy homeowners reviewing mortgage options" className="h-auto w-full object-cover" />
                </div>
                <div className="mx-auto mt-5 max-w-[430px] rounded-[30px] border border-[#e1d8c6] bg-[#d9d2c4] p-5 text-[#071321] shadow-2xl shadow-black/30 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-emerald-600 text-3xl font-black text-white">✓</div>
                    <div className="min-w-0">
                      <h3 className="text-[25px] font-black leading-[1.05] tracking-[-.04em] sm:text-[31px]">Matched To An Amazing Mortgage Company!</h3>
                      <p className="mt-2 text-[15px] font-black text-emerald-700 sm:text-base">Example: lower payment + $100,000 cash access</p>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 text-center">
                      <div className="text-[13px] font-black leading-tight text-slate-500">Previous Mortgage Company</div>
                      <div className="mt-4 text-[27px] font-black tracking-[-.04em] text-red-600 sm:text-[32px]">$2,785<span className="text-base">/mo</span></div>
                      <div className="mt-2 text-sm font-black text-slate-600">$0 Cash Out</div>
                    </div>
                    <div className="text-4xl font-black text-slate-500">→</div>
                    <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-center">
                      <div className="text-[13px] font-black leading-tight text-slate-500">Network Mortgage Company</div>
                      <div className="mt-4 text-[27px] font-black tracking-[-.04em] text-emerald-700 sm:text-[32px]">$2,125<span className="text-base">/mo</span></div>
                      <div className="mt-2 text-[25px] font-black tracking-[-.04em] text-emerald-700 sm:text-[28px]">$100,000</div>
                    </div>
                  </div>
                  <div className="mt-5 rounded-2xl bg-emerald-600 px-4 py-4 text-center text-base font-black leading-snug text-white">
                    $660 lower payment monthly • $100,000 cash at closing
                  </div>
                  <p className="mt-4 text-center text-[12px] font-black leading-relaxed text-slate-600 sm:text-sm">
                    Illustration only. Final options vary by qualifications and participating mortgage company review.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-0 border-t border-white/10 md:grid-cols-4">
              {[
                ["🛡️", "We Are Not A Lender", "We connect you with mortgage companies."],
                ["👥", "Carefully Selected Mortgage Companies", "We partner with reputable lending professionals."],
                ["💰", "Lower Payments Better Options", "Our network companies help you compare options."],
                ["🔒", "100% Free To Explore", "No obligation to move forward."]
              ].map(([icon, title, desc]) => (
                <div key={title} className="min-w-0 border-white/10 p-5 md:border-r last:md:border-r-0">
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#f7c75d]/35 text-2xl text-[#f7c75d]">{icon}</div>
                    <div>
                      <h3 className="text-base font-black leading-tight">{title}</h3>
                      <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-300">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="apply" className="min-w-0 rounded-[34px] border border-white/15 bg-[#06101d] p-5 shadow-2xl shadow-black/35 sm:p-6 lg:sticky lg:top-24 lg:self-start">
            <div className="mb-5 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[.09] to-white/[.03] p-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[.32em] text-[#f7c75d]">Smart Homeowner Calculator</div>
                <h2 className="mt-2 text-[28px] font-black leading-[1.05] tracking-[-.04em] sm:text-[34px]">Address-Based Home Value + Funding Preview</h2>
              </div>
              <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-300" /> Powered by property data
              </div>
            </div>

            <form onSubmit={submitLead} className="grid gap-4">
              <div className="rounded-[24px] border border-[#f7c75d]/35 bg-[#08182b] p-5">
                <div className="text-xs font-black uppercase tracking-[.35em] text-[#f7c75d]">Step 1 of 4</div>
                <label className="mt-4 block text-lg font-black">Property Address</label>
                <input
                  className={`mt-3 w-full ${inputClass}`}
                  name="street_address"
                  placeholder="Start typing property address"
                  value={street}
                  onChange={(e) => searchAddresses(e.target.value)}
                  autoComplete="off"
                  required
                />
                <input type="hidden" name="property_address" value={`${street}${unit ? " " + unit : ""}, ${city}, ${stateName} ${zip}`} />
                <p className="mt-2 text-xs font-black text-emerald-300">{addressSearching ? "Searching..." : addressLookupStatus}</p>
                {addressResults.length > 0 && (
                  <div className="mt-3 max-h-56 overflow-y-auto rounded-2xl border border-emerald-400/30 bg-[#071527] p-2 shadow-2xl">
                    {addressResults.map((result, index) => (
                      <button key={`${result.label}-${index}`} type="button" onClick={() => selectAddress(result)} className="mb-2 block w-full rounded-xl border border-white/10 bg-white/[.06] px-4 py-3 text-left text-sm font-bold text-white transition hover:border-emerald-300 hover:bg-emerald-400/10">
                        {result.label}
                      </button>
                    ))}
                  </div>
                )}
                {valueLookupStatus && <p className="mt-2 text-xs font-black text-[#f7c75d]">{valueLookupStatus}</p>}

                <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <div className="text-sm font-black text-white">Estimated Home Value</div>
                    <input className="mt-2 w-full bg-transparent text-3xl font-black text-white outline-none placeholder:text-white" name="home_value" placeholder="$---" value={homeValueInput} onChange={(e) => setHomeValueInput(e.target.value)} />
                  </div>
                  <button type="button" onClick={tryManualHomeValueLookup} className="rounded-2xl border border-[#f7c75d]/40 px-4 py-3 text-sm font-black text-[#f7c75d]">↻ Update</button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input className={inputClass} name="first_name" placeholder="First Name" required />
                <input className={inputClass} name="last_name" placeholder="Last Name" required />
                <input className={inputClass} name="phone" placeholder="Phone Number" required />
                <input className={inputClass} name="email" placeholder="Email Address" type="email" required />
                <input className={inputClass} name="unit" placeholder="Unit / Apt (optional)" value={unit} onChange={(e) => setUnit(e.target.value)} />
                <input className={inputClass} name="city" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} onBlur={() => tryManualHomeValueLookup()} />
                <input className={inputClass} name="state" placeholder="State" value={stateName} onChange={(e) => setStateName(e.target.value)} onBlur={() => tryManualHomeValueLookup()} />
                <input className={inputClass} name="zip" placeholder="ZIP Code" value={zip} onChange={(e) => setZip(e.target.value)} onBlur={() => tryManualHomeValueLookup()} />
                <input className={inputClass} name="mortgage_balance" placeholder="Current Mortgage Balance" value={mortgageBalanceInput} onChange={(e) => setMortgageBalanceInput(e.target.value)} />
                <input className={inputClass} name="requested_cash" placeholder="How much funding do you want?" value={requestedCashInput} onChange={(e) => setRequestedCashInput(e.target.value)} />
              </div>

              <div className="rounded-[24px] border border-white/10 bg-[#08182b] p-5">
                <div className="text-xs font-black uppercase tracking-[.35em] text-[#f7c75d]">Step 2 of 4</div>
                <h3 className="mt-3 text-xl font-black">Mortgage & Payment Standing</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <select className={selectClass} name="loans_on_property" value={loansCount} onChange={(e) => setLoansCount(e.target.value)}>
                    <option value="">How many loans are on the property?</option>
                    <option>1 loan</option><option>2 loans</option><option>3+ loans</option><option>Not sure</option>
                  </select>
                  <select className={selectClass} name="mortgage_good_standing" value={goodStanding} onChange={(e) => setGoodStanding(e.target.value)}>
                    <option value="">Mortgage payments in good standing?</option>
                    <option>Yes, current and on time</option><option>Mostly current</option><option>No / behind</option>
                  </select>
                  <select className={`${selectClass} sm:col-span-2`} name="missed_payments_6_months" value={missedPayments} onChange={(e) => setMissedPayments(e.target.value)}>
                    <option value="">Any missed mortgage payments in the last 6 months?</option>
                    <option>No missed payments</option><option>1 missed payment</option><option>2+ missed payments</option><option>Not sure</option>
                  </select>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-[#08182b] p-5">
                <div className="text-xs font-black uppercase tracking-[.35em] text-[#f7c75d]">Step 3 of 4</div>
                <h3 className="mt-3 text-xl font-black">What Is Your Goal?</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <select className={`${selectClass} sm:col-span-2`} name="loan_purpose">
                    <option>HELOC / Home Equity Line</option>
                    <option>Cash-Out Refinance</option>
                    <option>Home Equity Loan</option>
                    <option>Maximum Cash-Out Review</option>
                    <option>Pay Down High-Interest Balances</option>
                  </select>
                  <select className={selectClass} name="credit_score">
                    <option value="">Credit Score Range</option>
                    <option>720+</option><option>680-719</option><option>620-679</option><option>580-619</option><option>Under 580</option>
                  </select>
                  <input className={inputClass} name="monthly_income" placeholder="Monthly Income" />
                </div>
              </div>

              <div className="rounded-[24px] border border-emerald-400/30 bg-gradient-to-br from-emerald-400/10 to-blue-500/10 p-5">
                <div className="text-center text-xs font-black uppercase tracking-[.35em] text-emerald-300">Smart Funding Breakdown</div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-400/25 bg-black/20 p-4 text-center"><div className="text-[11px] font-black uppercase tracking-[.16em] text-emerald-300">Estimated Maximum Equity Access</div><div className="mt-2 text-2xl font-black text-emerald-300">{homeValue && mortgageBalance ? formatMoney(possibleRoom) : "—"}</div></div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center"><div className="text-[11px] font-black uppercase tracking-[.16em] text-blue-200">Payment If Using Maximum Equity</div><div className="mt-2 text-2xl font-black text-white">{maxCashOutPaymentPreview ? `${formatMoney(maxCashOutPaymentPreview)}/mo` : "—"}</div></div>
                  <div className="rounded-2xl border border-blue-300/25 bg-blue-500/10 p-4 text-center"><div className="text-[11px] font-black uppercase tracking-[.16em] text-blue-200">Your Requested Funding Amount</div><div className="mt-2 text-2xl font-black text-white">{requestedCash ? formatMoney(requestedCash) : "—"}</div></div>
                  <div className="rounded-2xl border border-[#f7c75d]/25 bg-[#f7c75d]/10 p-4 text-center"><div className="text-[11px] font-black uppercase tracking-[.16em] text-[#f7c75d]">Payment For Requested Amount</div><div className="mt-2 text-2xl font-black text-white">{requestedCash ? `${formatMoney(paymentPreview)}/mo` : "—"}</div></div>
                </div>
                <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center text-[11px] font-semibold leading-relaxed text-blue-100">
                  Preview estimates only. Final options vary by participating mortgage company review, verified property details, equity, credit profile, documents, rates and terms.
                </p>
                <input type="hidden" name="possible_equity_room" value={possibleRoom} />
                <input type="hidden" name="estimated_monthly_payment" value={paymentPreview} />
                <input type="hidden" name="estimated_max_cashout_payment" value={maxCashOutPaymentPreview} />
              </div>

              <button disabled={loading} className="rounded-[18px] bg-gradient-to-b from-[#ffe18b] to-[#d99324] p-5 text-lg font-black text-[#071321] shadow-xl shadow-[#f7c75d]/20 transition hover:-translate-y-1">
                {loading ? "Submitting..." : "SEE MY OPTIONS"}
              </button>
              <div className="text-center text-xs font-black text-slate-300">This will not affect your credit score.</div>
            </form>
          </div>
        </div>
      </section>

      <section id="how" className="border-t border-white/10 bg-[#040b14] px-5 py-14 md:px-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[.35em] text-[#f7c75d]">How It Works</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-.04em] sm:text-5xl">A Simple Process That Puts You First</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-5">
            {[
              ["1", "Enter Your Address", "Get an estimated property value."],
              ["2", "Share Your Goal", "Tell us what you are trying to accomplish."],
              ["3", "We Find Matches", "We connect you with selected mortgage companies."],
              ["4", "Review Options", "Mortgage companies review and present options."],
              ["5", "Move Forward", "Choose the option that works for you."]
            ].map(([num, title, desc]) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-white/[.045] p-5 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f7c75d] text-lg font-black text-[#071321]">{num}</div>
                <h3 className="mt-4 text-lg font-black">{title}</h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-300">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
