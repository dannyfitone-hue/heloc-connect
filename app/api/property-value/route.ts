import { NextRequest, NextResponse } from "next/server";

function extractValueFromAttomPayload(payload: any) {
  const property = payload?.property?.[0] || payload?.property || payload?.data?.[0] || payload?.data;
  const avm =
    property?.avm?.amount?.value ||
    property?.avm?.amount ||
    property?.assessment?.market?.mktttlvalue ||
    property?.assessment?.market?.mktTtlValue ||
    property?.assessment?.assessed?.assdttlvalue ||
    property?.assessment?.assessed?.assdTtlValue;

  const num = Number(avm);
  return Number.isFinite(num) && num > 0 ? Math.round(num) : null;
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
      message: "Home value lookup will activate after adding ATTOM_API_KEY in Vercel."
    });
  }

  try {
    const url = new URL("https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/basicprofile");
    url.searchParams.set("address1", address);
    url.searchParams.set("address2", "");

    const res = await fetch(url.toString(), {
      headers: {
        "apikey": attomKey,
        "accept": "application/json"
      }
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("ATTOM lookup failed:", text);
      return NextResponse.json({
        value: null,
        message: "Property value lookup could not verify this address yet."
      });
    }

    const payload = await res.json();
    const value = extractValueFromAttomPayload(payload);

    return NextResponse.json({
      value,
      message: value ? "Estimated home value found." : "Property value not found for this address."
    });
  } catch (error) {
    console.error("Property value lookup error:", error);
    return NextResponse.json({
      value: null,
      message: "Property value lookup is temporarily unavailable."
    });
  }
}
