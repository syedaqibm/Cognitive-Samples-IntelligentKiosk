/**
 * Karnataka AWC master + CDPO/DPO directory + Matrupoorna contractor import.
 *
 * This is a stub. Each section below documents the source URL and the
 * normalisation it needs. Implement section by section, idempotent.
 *
 * Run:  npx tsx scripts/import-awc-karnataka.ts
 * Env:  SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
// Used by importers below once they are implemented.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const supabase: SupabaseClient = createClient(url, key, { auth: { persistSession: false } });

async function importAWCs() {
  // TODO: pull from DWCD Karnataka centre directory + cross-validate with
  // data.gov.in Karnataka ICDS datasets. ~66,000 rows.
  // Source: https://anganwadi.karnataka.gov.in/
  // Source: https://www.data.gov.in/keywords/anganwadi-centers-icds (Karnataka filter)
  // Normalise to { rrs_code_11d, name, lat, lng, block_id, district_id, mla_id }.
  console.log("[awc] TODO: pull master from DWCD Karnataka + data.gov.in");
}

async function importCDPOs() {
  // TODO: scrape https://anganwadi.karnataka.gov.in/ org chart per ICDS project.
  // ~200 CDPOs expected.
  console.log("[cdpo] TODO: scrape CDPO directory");
}

async function importDPOs() {
  // TODO: scrape DPO directory. ~30 expected.
  console.log("[dpo] TODO: scrape DPO directory");
}

async function importMatrupoornaContractors() {
  // TODO: scrape https://eproc.karnataka.gov.in/ filtered by Department of
  // Women & Child Development. Matrupoorna tenders are typically annual,
  // district-scoped. Extract: contractor name, scope districts, tender PDF URL,
  // valid_from / valid_to.
  console.log("[contractor] TODO: scrape Matrupoorna tenders");
}

async function importMLAConstituencies() {
  // TODO: spatial-join AWC GPS against KA assembly constituency GeoJSON
  // (Election Commission). One-time job. Output: awc.mla_id per row.
  console.log("[mla] TODO: spatial join AWC -> MLA constituency");
}

async function main() {
  console.log("Karnataka AWC import starting. Supabase:", url);
  await importAWCs();
  await importCDPOs();
  await importDPOs();
  await importMatrupoornaContractors();
  await importMLAConstituencies();
  console.log("Done. Run db/schema.sql first if you have not already.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
