import type { AWC, CDPO, DPO, NutritionContractor } from "./types";
import type { CategorySlug } from "./categories";
import { getServiceClient } from "./supabase";

export interface AttributionResult {
  awc: AWC | null;
  cdpo: CDPO | null;
  dpo: DPO | null;
  mlaName: string | null;
  contractor: NutritionContractor | null;
}

/**
 * Resolves the accountability chain for a report. For categories that involve
 * supply (no-meal, no-thr), also tags the Matrupoorna contractor on record.
 * The AWW is never returned — by design.
 */
export async function attribute(awcCode: string, category: CategorySlug): Promise<AttributionResult> {
  const supabase = getServiceClient();
  if (!supabase) {
    return { awc: null, cdpo: null, dpo: null, mlaName: null, contractor: null };
  }

  const { data: awc } = await supabase
    .from("awc")
    .select("*")
    .eq("rrs_code_11d", awcCode)
    .maybeSingle();

  if (!awc) {
    return { awc: null, cdpo: null, dpo: null, mlaName: null, contractor: null };
  }

  const [{ data: cdpo }, { data: dpo }] = await Promise.all([
    supabase.from("cdpo").select("*").eq("block_id", awc.block_id).maybeSingle(),
    supabase.from("dpo").select("*").eq("district_id", awc.district_id).maybeSingle(),
  ]);

  let contractor: NutritionContractor | null = null;
  const blamesContractor = category === "no-meal" || category === "no-thr";
  if (blamesContractor) {
    const { data } = await supabase
      .from("awc_supplier")
      .select("nutrition_contractor:nutrition_contractor_id(*)")
      .eq("awc_code", awcCode)
      .lte("valid_from", new Date().toISOString())
      .gte("valid_to", new Date().toISOString())
      .maybeSingle();
    contractor = (data?.nutrition_contractor as unknown as NutritionContractor) ?? null;
  }

  return {
    awc: awc as AWC,
    cdpo: (cdpo as CDPO) ?? null,
    dpo: (dpo as DPO) ?? null,
    mlaName: awc.mla_id ?? null,
    contractor,
  };
}
