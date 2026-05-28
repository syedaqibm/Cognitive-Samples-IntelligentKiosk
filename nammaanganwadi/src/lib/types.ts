import type { CategorySlug } from "./categories";

export interface AWC {
  rrs_code_11d: string;
  name: string;
  lat: number;
  lng: number;
  block_id: string;
  district_id: string;
  state: string;
  mla_id: string;
  supervisor_id: string;
  building_status: "own" | "rented" | "panchayat" | "school" | "other";
  rented_or_owned: "own" | "rented";
  official_infra: {
    toilet?: boolean;
    drinking_water?: boolean;
    electricity?: boolean;
    kitchen?: boolean;
  };
}

export interface CDPO {
  id: string;
  name: string;
  block_id: string;
  district_id: string;
  contact_email?: string;
}

export interface DPO {
  id: string;
  name: string;
  district_id: string;
  contact_email?: string;
}

export interface NutritionContractor {
  id: string;
  name: string;
  state: string;
  scope_districts: string[];
  awarded_via_tender: string;
  tender_url: string;
}

export interface AWCReport {
  id: string;
  awc_code: string;
  category: CategorySlug;
  photo_url: string;
  created_at: string;
  status: "alleged" | "resolved" | "rejected";
  days_open: number;
  term_year: string;
  dedup_hash: string;
}

export interface AWCScore {
  awc_code: string;
  term_year: string;
  open_days_total: number;
  open_days_by_category: Record<CategorySlug, number>;
  status_color: "green" | "amber" | "red";
}
