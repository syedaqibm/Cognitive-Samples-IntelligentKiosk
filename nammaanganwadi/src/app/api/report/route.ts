import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "node:crypto";
import { CATEGORIES, type CategorySlug } from "@/lib/categories";
import { attribute } from "@/lib/attribution";
import { getServiceClient } from "@/lib/supabase";

const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as [CategorySlug, ...CategorySlug[]];

const ReportSchema = z.object({
  awc_code: z.string().regex(/^\d{11}$/, "AWC code must be 11 digits"),
  category: z.enum(CATEGORY_SLUGS),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

export async function POST(request: Request) {
  const form = await request.formData();
  const photo = form.get("photo");

  if (!(photo instanceof File) || photo.size === 0) {
    return NextResponse.json({ error: "photo is required" }, { status: 400 });
  }
  if (photo.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "photo too large (max 8 MB)" }, { status: 400 });
  }

  const parsed = ReportSchema.safeParse({
    awc_code: form.get("awc_code"),
    category: form.get("category"),
    lat: form.get("lat") ?? undefined,
    lng: form.get("lng") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { awc_code, category, lat, lng } = parsed.data;
  const att = await attribute(awc_code, category);

  // TODO: face-detection on photo before persisting. v1.1.
  // TODO: Cloudinary direct upload from client; the photo is currently buffered
  // in the function, which the v1 free-tier traffic can handle.

  const photoBuf = Buffer.from(await photo.arrayBuffer());
  const dedupHash = crypto
    .createHash("sha256")
    .update(awc_code)
    .update(category)
    .update(photoBuf)
    .digest("hex");

  const supabase = getServiceClient();
  let reportId = crypto.randomUUID();

  if (supabase) {
    const { data, error } = await supabase
      .from("awc_report")
      .insert({
        awc_code,
        category,
        lat,
        lng,
        dedup_hash: dedupHash,
        status: "alleged",
      })
      .select("id")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    reportId = data.id;
  }

  return NextResponse.json({
    report_id: reportId,
    cdpo_name: att.cdpo?.name ?? "CDPO (lookup pending)",
    mla_name: att.mlaName ?? "MLA (lookup pending)",
    contractor_name: att.contractor?.name,
  });
}
