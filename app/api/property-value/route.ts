import { NextRequest, NextResponse } from "next/server";

function findNumberDeep(obj: any, keys: string[]): number | null {
  if (!obj || typeof obj !== "object") return null;

  for (const key of Object.keys(obj)) {
    const lower = key.toLowerCase();
    if (keys.some((k) => lower.includes(k))) {
      const value = Number(obj[key]);
      if (Number.isFinite(value) && value > 50000) return Math.round(value);
    }

    const nested = findNumberDeep(obj[key], keys);
    if (nested) return nested;
  }

  return null;
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
      "https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/basicprofile",
      "https://api.gateway.attomdata.com/propertyapi/v1.0.0/avm/detail"
    ];

    for (const endpoint of endpoints) {
      const url = new URL(endpoint);
      url.searchParams.set("address1", address1);
      if (address2) url.searchParams.set("address2", address2);

      const res = await fetch(url.toString(), {
        headers: {
          "apikey": attomKey,
          "accept": "application/json"
        }
      });

      if (!res.ok) continue;

      const payload = await res.json();

      const value =
        findNumberDeep(payload, ["avm", "value", "amount", "market", "mktttl", "mktttl", "assdttl", "estimate"]) ||
        null;

      if (value) {
        return NextResponse.json({
          value,
          message: "Estimated home value found."
        });
      }
    }

    return NextResponse.json({
      value: null,
      message: "Property value not found yet. Client can enter estimated value manually."
    });
  } catch (error) {
    console.error("Property value lookup error:", error);
    return NextResponse.json({
      value: null,
      message: "Property value lookup is temporarily unavailable."
    });
  }
}
