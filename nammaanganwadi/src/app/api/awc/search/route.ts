import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

interface AWCSuggestion {
  rrs_code_11d: string;
  name: string;
  distance_m: number;
}

const MOCK_AWCS: AWCSuggestion[] = [
  { rrs_code_11d: "29010301001", name: "AWC Yelahanka 1",    distance_m: 110 },
  { rrs_code_11d: "29010301002", name: "AWC Yelahanka 2",    distance_m: 380 },
  { rrs_code_11d: "29010301003", name: "AWC Kogilu Cross",   distance_m: 620 },
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "invalid coords" }, { status: 400 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ awcs: MOCK_AWCS });
  }

  // PostGIS-backed lookup: nearest 5 AWCs within 2 km.
  // Requires the `awc_nearest(lat double precision, lng double precision)` SQL
  // function defined in db/schema.sql.
  const { data, error } = await supabase.rpc("awc_nearest", { p_lat: lat, p_lng: lng });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ awcs: (data ?? []) as AWCSuggestion[] });
}
