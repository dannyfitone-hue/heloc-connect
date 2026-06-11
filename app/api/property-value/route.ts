import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { address } = await req.json();
  const attomKey = process.env.ATTOM_API_KEY;

  if (!attomKey) {
    return NextResponse.json({ value: null, message: "Home value lookup needs property data API activation." });
  }

  try {
    const url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/address?address1=${encodeURIComponent(address)}&address2=`;
    const res = await fetch(url, { headers: { apikey: attomKey, accept: "application/json" } });
    const data = await res.json();
    const property = data?.property?.[0];
    const value = property?.avm?.amount?.value || property?.assessment?.assessed?.assdttlvalue || null;
    return NextResponse.json({ value, source: property?.avm?.amount?.value ? "avm" : "assessed_fallback" });
  } catch (e: any) {
    return NextResponse.json({ value: null, message: e.message });
  }
}
