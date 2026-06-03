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

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020914] text-white">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#03101f]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a href="#home" className="flex min-w-0 items-center gap-3 text-white no-underline">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#d8a841]/60 bg-white/[.03] text-[#d8a841] sm:h-12 sm:w-12">⌂</div>
            <div className="leading-none">
              <div className="text-2xl font-black tracking-[-.05em] sm:text-3xl">HELOC</div>
              <div className="text-xs font-black uppercase tracking-[.45em] text-[#d8a841] sm:text-sm">Connect</div>
            </div>
          </a>

          <div className="hidden items-center gap-8 text-sm font-black lg:flex">
            <a href="#how" className="hover:text-[#f4c35d]">How It Works</a>
            <a href="#network" className="hover:text-[#f4c35d]">Our Network</a>
            <a href="#solutions" className="hover:text-[#f4c35d]">Solutions</a>
            <a href="/about" className="hover:text-[#f4c35d]">About Us</a>
            <a href="#reviews" className="hover:text-[#f4c35d]">Reviews</a>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <a href="tel:8339994356" className="hidden whitespace-nowrap text-sm font-black text-white md:block">☎ (833) 999-4356</a>
            <a href="#calculator" className="whitespace-nowrap rounded-xl bg-gradient-to-b from-[#ffd977] to-[#c58a24] px-4 py-3 text-sm font-black text-[#07101f] shadow-lg shadow-[#c58a24]/25 sm:px-6 sm:py-4">Explore Options</a>
          </div>
        </div>
      </nav>

      <section id="home" className="relative border-b border-white/10 bg-[radial-gradient(circle_at_30%_10%,rgba(216,168,65,.14),transparent_25%),linear-gradient(135deg,#020914_0%,#061628_60%,#020914_100%)]">
        <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_minmax(500px,620px)] lg:gap-8 lg:px-8 lg:py-10">
          <div className="min-w-0 rounded-[2rem] border border-white/10 bg-[#03101f]/70 shadow-2xl shadow-black/40 overflow-hidden">
            <div className="grid gap-0 xl:grid-cols-[.92fr_1.08fr]">
              <div className="p-5 sm:p-7 lg:p-8 xl:pr-4">
                <div className="inline-flex rounded-full border border-[#d8a841]/70 px-4 py-2 text-xs font-black uppercase tracking-[.38em] text-[#f5c861]">The Ultimate Way To</div>
                <h1 className="mt-6 text-[2.8rem] font-black leading-[.93] tracking-[-.065em] sm:text-6xl lg:text-7xl xl:text-[5.1rem]">
                  Find The Right<br />Mortgage Company
                </h1>
                <h2 className="mt-6 text-[2.15rem] font-black leading-[1.02] tracking-[-.04em] text-[#f5c861] sm:text-5xl lg:text-6xl">
                  Lower Payments.<br />More Cash.<br />Less Stress.
                </h2>
                <p className="mt-6 max-w-xl text-base font-bold leading-relaxed text-slate-100 sm:text-lg">
                  HELOC CONNECT is not a lender. We connect homeowners with carefully selected mortgage companies in our network for home purchase, refinance, HELOC and cash-out solutions.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <div className="text-2xl text-[#f5c861]">★★★★★</div>
                  <div className="text-sm font-black text-white">4.9/5 From 2,000+ Homeowners</div>
                </div>
                <div className="mt-6 max-w-sm rounded-2xl border border-[#d8a841]/45 bg-[#07182b]/80 p-4 shadow-xl">
                  <div className="flex items-center gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#d8a841]/60 text-2xl text-[#f5c861]">🛡</div>
                    <div>
                      <div className="text-lg font-black">We are not a lender.</div>
                      <div className="mt-1 text-sm font-bold text-slate-200">We connect you with mortgage companies.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative min-h-[300px] sm:min-h-[360px] xl:min-h-full">
                <img src="/hero-couple-clean.png" alt="Happy homeowners reviewing mortgage options" className="h-full min-h-[300px] w-full object-cover object-center sm:min-h-[360px] xl:min-h-full" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#03101f] via-[#03101f]/15 to-transparent xl:bg-gradient-to-r" />
              </div>
            </div>

            <div className="border-t border-white/10 bg-[#04111f]/95 p-4 sm:p-5 lg:p-6">
              <SuccessCard />
            </div>

            <div className="grid border-t border-white/10 bg-[#030d19]/95 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["🛡", "We Are Not A Lender", "We connect you with mortgage companies."],
                ["👥", "Carefully Selected Mortgage Companies", "We partner with reputable lending professionals."],
                ["🐷", "Lower Payments Better Options", "Network companies may help you save more."],
                ["🔒", "100% Free To Explore", "No obligation to move forward."]
              ].map(([icon, title, text]) => (
                <div key={title} className="border-white/10 p-5 sm:border-r last:border-r-0">
                  <div className="mb-3 text-3xl text-[#f5c861]">{icon}</div>
                  <div className="text-base font-black">{title}</div>
                  <div className="mt-2 text-sm font-semibold leading-relaxed text-slate-300">{text}</div>
                </div>
              ))}
            </div>
          </div>

          <section id="calculator" className="min-w-0 rounded-[2rem] border border-white/15 bg-[#061322]/95 p-4 shadow-2xl shadow-black/50 sm:p-5 lg:p-7">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-3xl font-black leading-tight tracking-[-.04em] sm:text-4xl">Smart Homeowner Calculator</h3>
                <p className="mt-2 text-sm font-bold text-slate-300">Address-based home value + funding preview</p>
              </div>
              <div className="w-fit rounded-full border border-emerald-300/40 bg-emerald-400/15 px-4 py-2 text-xs font-black text-emerald-200">● Powered by Real Data</div>
            </div>

            <div className="mb-6 grid grid-cols-4 gap-3 text-center text-xs font-black uppercase text-slate-300">
              {["Address", "Value", "Goals", "Options"].map((step, index) => (
                <div key={step} className="min-w-0">
                  <div className={`mx-auto mb-2 grid h-9 w-9 place-items-center rounded-full ${index === 0 ? "bg-[#f5c861] text-[#07101f]" : "bg-white/10 text-white"}`}>{index + 1}</div>
                  <div className="truncate">{step}</div>
                </div>
              ))}
            </div>

            <form onSubmit={submitLead} className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2 rounded-2xl border border-[#d8a841]/45 bg-[#091b30] p-4 sm:p-5">
                <div className="text-xs font-black uppercase tracking-[.35em] text-[#f5c861]">Step 1 of 4</div>
                <label className="mt-3 block text-lg font-black">Property Address</label>
                <p className="mb-3 text-sm font-bold leading-relaxed text-slate-300">Enter your property address to get your estimated home value.</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    className="min-w-0 flex-1 rounded-xl border border-white/15 bg-[#06101d] p-4 text-base font-semibold outline-none transition focus:border-[#f5c861]"
                    name="street_address"
                    placeholder="Enter property address"
                    value={street}
                    onChange={(e) => searchAddresses(e.target.value)}
                    autoComplete="off"
                    required
                  />
                  <button type="button" onClick={tryManualHomeValueLookup} className="rounded-xl bg-gradient-to-b from-[#ffd977] to-[#c58a24] px-5 py-4 text-sm font-black text-[#07101f] sm:w-[170px]">Get Home Value</button>
                </div>
                <input type="hidden" name="property_address" value={`${street}${unit ? " " + unit : ""}, ${city}, ${stateName} ${zip}`} />
                <p className="mt-3 text-xs font-black text-emerald-200">{addressSearching ? "Searching..." : addressLookupStatus}</p>
                {addressResults.length > 0 && (
                  <div className="mt-3 max-h-56 overflow-y-auto rounded-2xl border border-emerald-400/30 bg-[#071527] p-2 shadow-2xl">
                    {addressResults.map((result, index) => (
                      <button key={`${result.label}-${index}`} type="button" onClick={() => selectAddress(result)} className="mb-2 block w-full rounded-xl border border-white/10 bg-white/[.06] px-4 py-3 text-left text-sm font-bold text-white transition hover:border-emerald-300 hover:bg-emerald-400/10">
                        {result.label}
                      </button>
                    ))}
                  </div>
                )}
                {valueLookupStatus && <p className="mt-2 text-xs font-black text-[#f5c861]">{valueLookupStatus}</p>}
                <div className="mt-4 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[.04] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#d8a841]/50 text-[#f5c861]">⌂</div>
                    <div>
                      <div className="text-sm font-black">Estimated Home Value</div>
                      <div className="text-3xl font-black">{homeValue ? formatMoney(homeValue) : "$---"}</div>
                    </div>
                  </div>
                  <button type="button" onClick={tryManualHomeValueLookup} className="rounded-xl border border-[#d8a841]/45 px-4 py-3 text-sm font-black text-[#f5c861]">↻ Update</button>
                </div>
              </div>

              <input className="rounded-xl border border-white/15 bg-[#06101d] p-4 text-base outline-none transition focus:border-[#f5c861]" name="first_name" placeholder="First Name" required />
              <input className="rounded-xl border border-white/15 bg-[#06101d] p-4 text-base outline-none transition focus:border-[#f5c861]" name="last_name" placeholder="Last Name" required />
              <input className="rounded-xl border border-white/15 bg-[#06101d] p-4 text-base outline-none transition focus:border-[#f5c861]" name="phone" placeholder="Phone Number" required />
              <input className="rounded-xl border border-white/15 bg-[#06101d] p-4 text-base outline-none transition focus:border-[#f5c861]" name="email" placeholder="Email Address" type="email" required />
              <input className="rounded-xl border border-white/15 bg-[#06101d] p-4 text-base outline-none transition focus:border-[#f5c861]" name="unit" placeholder="Unit / Apt (optional)" value={unit} onChange={(e) => setUnit(e.target.value)} />
              <input className="rounded-xl border border-white/15 bg-[#06101d] p-4 text-base outline-none transition focus:border-[#f5c861]" name="city" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} onBlur={() => tryManualHomeValueLookup()} />
              <input className="rounded-xl border border-white/15 bg-[#06101d] p-4 text-base outline-none transition focus:border-[#f5c861]" name="state" placeholder="State" value={stateName} onChange={(e) => setStateName(e.target.value)} onBlur={() => tryManualHomeValueLookup()} />
              <input className="rounded-xl border border-white/15 bg-[#06101d] p-4 text-base outline-none transition focus:border-[#f5c861]" name="zip" placeholder="ZIP Code" value={zip} onChange={(e) => setZip(e.target.value)} onBlur={() => tryManualHomeValueLookup()} />
              <input className="rounded-xl border border-white/15 bg-[#06101d] p-4 text-base outline-none transition focus:border-[#f5c861]" name="home_value" placeholder="Estimated Market Value" value={homeValueInput} onChange={(e) => setHomeValueInput(e.target.value)} />
              <input className="rounded-xl border border-white/15 bg-[#06101d] p-4 text-base outline-none transition focus:border-[#f5c861]" name="mortgage_balance" placeholder="Current Mortgage Balance" value={mortgageBalanceInput} onChange={(e) => setMortgageBalanceInput(e.target.value)} />

              <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-[#091b30] p-4 sm:p-5">
                <div className="text-xs font-black uppercase tracking-[.35em] text-[#f5c861]">Step 2 of 4</div>
                <h4 className="mt-3 text-xl font-black">Mortgage & Payment Standing</h4>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <select className="rounded-xl border border-white/15 bg-[#06101d] p-4 text-base outline-none" name="loans_on_property" value={loansCount} onChange={(e) => setLoansCount(e.target.value)}>
                    <option value="">How many loans are on the property?</option>
                    <option>1 loan</option><option>2 loans</option><option>3+ loans</option><option>Not sure</option>
                  </select>
                  <select className="rounded-xl border border-white/15 bg-[#06101d] p-4 text-base outline-none" name="mortgage_good_standing" value={goodStanding} onChange={(e) => setGoodStanding(e.target.value)}>
                    <option value="">Mortgage payments in good standing?</option>
                    <option>Yes, current and on time</option><option>Mostly current</option><option>No / behind</option>
                  </select>
                  <select className="rounded-xl border border-white/15 bg-[#06101d] p-4 text-base outline-none sm:col-span-2" name="missed_payments_6_months" value={missedPayments} onChange={(e) => setMissedPayments(e.target.value)}>
                    <option value="">Any missed mortgage payments in the last 6 months?</option>
                    <option>No missed payments</option><option>1 missed payment</option><option>2+ missed payments</option><option>Not sure</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-[#091b30] p-4 sm:p-5">
                <div className="text-xs font-black uppercase tracking-[.35em] text-[#f5c861]">Step 3 of 4</div>
                <h4 className="mt-3 text-xl font-black">What Is Your Goal?</h4>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <select className="rounded-xl border border-white/15 bg-[#06101d] p-4 text-base outline-none sm:col-span-2" name="loan_purpose">
                    <option>HELOC / Home Equity Line</option><option>Cash-Out Refinance</option><option>Home Equity Loan</option><option>Maximum Cash-Out Review</option><option>Pay Down High-Interest Balances</option><option>Home Purchase</option><option>Refinance</option>
                  </select>
                  <input className="rounded-xl border border-white/15 bg-[#06101d] p-4 text-base outline-none" name="requested_cash" placeholder="How much funding do you want?" value={requestedCashInput} onChange={(e) => setRequestedCashInput(e.target.value)} />
                  <select className="rounded-xl border border-white/15 bg-[#06101d] p-4 text-base outline-none" name="credit_score">
                    <option value="">Credit Score Range</option><option>720+</option><option>680-719</option><option>620-679</option><option>580-619</option><option>Under 580</option>
                  </select>
                  <input className="rounded-xl border border-white/15 bg-[#06101d] p-4 text-base outline-none" name="monthly_income" placeholder="Monthly Income" />
                </div>
              </div>

              <div className="sm:col-span-2 rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-400/10 to-blue-500/10 p-4 sm:p-5">
                <div className="mb-4 text-center">
                  <div className="text-xs font-black uppercase tracking-[.32em] text-emerald-300">Smart Funding Breakdown</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <PreviewBox label="Estimated Maximum Equity Access" value={homeValue && mortgageBalance ? formatMoney(possibleRoom) : "—"} />
                  <PreviewBox label="Payment If Using Maximum Equity" value={maxCashOutPaymentPreview ? `${formatMoney(maxCashOutPaymentPreview)}/mo` : "—"} />
                  <PreviewBox label="Your Requested Funding Amount" value={requestedCash ? formatMoney(requestedCash) : "—"} />
                  <PreviewBox label="Payment For Requested Amount" value={requestedCash ? `${formatMoney(paymentPreview)}/mo` : "—"} />
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-center text-[11px] font-semibold leading-relaxed text-blue-100">Preview estimates only. Final options vary by participating mortgage company review, verified property details, equity, credit profile, documents, rates and terms.</div>
                <input type="hidden" name="possible_equity_room" value={possibleRoom} />
                <input type="hidden" name="estimated_monthly_payment" value={paymentPreview} />
                <input type="hidden" name="estimated_max_cashout_payment" value={maxCashOutPaymentPreview} />
              </div>

              <button disabled={loading} className="sm:col-span-2 rounded-xl bg-gradient-to-b from-[#ffd977] to-[#c58a24] p-4 text-lg font-black text-[#07101f] shadow-xl transition hover:-translate-y-1 hover:shadow-[#c58a24]/30">
                {loading ? "Submitting..." : "SEE MY OPTIONS"}
              </button>
              <div className="sm:col-span-2 text-center text-xs font-bold text-slate-300">This will not affect your credit score.</div>
            </form>
          </section>
        </div>
      </section>

      <section id="how" className="bg-[#040d18] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1500px] rounded-[2rem] border border-white/10 bg-[#07182b] p-6 sm:p-8">
          <div className="text-center">
            <div className="text-xs font-black uppercase tracking-[.35em] text-[#f5c861]">How It Works</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-4xl">A Simple Process That Puts You First</h2>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-5">
            {[
              ["1", "Enter Your Information", "Share your property and goals."],
              ["2", "We Find The Right Match", "We compare options from our selected network."],
              ["3", "You Get Better Options", "See real solutions designed around your goals."],
              ["4", "Review & Choose", "A mortgage company reviews and presents options."],
              ["5", "Move Forward", "Choose what works best for you."]
            ].map(([num, title, desc]) => (
              <div key={num} className="rounded-2xl border border-white/10 bg-white/[.04] p-5 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f5c861] text-xl font-black text-[#07101f]">{num}</div>
                <h3 className="mt-4 text-base font-black">{title}</h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-300">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function SuccessCard() {
  return (
    <div className="mx-auto max-w-[760px] rounded-[1.75rem] border border-white/10 bg-[#d6d1c2] p-4 text-[#07101f] shadow-2xl sm:p-5 lg:p-6">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-600 text-3xl text-white shadow-lg">✓</div>
        <div className="min-w-0">
          <h3 className="text-2xl font-black leading-tight tracking-[-.04em] sm:text-3xl">Matched To An Amazing Mortgage Company!</h3>
          <p className="mt-2 text-base font-black text-emerald-800">Example: lower payment + $100,000 cash access</p>
        </div>
      </div>
      <div className="mt-5 grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-2xl border border-slate-300 bg-slate-100 p-4 text-center">
          <div className="text-sm font-black text-slate-600">Previous Mortgage Company</div>
          <div className="mt-3 text-3xl font-black text-red-600">$2,785<span className="text-base">/mo</span></div>
          <div className="mt-2 text-sm font-black text-slate-700">$0 Cash Out</div>
        </div>
        <div className="hidden text-4xl font-black text-slate-500 sm:block">→</div>
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-center">
          <div className="text-sm font-black text-slate-600">Network Mortgage Company</div>
          <div className="mt-3 text-3xl font-black text-emerald-700">$2,125<span className="text-base">/mo</span></div>
          <div className="mt-2 text-2xl font-black text-emerald-700">$100,000</div>
        </div>
      </div>
      <div className="mt-4 rounded-xl bg-emerald-600 px-4 py-3 text-center text-base font-black text-white">$660 lower payment monthly • $100,000 cash at closing</div>
      <p className="mt-3 text-center text-xs font-bold leading-relaxed text-slate-600">Illustration only. Final options vary by qualifications and participating mortgage company review.</p>
    </div>
  );
}

function PreviewBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
      <div className="text-xs font-black uppercase tracking-[.14em] text-emerald-300">{label}</div>
      <div className="mt-2 text-2xl font-black text-white">{value}</div>
    </div>
  );
}
