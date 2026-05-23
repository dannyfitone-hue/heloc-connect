import { NextRequest, NextResponse } from "next/server";

function toNumber(value: any): number | null {
  const n = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 50000 ? Math.round(n) : null;
}

function deepSearch(obj: any, mode: "market" | "assessed", values: number[] = [], path = ""): number[] {
  if (!obj || typeof obj !== "object") return values;

  for (const [key, val] of Object.entries(obj)) {
    const trail = `${path}.${key}`.toLowerCase();

    const isMarket =
      trail.includes("avm") ||
      trail.includes("market") ||
      trail.includes("estimate") ||
      trail.includes("valuation") ||
      trail.includes("mkt");

    const isAssessed =
      trail.includes("assessed") ||
      trail.includes("assd") ||
      trail.includes("tax");

    if (typeof val !== "object") {
      const n = toNumber(val);

      if (n) {
        if (mode === "market" && isMarket && !isAssessed) values.push(n);
        if (mode === "assessed" && isAssessed) values.push(n);
      }
    }

    if (typeof val === "object") {
      deepSearch(val, mode, values, trail);
    }
  }

  return values;
}

function chooseValue(payload: any) {
  const marketValues = deepSearch(payload, "market")
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .sort((a, b) => b - a);

  if (marketValues.length) {
    return {
      value: marketValues[0],
      source: "market_avm"
    };
  }

  const assessedValues = deepSearch(payload, "assessed")
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .sort((a, b) => b - a);

  if (assessedValues.length) {
    return {
      value: assessedValues[0],
      source: "assessed_fallback"
    };
  }

  return {
    value: null,
    source: "not_found"
  };
}

export async function POST(req: NextRequest) {
  const { address } = await req.json();

  if (!address) {
    return NextResponse.json({ value: null, message: "Address is required." }, { status: 400 });
  }

  const attomKey = process.env.ATTOM_API_KEY;

  if (!attomKey) {
    return NextResponse.json({
      value: null,
      message: "Home value lookup needs ATTOM_API_KEY in Vercel."
    });
  }

  try {
    const parts = String(address).split(",");
    const address1 = parts[0]?.trim() || String(address);
    const address2 = parts.slice(1).join(",").trim();

    const endpoints = [
      "https://api.gateway.attomdata.com/propertyapi/v1.0.0/avm/detail",
      "https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/basicprofile",
      "https://api.gateway.attomdata.com/propertyapi/v1.0.0/assessment/detail"
    ];

    let assessedFallback: any = null;

    for (const endpoint of endpoints) {
      const url = new URL(endpoint);
      url.searchParams.set("address1", address1);
      if (address2) url.searchParams.set("address2", address2);

      const res = await fetch(url.toString(), {
        headers: {
          apikey: attomKey,
          accept: "application/json"
        },
        cache: "no-store"
      });

      if (!res.ok) continue;

      const payload = await res.json();
      const chosen = chooseValue(payload);

      if (chosen.value && chosen.source === "market_avm") {
        return NextResponse.json({
          value: chosen.value,
          source: "market_avm",
          message: "Estimated market value found."
        });
      }

      if (chosen.value && !assessedFallback) {
        assessedFallback = chosen;
      }
    }

    if (assessedFallback?.value) {
      return NextResponse.json({
        value: assessedFallback.value,
        source: "assessed_fallback",
        message: "Only assessed/tax value found. You can update the estimated value manually."
      });
    }

    return NextResponse.json({
      value: null,
      message: "Property value not found. You can enter estimated value manually."
    });
  } catch (error) {
    console.error("Property value lookup error:", error);
    return NextResponse.json({
      value: null,
      message: "Property value lookup is temporarily unavailable."
    });
  }
}
