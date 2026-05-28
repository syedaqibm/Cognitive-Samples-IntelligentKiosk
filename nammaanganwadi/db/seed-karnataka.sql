-- Minimal seed for local / staging testing. Three AWCs in Yelahanka, one CDPO,
-- one DPO. Replace with the real Karnataka master once scripts/import-awc-karnataka.ts
-- has finished its pass.

insert into cdpo (id, name, block_id, district_id, contact_email) values
  ('KA-BAN-N-CDPO-1', 'Smt. R. Lakshmi',  'KA-BAN-N',  'KA-BAN-U', 'cdpo.banglore.north@ka.gov.in')
on conflict (id) do nothing;

insert into dpo (id, name, district_id, contact_email) values
  ('KA-BAN-U-DPO', 'Sri. M. Anand', 'KA-BAN-U', 'dpo.bangaloreurban@ka.gov.in')
on conflict (id) do nothing;

insert into nutrition_contractor (id, name, state, scope_districts, awarded_via_tender, tender_url) values
  ('KA-MAT-2024-25-BAN-U', 'Karnataka Milk Federation', 'KA',
   array['KA-BAN-U'], 'KSDA/MAT/2024-25/BAN-U', 'https://eproc.karnataka.gov.in/tender/...')
on conflict (id) do nothing;

insert into awc (rrs_code_11d, name, lat, lng, block_id, district_id, mla_id, building_status, rented_or_owned, official_infra)
values
  ('29010301001', 'AWC Yelahanka 1',    13.10134, 77.59678, 'KA-BAN-N', 'KA-BAN-U', 'MLA-YLH', 'own',    'own',
   '{"toilet": true,  "drinking_water": true,  "electricity": true,  "kitchen": false}'::jsonb),
  ('29010301002', 'AWC Yelahanka 2',    13.10220, 77.59930, 'KA-BAN-N', 'KA-BAN-U', 'MLA-YLH', 'rented', 'rented',
   '{"toilet": false, "drinking_water": true,  "electricity": true,  "kitchen": false}'::jsonb),
  ('29010301003', 'AWC Kogilu Cross',   13.10480, 77.60110, 'KA-BAN-N', 'KA-BAN-U', 'MLA-YLH', 'panchayat', 'own',
   '{"toilet": false, "drinking_water": false, "electricity": true,  "kitchen": false}'::jsonb)
on conflict (rrs_code_11d) do nothing;

insert into awc_supplier (awc_code, nutrition_contractor_id, valid_from, valid_to) values
  ('29010301001', 'KA-MAT-2024-25-BAN-U', '2024-04-01', '2025-03-31'),
  ('29010301002', 'KA-MAT-2024-25-BAN-U', '2024-04-01', '2025-03-31'),
  ('29010301003', 'KA-MAT-2024-25-BAN-U', '2024-04-01', '2025-03-31')
on conflict do nothing;
