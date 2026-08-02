-- ============================================================
-- PT Referral Orchestration Platform - Core Schema
-- Postgres / Neon flavored (uuid, timestamptz, RLS-ready)
-- ============================================================

-- ------------------------------------------------------------
-- 1. REFERRING SIDE: practices, doctors
-- ------------------------------------------------------------

create table practices (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  npi_org       text,
  phone         text,
  fax           text,
  address_line1 text,
  address_line2 text,
  city          text,
  state         text default 'FL',
  zip           text,
  created_at    timestamptz not null default now()
);

create table providers (
  id            uuid primary key default gen_random_uuid(),
  practice_id   uuid not null references practices(id),
  first_name    text not null,
  last_name     text not null,
  npi           text unique,
  specialty     text,
  email         text,
  phone         text,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. PATIENTS, COVERAGE
-- ------------------------------------------------------------

create table patients (
  id             uuid primary key default gen_random_uuid(),
  first_name     text not null,
  last_name      text not null,
  dob            date not null,
  phone          text not null,
  phone_verified boolean not null default false,
  preferred_channel text not null default 'sms'
                 check (preferred_channel in ('sms','voice','both')),
  preferred_language text not null default 'en',
  email          text,
  address_line1  text,
  address_line2  text,
  city           text,
  state          text,
  zip            text,
  geom           geography(point, 4326),
  home_visit_ok  boolean default false,
  mobility_notes text,
  created_at     timestamptz not null default now()
);

create index patients_geom_idx on patients using gist (geom);

create table payers (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  payer_id_code text,
  type         text check (type in ('commercial','medicare','medicare_advantage',
                                    'medicaid','workers_comp','self_pay','other'))
);

create table patient_coverage (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references patients(id),
  payer_id      uuid not null references payers(id),
  member_id     text not null,
  group_number  text,
  plan_name     text,
  eligibility_status   text check (eligibility_status in
                        ('unverified','active','inactive','error')),
  pt_visit_limit       int,
  pt_visits_used       int,
  copay_cents          int,
  requires_auth        boolean,
  auth_number          text,
  eligibility_checked_at timestamptz,
  is_primary    boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. THE ORDER (the "prescription")
-- ------------------------------------------------------------

create table service_types (
  id    uuid primary key default gen_random_uuid(),
  code  text unique not null,
  name  text not null,
  description text
);

create table orders (
  id             uuid primary key default gen_random_uuid(),
  provider_id    uuid not null references providers(id),
  practice_id    uuid not null references practices(id),
  patient_id     uuid not null references patients(id),
  service_type_id uuid not null references service_types(id),
  diagnosis_codes text[],
  cpt_codes      text[],
  frequency_per_week   int not null,
  duration_weeks       int,
  total_visits_ordered int,
  reeval_interval_days int,
  home_visits_allowed  boolean not null default false,
  urgency        text not null default 'routine'
                 check (urgency in ('routine','urgent','post_op')),
  clinical_notes text,
  status         text not null default 'received'
                 check (status in ('received','contacting_patient','matching',
                                   'scheduled','in_progress','completed',
                                   'cancelled','expired')),
  received_via   text check (received_via in ('web_form','fax','api','phone')),
  created_at     timestamptz not null default now(),
  expires_at     timestamptz
);

-- ------------------------------------------------------------
-- 4. SUPPLY SIDE: PT centers, services, network, availability
-- ------------------------------------------------------------

create table pt_centers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  phone         text not null,
  fax           text,
  email         text,
  address_line1 text,
  city          text,
  state         text,
  zip           text,
  geom          geography(point, 4326) not null,
  offers_home_visits boolean not null default false,
  home_visit_radius_km numeric,
  scheduling_mode text not null default 'phone'
                 check (scheduling_mode in ('phone','api','portal','email')),
  ehr_system    text,
  onboarded     boolean not null default false,
  rating        numeric,
  notes         text,
  created_at    timestamptz not null default now()
);

create index pt_centers_geom_idx on pt_centers using gist (geom);

create table center_services (
  center_id       uuid not null references pt_centers(id),
  service_type_id uuid not null references service_types(id),
  primary key (center_id, service_type_id)
);

create table center_network_participation (
  id          uuid primary key default gen_random_uuid(),
  center_id   uuid not null references pt_centers(id),
  payer_id    uuid not null references payers(id),
  plan_name   text,
  in_network  boolean not null,
  verified_via text check (verified_via in
               ('payer_directory','phone_call','center_reported','claim_history','api')),
  verified_at timestamptz,
  unique (center_id, payer_id, plan_name)
);

create table center_availability (
  id          uuid primary key default gen_random_uuid(),
  center_id   uuid not null references pt_centers(id),
  slot_start  timestamptz not null,
  slot_end    timestamptz not null,
  capacity    int not null default 1,
  booked      int not null default 0,
  source      text check (source in ('api','phone_call','manual','recurring_rule')),
  captured_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. PATIENT AVAILABILITY (collected via SMS/voice)
-- ------------------------------------------------------------

create table patient_availability (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references patients(id),
  order_id    uuid references orders(id),
  day_of_week int not null check (day_of_week between 0 and 6),
  window_start time not null,
  window_end   time not null,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 6. MATCHING & APPOINTMENTS
-- ------------------------------------------------------------

create table match_candidates (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id),
  center_id     uuid not null references pt_centers(id),
  distance_km   numeric,
  drive_minutes numeric,
  in_network    boolean,
  score         numeric,
  status        text not null default 'proposed'
                check (status in ('proposed','offered_to_patient','accepted',
                                  'declined','unavailable')),
  created_at    timestamptz not null default now()
);

create table appointments (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id),
  patient_id   uuid not null references patients(id),
  center_id    uuid not null references pt_centers(id),
  is_home_visit boolean not null default false,
  scheduled_start timestamptz not null,
  scheduled_end   timestamptz,
  visit_number int not null,
  status       text not null default 'scheduled'
               check (status in ('scheduled','confirmed','completed','no_show',
                                 'cancelled_patient','cancelled_center',
                                 'rescheduled')),
  status_source text check (status_source in
               ('patient_reported','center_reported','inferred','staff')),
  rescheduled_to uuid references appointments(id),
  created_at   timestamptz not null default now()
);

create index appointments_patient_idx on appointments (patient_id, scheduled_start);

-- ------------------------------------------------------------
-- 7. OUTREACH & ADHERENCE
-- ------------------------------------------------------------

create table outreach_messages (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null references patients(id),
  order_id     uuid references orders(id),
  appointment_id uuid references appointments(id),
  channel      text not null check (channel in ('sms','voice','email')),
  direction    text not null check (direction in ('outbound','inbound')),
  purpose      text not null check (purpose in
               ('intake_address','intake_availability','offer_slot',
                'confirmation','reminder_24h','reminder_2h','post_visit_check',
                'missed_visit_recovery','reeval_notice','nps','other')),
  body         text,
  call_recording_url text,
  ai_extraction jsonb,
  provider_ref text,
  sent_at      timestamptz not null default now(),
  responded    boolean default false
);

create index outreach_patient_idx on outreach_messages (patient_id, sent_at);

create table adherence_snapshots (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references orders(id),
  as_of          date not null,
  visits_expected int not null,
  visits_completed int not null,
  visits_missed  int not null,
  adherence_pct  numeric,
  risk_level     text check (risk_level in ('on_track','at_risk','fallen_off')),
  escalated_to_provider boolean not null default false,
  unique (order_id, as_of)
);

create table provider_reports (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id),
  provider_id uuid not null references providers(id),
  report_type text not null check (report_type in
              ('scheduled_confirmation','progress_reeval','adherence_alert',
               'completion_summary','could_not_reach_patient')),
  body        text,
  sent_via    text check (sent_via in ('fax','email','portal','sms')),
  sent_at     timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 8. AUDIT (HIPAA: log every PHI access)
-- ------------------------------------------------------------

create table audit_log (
  id          bigserial primary key,
  actor       text not null,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  detail      jsonb,
  occurred_at timestamptz not null default now()
);
