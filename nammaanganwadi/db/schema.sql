-- NammaAnganwadi schema for Supabase (Postgres + PostGIS)
-- Run once after creating a fresh Supabase project.
-- Public-readable tables: awc, cdpo, dpo, nutrition_contractor, awc_supplier, awc_score
-- Writable via service role: awc_report

create extension if not exists postgis;

------------------------------------------------------------
-- Master data
------------------------------------------------------------

create table if not exists awc (
  rrs_code_11d   text primary key check (rrs_code_11d ~ '^[0-9]{11}$'),
  name           text not null,
  lat            double precision not null,
  lng            double precision not null,
  geom           geography(point, 4326) generated always as (st_setsrid(st_makepoint(lng, lat), 4326)::geography) stored,
  block_id       text not null,
  district_id    text not null,
  state          text not null default 'KA',
  mla_id         text,
  supervisor_id  text,
  building_status text check (building_status in ('own','rented','panchayat','school','other')),
  rented_or_owned text check (rented_or_owned in ('own','rented')),
  official_infra jsonb default '{}'::jsonb
);

create index if not exists awc_geom_idx on awc using gist (geom);
create index if not exists awc_block_idx on awc (block_id);
create index if not exists awc_district_idx on awc (district_id);

create table if not exists cdpo (
  id             text primary key,
  name           text not null,
  block_id       text not null,
  district_id    text not null,
  contact_email  text
);

create table if not exists dpo (
  id             text primary key,
  name           text not null,
  district_id    text not null,
  contact_email  text
);

create table if not exists nutrition_contractor (
  id                 text primary key,
  name               text not null,
  state              text not null default 'KA',
  scope_districts    text[] not null default '{}',
  awarded_via_tender text,
  tender_url         text
);

create table if not exists awc_supplier (
  awc_code               text references awc(rrs_code_11d) on delete cascade,
  nutrition_contractor_id text references nutrition_contractor(id) on delete cascade,
  valid_from             date not null,
  valid_to               date not null,
  primary key (awc_code, nutrition_contractor_id, valid_from)
);

------------------------------------------------------------
-- Submissions
------------------------------------------------------------

create table if not exists awc_report (
  id           uuid primary key default gen_random_uuid(),
  awc_code     text not null references awc(rrs_code_11d) on delete cascade,
  category     text not null check (category in (
    'no-toilet','no-water','no-electricity','centre-closed',
    'no-meal','no-thr','no-medicine','broken-building'
  )),
  photo_url    text,
  lat          double precision,
  lng          double precision,
  dedup_hash   text not null,
  status       text not null default 'alleged' check (status in ('alleged','resolved','rejected')),
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz,
  term_year    text generated always as (
    extract(year from created_at)::text || '-' ||
    case
      when extract(month from created_at) between 1 and 4 then 'T1'
      when extract(month from created_at) between 5 and 8 then 'T2'
      else 'T3'
    end
  ) stored
);

create unique index if not exists awc_report_dedup_idx on awc_report (dedup_hash);
create index if not exists awc_report_awc_term_idx on awc_report (awc_code, term_year);
create index if not exists awc_report_status_idx on awc_report (status);

------------------------------------------------------------
-- Materialised aggregate (recomputed nightly via cron)
------------------------------------------------------------

create materialized view if not exists awc_score as
select
  r.awc_code,
  r.term_year,
  count(*) filter (where r.status = 'alleged') as unresolved_count,
  sum(extract(epoch from (coalesce(r.resolved_at, now()) - r.created_at)) / 86400)::int as open_days_total,
  jsonb_object_agg(r.category, cat_days.days) filter (where cat_days.days is not null) as open_days_by_category,
  case
    when count(*) filter (where r.status = 'alleged') >= 10 then 'red'
    when count(*) filter (where r.status = 'alleged') >= 3  then 'amber'
    else 'green'
  end as status_color
from awc_report r
left join lateral (
  select sum(extract(epoch from (coalesce(r2.resolved_at, now()) - r2.created_at)) / 86400)::int as days
  from awc_report r2
  where r2.awc_code = r.awc_code
    and r2.term_year = r.term_year
    and r2.category = r.category
) cat_days on true
group by r.awc_code, r.term_year;

create unique index if not exists awc_score_pk on awc_score (awc_code, term_year);

------------------------------------------------------------
-- RPCs
------------------------------------------------------------

create or replace function awc_nearest(p_lat double precision, p_lng double precision)
returns table (rrs_code_11d text, name text, distance_m double precision)
language sql stable as $$
  select
    a.rrs_code_11d,
    a.name,
    st_distance(a.geom, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography) as distance_m
  from awc a
  where st_dwithin(a.geom, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography, 2000)
  order by distance_m
  limit 5;
$$;

create or replace function cdpo_leaderboard()
returns table (id text, name text, block_id text, district_id text, open_days_total int, unresolved_count int)
language sql stable as $$
  select
    c.id, c.name, c.block_id, c.district_id,
    coalesce(sum(s.open_days_total), 0)::int,
    coalesce(sum(s.unresolved_count), 0)::int
  from cdpo c
  left join awc a on a.block_id = c.block_id
  left join awc_score s on s.awc_code = a.rrs_code_11d and s.term_year = (
    extract(year from now())::text || '-' ||
    case
      when extract(month from now()) between 1 and 4 then 'T1'
      when extract(month from now()) between 5 and 8 then 'T2'
      else 'T3'
    end
  )
  group by c.id, c.name, c.block_id, c.district_id
  order by 5 desc nulls last
  limit 50;
$$;

create or replace function district_leaderboard()
returns table (id text, name text, open_days_total int, unresolved_count int)
language sql stable as $$
  select
    a.district_id as id,
    a.district_id as name,
    coalesce(sum(s.open_days_total), 0)::int,
    coalesce(sum(s.unresolved_count), 0)::int
  from awc a
  left join awc_score s on s.awc_code = a.rrs_code_11d
  group by a.district_id
  order by 3 desc nulls last
  limit 50;
$$;

------------------------------------------------------------
-- Row-Level Security
------------------------------------------------------------

alter table awc enable row level security;
alter table cdpo enable row level security;
alter table dpo enable row level security;
alter table nutrition_contractor enable row level security;
alter table awc_supplier enable row level security;
alter table awc_report enable row level security;

create policy "public read" on awc        for select using (true);
create policy "public read" on cdpo       for select using (true);
create policy "public read" on dpo        for select using (true);
create policy "public read" on nutrition_contractor for select using (true);
create policy "public read" on awc_supplier for select using (true);

-- Writes only via service role (no policies = locked).
