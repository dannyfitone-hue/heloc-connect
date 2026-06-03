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

  const goals = [
    ["Home Purchase", "Find a mortgage company for your next home."],
    ["Refinance", "Explore options to lower payments or improve terms."],
    ["HELOC", "Access home equity without changing your first mortgage."],
    ["Cash-Out Refinance", "Compare whether cash-out makes sense for your goals."]
  ];

  return (
    <main className="min-h-screen bg-[#020711] text-white">
      <section
        id="home"
        className="relative overflow-hidden border-b border-[#d7aa55]/20"
        style={{
          backgroundImage:
            "linear-gradient(90deg,rgba(2,7,17,.98) 0%,rgba(2,7,17,.86) 32%,rgba(2,7,17,.44) 55%,rgba(2,7,17,.9) 100%), url('https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2400&q=90')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(215,170,85,.20),transparent_26%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,.08),transparent_22%)]" />

        <nav className="relative z-20 mx-auto flex max-w-[1580px] items-center justify-between px-5 py-5 md:px-10">
          <a href="#home" className="flex items-center gap-3 text-white">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#d7aa55]/50 bg-[#d7aa55]/10 text-2xl text-[#f4c76c] shadow-[0_0_30px_rgba(215,170,85,.22)]">⌂</div>
            <div>
              <div className="text-2xl font-black leading-none tracking-[.04em]">HELOC</div>
              <div className="text-xs font-black tracking-[.45em] text-[#f4c76c]">CONNECT</div>
            </div>
          </a>

          <div className="hidden items-center gap-8 text-sm font-bold text-white/90 lg:flex">
            <a href="#how">How It Works</a>
            <a href="#network">Our Network</a>
            <a href="#solutions">Solutions</a>
            <a href="#reviews">Reviews</a>
            <a href="/about">About Us</a>
            <a href="/privacy-policy">Privacy</a>
            <a href="/terms">Terms</a>
          </div>

          <div className="hidden items-center gap-5 md:flex">
            <a href="tel:8339994356" className="font-black text-[#f4c76c]">☎ (833) 999-4356</a>
            <a href="#apply" className="rounded-xl bg-gradient-to-b from-[#ffe39a] to-[#c98924] px-6 py-3 text-sm font-black text-[#07101d] shadow-[0_12px_40px_rgba(215,170,85,.30)]">Explore My Options</a>
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid max-w-[1580px] gap-9 px-5 pb-10 pt-8 md:px-10 lg:grid-cols-[.98fr_.9fr] lg:pb-14 lg:pt-16">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit rounded-full border border-[#d7aa55]/40 bg-black/30 px-5 py-2 text-xs font-black uppercase tracking-[.32em] text-[#f4c76c] backdrop-blur">The ultimate way to</div>
            <h1 className="max-w-3xl text-5xl font-black leading-[.95] tracking-[-.055em] md:text-7xl xl:text-8xl">
              Find The Right <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#fff0bd] to-[#d79b35]">Mortgage Company</span>
            </h1>
            <h2 className="mt-6 max-w-3xl text-3xl font-black leading-tight text-[#f4c76c] md:text-5xl">
              Lower Payments. More Cash. Less Stress.
            </h2>
            <p className="mt-6 max-w-2xl text-lg font-semibold leading-relaxed text-slate-100 md:text-xl">
              HELOC CONNECT is not a lender or mortgage company. We connect homeowners with carefully selected mortgage companies in our network for home purchase, refinance and HELOC solutions.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a href="#apply" className="inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-[#ffe39a] to-[#c98924] px-8 py-4 text-lg font-black text-[#07101d] shadow-[0_16px_55px_rgba(215,170,85,.35)] transition hover:-translate-y-1">Check My Options →</a>
              <div className="inline-flex items-center gap-3 rounded-xl border border-white/15 bg-black/35 px-5 py-4 font-bold text-white/90 backdrop-blur">
                <span className="text-[#f4c76c]">🔒</span> Secure, private, no impact to credit
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#d7aa55]/30 bg-black/35 p-4 backdrop-blur">
                <div className="text-2xl text-[#f4c76c]">◎</div>
                <div className="mt-2 text-sm font-black uppercase tracking-[.16em] text-[#f4c76c]">Selected Network</div>
                <p className="mt-2 text-sm font-semibold text-slate-200">Carefully selected mortgage companies.</p>
              </div>
              <div className="rounded-2xl border border-[#d7aa55]/30 bg-black/35 p-4 backdrop-blur">
                <div className="text-2xl text-[#f4c76c]">◇</div>
                <div className="mt-2 text-sm font-black uppercase tracking-[.16em] text-[#f4c76c]">Consumer First</div>
                <p className="mt-2 text-sm font-semibold text-slate-200">You choose whether to move forward.</p>
              </div>
              <div className="rounded-2xl border border-[#d7aa55]/30 bg-black/35 p-4 backdrop-blur">
                <div className="text-2xl text-[#f4c76c]">▣</div>
                <div className="mt-2 text-sm font-black uppercase tracking-[.16em] text-[#f4c76c]">Private Portal</div>
                <p className="mt-2 text-sm font-semibold text-slate-200">Status updates after submission.</p>
              </div>
            </div>
          </div>

          <div id="apply" className="rounded-[2rem] border border-[#d7aa55]/45 bg-[#06101d]/88 p-4 shadow-[0_25px_90px_rgba(0,0,0,.55)] backdrop-blur-2xl md:p-6">
            <div className="mb-5 rounded-[1.6rem] border border-white/10 bg-gradient-to-br from-white/[.10] to-white/[.03] p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-sm font-black uppercase tracking-[.22em] text-[#f4c76c]">Smart Homeowner Calculator</div>
                  <h3 className="mt-2 text-2xl font-black tracking-[-.03em] md:text-3xl">Address-Based Home Value + Funding Preview</h3>
                </div>
                <div className="w-fit rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-300">● Powered by property data</div>
              </div>
            </div>

            <form onSubmit={submitLead} className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2 rounded-2xl border border-[#d7aa55]/35 bg-[#d7aa55]/10 p-4">
                <div className="text-xs font-black uppercase tracking-[.26em] text-[#f4c76c]">Step 1 — Property Address</div>
                <input
                  className="mt-3 w-full rounded-xl border border-[#d7aa55]/35 bg-black/35 p-4 text-base text-white outline-none transition placeholder:text-slate-400 focus:border-[#ffe39a]"
                  name="street_address"
                  placeholder="Start typing your property address"
                  value={street}
                  onChange={(e) => searchAddresses(e.target.value)}
                  autoComplete="off"
                  required
                />
                <input type="hidden" name="property_address" value={`${street}${unit ? " " + unit : ""}, ${city}, ${stateName} ${zip}`} />
                <p className="mt-2 text-xs font-black text-emerald-200">{addressSearching ? "Searching..." : addressLookupStatus}</p>
                {addressResults.length > 0 && (
                  <div className="mt-2 max-h-56 overflow-y-auto rounded-2xl border border-[#d7aa55]/30 bg-[#071527] p-2 shadow-2xl">
                    {addressResults.map((result, index) => (
                      <button
                        key={`${result.label}-${index}`}
                        type="button"
                        onClick={() => selectAddress(result)}
                        className="mb-2 block w-full rounded-xl border border-white/10 bg-white/[.06] px-4 py-3 text-left text-sm font-bold text-white transition hover:border-[#f4c76c] hover:bg-[#d7aa55]/10"
                      >
                        {result.label}
                      </button>
                    ))}
                  </div>
                )}
                {valueLookupStatus && <p className="mt-2 text-xs font-black text-[#f4c76c]">{valueLookupStatus}</p>}
              </div>

              <input className="rounded-xl border border-white/15 bg-white/10 p-3.5 text-base text-white outline-none placeholder:text-slate-400 focus:border-[#f4c76c]" name="first_name" placeholder="First Name" required />
              <input className="rounded-xl border border-white/15 bg-white/10 p-3.5 text-base text-white outline-none placeholder:text-slate-400 focus:border-[#f4c76c]" name="last_name" placeholder="Last Name" required />
              <input className="rounded-xl border border-white/15 bg-white/10 p-3.5 text-base text-white outline-none placeholder:text-slate-400 focus:border-[#f4c76c]" name="phone" placeholder="Phone Number" required />
              <input className="rounded-xl border border-white/15 bg-white/10 p-3.5 text-base text-white outline-none placeholder:text-slate-400 focus:border-[#f4c76c]" name="email" placeholder="Email Address" type="email" required />

              <input className="rounded-xl border border-white/15 bg-white/10 p-3.5 text-base text-white outline-none placeholder:text-slate-400 focus:border-[#f4c76c]" name="unit" placeholder="Unit / Apt (optional)" value={unit} onChange={(e) => setUnit(e.target.value)} />
              <input className="rounded-xl border border-white/15 bg-white/10 p-3.5 text-base text-white outline-none placeholder:text-slate-400 focus:border-[#f4c76c]" name="city" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} onBlur={() => tryManualHomeValueLookup()} />
              <input className="rounded-xl border border-white/15 bg-white/10 p-3.5 text-base text-white outline-none placeholder:text-slate-400 focus:border-[#f4c76c]" name="state" placeholder="State" value={stateName} onChange={(e) => setStateName(e.target.value)} onBlur={() => tryManualHomeValueLookup()} />
              <input className="rounded-xl border border-white/15 bg-white/10 p-3.5 text-base text-white outline-none placeholder:text-slate-400 focus:border-[#f4c76c]" name="zip" placeholder="ZIP Code" value={zip} onChange={(e) => setZip(e.target.value)} onBlur={() => tryManualHomeValueLookup()} />

              <div>
                <input
                  className="w-full rounded-xl border border-[#d7aa55]/35 bg-black/30 p-3.5 text-base text-white outline-none placeholder:text-slate-400 focus:border-[#ffe39a]"
                  name="home_value"
                  placeholder="Estimated Market Value — Auto-filled after address selection"
                  value={homeValueInput}
                  onChange={(e) => setHomeValueInput(e.target.value)}
                />
                <button type="button" onClick={tryManualHomeValueLookup} className="mt-2 w-full rounded-xl border border-[#d7aa55]/35 bg-[#d7aa55]/10 px-3 py-2 text-xs font-black text-[#f4c76c] transition hover:bg-[#d7aa55]/20">
                  Refresh Home Value
                </button>
              </div>
              <input
                className="rounded-xl border border-[#d7aa55]/35 bg-black/30 p-3.5 text-base text-white outline-none placeholder:text-slate-400 focus:border-[#ffe39a]"
                name="mortgage_balance"
                placeholder="Current Mortgage Balance"
                value={mortgageBalanceInput}
                onChange={(e) => setMortgageBalanceInput(e.target.value)}
              />

              <select className="rounded-xl border border-white/15 bg-[#071527] p-3.5 text-base text-white outline-none focus:border-[#f4c76c]" name="loans_on_property" value={loansCount} onChange={(e) => setLoansCount(e.target.value)}>
                <option value="">How many loans are on the property?</option>
                <option>1 loan</option><option>2 loans</option><option>3+ loans</option><option>Not sure</option>
              </select>
              <select className="rounded-xl border border-white/15 bg-[#071527] p-3.5 text-base text-white outline-none focus:border-[#f4c76c]" name="mortgage_good_standing" value={goodStanding} onChange={(e) => setGoodStanding(e.target.value)}>
                <option value="">Mortgage payments in good standing?</option>
                <option>Yes, current and on time</option><option>Mostly current</option><option>No / behind</option>
              </select>
              <select className="rounded-xl border border-white/15 bg-[#071527] p-3.5 text-base text-white outline-none focus:border-[#f4c76c] md:col-span-2" name="missed_payments_6_months" value={missedPayments} onChange={(e) => setMissedPayments(e.target.value)}>
                <option value="">Any missed mortgage payments in the last 6 months?</option>
                <option>No missed payments</option><option>1 missed payment</option><option>2+ missed payments</option><option>Not sure</option>
              </select>

              <input
                className="rounded-xl border border-[#d7aa55]/35 bg-black/30 p-3.5 text-base text-white outline-none placeholder:text-slate-400 focus:border-[#ffe39a]"
                name="requested_cash"
                placeholder="How much funding do you want?"
                value={requestedCashInput}
                onChange={(e) => setRequestedCashInput(e.target.value)}
              />
              <select className="rounded-xl border border-white/15 bg-[#071527] p-3.5 text-base text-white outline-none focus:border-[#f4c76c]" name="credit_score">
                <option value="">Credit Score Range</option>
                <option>720+</option><option>680-719</option><option>620-679</option><option>580-619</option><option>Under 580</option>
              </select>

              <input className="rounded-xl border border-white/15 bg-white/10 p-3.5 text-base text-white outline-none placeholder:text-slate-400 focus:border-[#f4c76c]" name="monthly_income" placeholder="Monthly Income" />
              <select className="rounded-xl border border-white/15 bg-[#071527] p-3.5 text-base text-white outline-none focus:border-[#f4c76c]" name="loan_purpose">
                <option>HELOC / Home Equity Line</option>
                <option>Cash-Out Refinance</option>
                <option>Home Equity Loan</option>
                <option>Maximum Cash-Out Review</option>
                <option>Pay Down High-Interest Balances</option>
              </select>

              <div className="md:col-span-2 rounded-2xl border border-[#d7aa55]/35 bg-gradient-to-br from-[#d7aa55]/12 to-white/[.03] p-4 shadow-xl">
                <div className="mb-4 text-center">
                  <div className="text-xs font-black uppercase tracking-[.26em] text-[#f4c76c]">Smart Funding Breakdown</div>
                  <p className="mt-2 text-xs font-semibold text-blue-100">See your maximum equity potential separately from the amount you personally want to request.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#d7aa55]/30 bg-black/30 p-4 text-center">
                    <div className="text-xs font-black uppercase tracking-[.16em] text-[#f4c76c]">Estimated Maximum Equity Access</div>
                    <div className="mt-2 text-3xl font-black text-[#f4c76c]">{homeValue && mortgageBalance ? formatMoney(possibleRoom) : "—"}</div>
                    <p className="mt-2 text-[11px] font-semibold leading-relaxed text-blue-100">Based on estimated property value and mortgage balance.</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
                    <div className="text-xs font-black uppercase tracking-[.16em] text-blue-200">Payment If Using Maximum Equity</div>
                    <div className="mt-2 text-2xl font-black text-white">{maxCashOutPaymentPreview ? `${formatMoney(maxCashOutPaymentPreview)}/mo` : "—"}</div>
                    <p className="mt-2 text-[11px] font-semibold leading-relaxed text-blue-100">Estimated payment only if the full maximum equity amount is requested.</p>
                  </div>
                  <div className="rounded-xl border border-blue-300/30 bg-blue-500/10 p-4 text-center">
                    <div className="text-xs font-black uppercase tracking-[.16em] text-blue-200">Your Requested Funding Amount</div>
                    <div className="mt-2 text-3xl font-black text-white">{requestedCash ? formatMoney(requestedCash) : "—"}</div>
                    <p className="mt-2 text-[11px] font-semibold leading-relaxed text-blue-100">This is the amount entered into the form.</p>
                  </div>
                  <div className="rounded-xl border border-[#d7aa55]/30 bg-[#d7aa55]/10 p-4 text-center">
                    <div className="text-xs font-black uppercase tracking-[.16em] text-[#f4c76c]">Payment For Requested Amount</div>
                    <div className="mt-2 text-2xl font-black text-white">{requestedCash ? `${formatMoney(paymentPreview)}/mo` : "—"}</div>
                    <p className="mt-2 text-[11px] font-semibold leading-relaxed text-blue-100">Estimated payment preview for only the amount requested.</p>
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-center text-[11px] font-semibold leading-relaxed text-blue-100">
                  These are preview estimates only. Final terms depend on review by a selected mortgage company, verified property details, equity, credit profile and documents.
                </div>
                <input type="hidden" name="possible_equity_room" value={possibleRoom} />
                <input type="hidden" name="estimated_monthly_payment" value={paymentPreview} />
                <input type="hidden" name="estimated_max_cashout_payment" value={maxCashOutPaymentPreview} />
              </div>

              <button disabled={loading} className="rounded-xl bg-gradient-to-b from-[#ffe39a] to-[#c98924] p-4 text-lg font-black text-[#07101d] shadow-xl transition hover:-translate-y-1 md:col-span-2 sm:p-5 sm:text-xl">
                {loading ? "Submitting..." : "SEE MY OPTIONS ›"}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="bg-[#020711] px-5 py-10 md:px-10">
        <div className="mx-auto grid max-w-[1580px] gap-5 lg:grid-cols-[1.05fr_.75fr]">
          <div className="rounded-[2rem] border border-[#d7aa55]/30 bg-gradient-to-br from-[#081322] to-[#030812] p-6 md:p-9">
            <div className="text-xs font-black uppercase tracking-[.32em] text-[#f4c76c]">Example homeowner outcome</div>
            <h2 className="mt-4 max-w-4xl text-3xl font-black tracking-[-.04em] md:text-5xl">Matched to a mortgage company that improved the full picture.</h2>
            <p className="mt-4 max-w-3xl text-lg font-semibold leading-relaxed text-slate-300">
              A selected mortgage company in the network may help a homeowner compare refinance, cash-out or HELOC paths. This example shows the kind of clear side-by-side strategy HELOC CONNECT is designed to help homeowners access.
            </p>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-red-400/25 bg-red-400/10 p-5"><div className="text-sm font-black text-red-200">Previous Mortgage</div><div className="mt-2 text-3xl font-black text-white">$2,785/mo</div><p className="mt-2 text-sm text-slate-300">No cash available</p></div>
              <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-5"><div className="text-sm font-black text-emerald-200">Network Mortgage Company</div><div className="mt-2 text-3xl font-black text-white">$2,125/mo</div><p className="mt-2 text-sm text-slate-300">Example lower payment</p></div>
              <div className="rounded-2xl border border-[#d7aa55]/30 bg-[#d7aa55]/10 p-5"><div className="text-sm font-black text-[#f4c76c]">Cash Available</div><div className="mt-2 text-3xl font-black text-white">$100,000</div><p className="mt-2 text-sm text-slate-300">Example cash-out amount</p></div>
            </div>
            <p className="mt-4 text-xs font-semibold leading-relaxed text-slate-400">Illustrative example only. Results vary. HELOC CONNECT does not approve, fund, set rates or determine terms.</p>
          </div>
          <div id="reviews" className="rounded-[2rem] border border-white/10 bg-white/[.04] p-6 md:p-9">
            <div className="text-5xl text-[#f4c76c]">“</div>
            <p className="mt-3 text-xl font-bold leading-relaxed text-white">
              HELOC CONNECT helped us connect with a mortgage company that reviewed options we did not even know were available. The process felt organized, private and simple.
            </p>
            <div className="mt-6 font-black text-[#f4c76c]">Jason & Michelle T.</div>
            <div className="text-sm font-bold text-slate-400">Verified homeowner-style success story</div>
          </div>
        </div>
      </section>

      <section id="solutions" className="bg-[#06101d] px-5 py-12 md:px-10">
        <div className="mx-auto max-w-[1580px]">
          <div className="text-center">
            <div className="text-xs font-black uppercase tracking-[.32em] text-[#f4c76c]">Solutions</div>
            <h2 className="mt-4 text-4xl font-black tracking-[-.04em] md:text-6xl">One platform. Multiple mortgage company paths.</h2>
          </div>
          <div className="mt-9 grid gap-5 md:grid-cols-4">
            {goals.map(([title, desc]) => (
              <div key={title} className="rounded-[1.6rem] border border-[#d7aa55]/25 bg-black/25 p-6 shadow-2xl backdrop-blur transition hover:-translate-y-1 hover:border-[#f4c76c]">
                <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-[#d7aa55]/30 bg-[#d7aa55]/10 text-2xl text-[#f4c76c]">⌂</div>
                <h3 className="text-2xl font-black">{title}</h3>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-300">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="bg-[#020711] px-5 py-12 md:px-10">
        <div className="mx-auto max-w-[1580px] rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[.06] to-white/[.02] p-6 md:p-10">
          <div className="text-center">
            <div className="text-xs font-black uppercase tracking-[.32em] text-[#f4c76c]">How It Works</div>
            <h2 className="mt-4 text-4xl font-black tracking-[-.04em] md:text-6xl">A simple process that puts you first.</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-5">
            {[
              ["1", "Enter Address", "Get an estimated home value from the smart calculator."],
              ["2", "Explore Options", "Share your goals, property details and requested funding."],
              ["3", "We Find Matches", "We connect you with carefully selected mortgage companies."],
              ["4", "Review Options", "Mortgage companies may review your profile and present options."],
              ["5", "Move Forward", "Choose whether the option fits your goals."]
            ].map(([num, title, desc]) => (
              <div key={title} className="text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[#d7aa55]/40 bg-[#d7aa55]/10 text-2xl font-black text-[#f4c76c]">{num}</div>
                <h3 className="mt-4 text-lg font-black">{title}</h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-300">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="network" className="border-t border-[#d7aa55]/20 bg-[#020711] px-5 py-10 md:px-10">
        <div className="mx-auto max-w-[1580px] rounded-[2rem] border border-[#d7aa55]/25 bg-[#06101d] p-6 md:p-9">
          <div className="grid gap-7 lg:grid-cols-[.7fr_1fr]">
            <div>
              <div className="text-xs font-black uppercase tracking-[.32em] text-[#f4c76c]">Our Mortgage Company Network</div>
              <h2 className="mt-4 text-3xl font-black tracking-[-.04em] md:text-5xl">We are not the mortgage company. We help you find the right one.</h2>
              <p className="mt-4 text-base font-semibold leading-relaxed text-slate-300">Our role is to connect homeowners with carefully selected mortgage companies in our network. The mortgage company reviews the file and determines approvals, rates, terms and funding.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {["Carefully Selected", "Multiple Options", "Secure Process"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
                  <div className="text-3xl text-[#f4c76c]">✦</div>
                  <h3 className="mt-3 text-xl font-black">{item}</h3>
                  <p className="mt-2 text-sm font-semibold text-slate-300">Designed to help homeowners compare the right path without pressure.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black px-5 py-8 md:px-10">
        <div className="mx-auto flex max-w-[1580px] flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-2xl font-black">HELOC <span className="text-[#f4c76c]">CONNECT</span></div>
            <p className="mt-2 max-w-4xl text-xs font-semibold leading-relaxed text-slate-400">
              HELOC CONNECT is not a lender, mortgage company, bank, broker or loan originator. We are a homeowner connection platform that introduces consumers to carefully selected mortgage companies in our network. All lending decisions, approvals, rates, terms and funding are determined solely by participating mortgage companies.
            </p>
          </div>
          <div className="flex gap-4 text-sm font-bold text-slate-300"><a href="/privacy-policy">Privacy</a><a href="/terms">Terms</a><a href="/about">About</a></div>
        </div>
      </footer>
    </main>
  );
}
