import { NextResponse } from "next/server";

const fallback = [
  { label: "123 Main St, Irvine, CA 92618", street: "123 Main St", city: "Irvine", state: "CA", zip: "92618" },
  { label: "123 Main St, Lake Forest, CA 92630", street: "123 Main St", city: "Lake Forest", state: "CA", zip: "92630" },
  { label: "123 Main Ave, Anaheim, CA 92805", street: "123 Main Ave", city: "Anaheim", state: "CA", zip: "92805" },
  { label: "123 Main Street, Los Angeles, CA 90012", street: "123 Main Street", city: "Los Angeles", state: "CA", zip: "90012" }
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const key = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!q || q.length < 3) return NextResponse.json({ results: [] });

  if (!key) {
    return NextResponse.json({
      results: fallback,
      message: "Google Maps key not active yet; showing sample matches."
    });
  }

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&types=address&components=country:us&key=${key}`;
  const res = await fetch(url);
  const data = await res.json();

  return NextResponse.json({
    results: (data.predictions || []).map((p: any) => ({ label: p.description, place_id: p.place_id }))
  });
}
