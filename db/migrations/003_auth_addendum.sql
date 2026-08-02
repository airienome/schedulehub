-- ============================================================
-- PT Orchestration - Neon Auth Addendum
-- Auth is STAFF ONLY. Patients never authenticate (SMS/voice).
--
-- On real Neon: neon_auth.users_sync already exists.
--   Run only SECTION B and D there.
-- For local dev without Neon: run SECTION A first to mock it.
-- ============================================================

-- ------------------------------------------------------------
-- SECTION A: LOCAL DEV MOCK ONLY (skip on real Neon)
-- ------------------------------------------------------------
create schema if not exists neon_auth;

create table if not exists neon_auth.users_sync (
  id          text primary key,
  name        text,
  email       text,
  created_at  timestamptz,
  updated_at  timestamptz,
  deleted_at  timestamptz,
  raw_json    jsonb
);

-- ------------------------------------------------------------
-- SECTION B: APP AUTH LAYER (run everywhere)
-- ------------------------------------------------------------

create table app_users (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  text unique not null
                references neon_auth.users_sync(id) on delete cascade,
  role          text not null check (role in (
                  'platform_admin',
                  'practice_admin',
                  'provider',
                  'coordinator',
                  'center_staff'
                )),
  practice_id   uuid references practices(id),
  center_id     uuid references pt_centers(id),
  provider_id   uuid references providers(id),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  constraint role_scope check (
    (role = 'platform_admin' and practice_id is null and center_id is null)
    or (role in ('practice_admin','coordinator') and practice_id is not null)
    or (role = 'provider' and practice_id is not null and provider_id is not null)
    or (role = 'center_staff' and center_id is not null)
  )
);

create index app_users_auth_idx on app_users (auth_user_id);

create table user_invites (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  role         text not null,
  practice_id  uuid references practices(id),
  center_id    uuid references pt_centers(id),
  provider_id  uuid references providers(id),
  invited_by   uuid references app_users(id),
  status       text not null default 'pending'
               check (status in ('pending','accepted','expired','revoked')),
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default now() + interval '14 days',
  accepted_at  timestamptz
);

create unique index user_invites_pending_email
  on user_invites (lower(email)) where status = 'pending';

create view active_staff as
select au.id, au.role, au.practice_id, au.center_id, au.provider_id,
       us.email, us.name, au.auth_user_id
from app_users au
left join neon_auth.users_sync us on us.id = au.auth_user_id
where au.is_active
  and (us.deleted_at is null);

-- ------------------------------------------------------------
-- SECTION D: PASSWORDLESS / SMS LOGIN SUPPORT
-- ------------------------------------------------------------

alter table app_users add column if not exists phone text;
alter table app_users add column if not exists phone_verified boolean not null default false;
create unique index if not exists app_users_phone_idx
  on app_users (phone) where phone is not null;

alter table user_invites add column if not exists phone text;

create table if not exists login_events (
  id            bigserial primary key,
  app_user_id   uuid references app_users(id),
  identifier    text not null,
  method        text not null check (method in
                ('sms_otp','sms_magic_link','email_magic_link','email_otp')),
  event         text not null check (event in
                ('sent','delivered','verified','failed','expired','rate_limited')),
  ip            inet,
  user_agent    text,
  provider_ref  text,
  occurred_at   timestamptz not null default now()
);
create index if not exists login_events_user_idx
  on login_events (app_user_id, occurred_at);
