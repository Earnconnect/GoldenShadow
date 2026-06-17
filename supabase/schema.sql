-- ─────────────────────────────────────────────────────────────
-- Golden Shadow Publishing — database schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
-- Safe to re-run: uses IF NOT EXISTS / idempotent policy drops.
-- ─────────────────────────────────────────────────────────────

-- The is_admin() helper below reads public.profiles, which is created further
-- down in this script. Turn off function-body validation so Postgres accepts
-- that forward reference at creation time (profiles exists by query time).
set check_function_bodies = off;

-- Application status lifecycle
do $$
begin
  if not exists (select 1 from pg_type where typname = 'application_status') then
    create type application_status as enum ('pending', 'approved', 'declined');
  end if;
  if not exists (select 1 from pg_type where typname = 'applicant_type') then
    create type applicant_type as enum ('creator', 'executive');
  end if;
end$$;

-- Helper: is the current user a studio admin? SECURITY DEFINER so it can read
-- profiles without tripping that table's own RLS (avoids policy recursion).
create or replace function public.is_admin()
returns boolean
language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Applications submitted from the public /apply form
create table if not exists public.applications (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  reviewed_at   timestamptz,
  type          applicant_type not null,
  status        application_status not null default 'pending',
  name          text not null,
  email         text not null,
  website       text,
  category      text,
  tier_interest text,
  audience      text,
  message       text not null,
  notes         text -- internal admin notes
);

create index if not exists applications_status_idx on public.applications (status);
create index if not exists applications_created_idx on public.applications (created_at desc);

-- ── Row Level Security ─────────────────────────────────────────
alter table public.applications enable row level security;

-- Anyone (anon) may submit an application — but only INSERT, nothing else.
drop policy if exists "public can submit applications" on public.applications;
create policy "public can submit applications"
  on public.applications
  for insert
  to anon, authenticated
  with check (true);

-- Only studio admins can read applications.
drop policy if exists "authenticated can read applications" on public.applications;
drop policy if exists "admins can read applications" on public.applications;
create policy "admins can read applications"
  on public.applications
  for select
  to authenticated
  using (public.is_admin());

-- Only studio admins can update (approve / decline / add notes).
drop policy if exists "authenticated can update applications" on public.applications;
drop policy if exists "admins can update applications" on public.applications;
create policy "admins can update applications"
  on public.applications
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── Orders (Phase 4: Stripe payments) ──────────────────────────
-- Written by the Stripe webhook (using the service-role key, which
-- bypasses RLS). Readable only by authenticated admins.
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  tier              text not null,
  mode              text not null,           -- 'payment' | 'subscription'
  amount_total      integer,                 -- in cents
  currency          text,
  customer_email    text,
  customer_name     text,
  status            text,                    -- e.g. 'paid', 'complete'
  stripe_session_id text unique,
  stripe_customer_id text
);

create index if not exists orders_created_idx on public.orders (created_at desc);

alter table public.orders enable row level security;

-- Admins read all orders; a creator can read only their own (matched by the
-- email on the order). No insert/update policy: the webhook writes with the
-- service-role key, which bypasses RLS.
drop policy if exists "authenticated can read orders" on public.orders;
drop policy if exists "read own or admin orders" on public.orders;
create policy "read own or admin orders"
  on public.orders
  for select
  to authenticated
  using (
    customer_email = (auth.jwt() ->> 'email')
    or public.is_admin()
  );

-- ── Profiles (Phase 5: roles for admins vs creators) ───────────
-- One row per auth user. role = 'admin' (studio staff) | 'creator' (member).
-- creator_slug links a creator account to their public profile row.
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  full_name    text,
  role         text not null default 'creator',
  creator_slug text
);

-- Phase 10: membership plan. 'none' until they buy/are granted access.
-- Gates the AI Studio Engine ('studio' | 'platform' unlock it).
alter table public.profiles add column if not exists plan text not null default 'none';

alter table public.profiles enable row level security;

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid());

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Auto-create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any users that already exist.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- ── Creators (Phase 5: DB-backed, editable creator profiles) ───
-- Seeded lazily: the public site falls back to the static roster in
-- lib/data.ts until a creator saves edits, which upserts a row here.
create table if not exists public.creators (
  slug          text primary key,
  user_id       uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now(),
  initial       text,
  tag           text,
  category_slug text,
  name          text not null,
  role          text,
  "desc"        text,
  badge         text,
  focus         text[] default '{}',
  bio           text[] default '{}',
  projects      jsonb  default '[]'
);

-- Phase 9: admins can spotlight creators on the homepage / directory.
alter table public.creators add column if not exists featured boolean default false;

alter table public.creators enable row level security;

-- Public can read every creator profile.
drop policy if exists "public read creators" on public.creators;
create policy "public read creators"
  on public.creators for select to anon, authenticated
  using (true);

-- A creator may insert/update only their own row (user_id = themselves).
drop policy if exists "owner insert creator" on public.creators;
create policy "owner insert creator"
  on public.creators for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "owner update creator" on public.creators;
create policy "owner update creator"
  on public.creators for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── AI Studio artifacts (Phase 6: Studio Engine) ───────────────
-- One row per saved artifact: the creator's source material, or a generated
-- stage output (blueprint / architecture / chapter / product_suite).
create table if not exists public.ai_artifacts (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  creator_slug text,
  kind         text not null, -- source | blueprint | architecture | chapter | product_suite
  title        text not null,
  content      jsonb not null default '{}'::jsonb,
  model        text,
  -- One artifact per kind per creator (regenerating a stage replaces it).
  unique (user_id, kind)
);

create index if not exists ai_artifacts_user_idx on public.ai_artifacts (user_id, created_at desc);
create index if not exists ai_artifacts_kind_idx on public.ai_artifacts (kind);

-- Phase 8: studio editorial review on each artifact.
alter table public.ai_artifacts add column if not exists review_status text;
alter table public.ai_artifacts add column if not exists review_note text;

alter table public.ai_artifacts enable row level security;

-- Owner reads their own; admins read all. No public access.
drop policy if exists "owner or admin read ai_artifacts" on public.ai_artifacts;
create policy "owner or admin read ai_artifacts"
  on public.ai_artifacts for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "owner insert ai_artifacts" on public.ai_artifacts;
create policy "owner insert ai_artifacts"
  on public.ai_artifacts for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "owner update ai_artifacts" on public.ai_artifacts;
create policy "owner update ai_artifacts"
  on public.ai_artifacts for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "owner delete ai_artifacts" on public.ai_artifacts;
create policy "owner delete ai_artifacts"
  on public.ai_artifacts for delete to authenticated
  using (user_id = auth.uid());

-- ── Journal posts (Phase 9: in-app CMS) ────────────────────────
-- Public reads published posts; admins manage all via the service-role client.
create table if not exists public.journal_posts (
  slug        text primary key,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  title       text not null,
  tag         text,
  excerpt     text,
  body        text[] default '{}',
  date        text,
  read_time   text,
  published   boolean not null default false
);

create index if not exists journal_published_idx on public.journal_posts (published, created_at desc);

alter table public.journal_posts enable row level security;

drop policy if exists "public read published posts" on public.journal_posts;
create policy "public read published posts"
  on public.journal_posts for select to anon, authenticated
  using (published or public.is_admin());

-- (No insert/update/delete policy: admin writes go through the service-role
-- client in an is_admin()-guarded server action.)

-- ── Inquiries (Phase 9: brand/publisher "work with me" leads) ──
create table if not exists public.inquiries (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  creator_slug text,
  name         text not null,
  email        text not null,
  company      text,
  message      text not null,
  status       text not null default 'new' -- new | handled
);

create index if not exists inquiries_created_idx on public.inquiries (created_at desc);

alter table public.inquiries enable row level security;

-- Anyone may submit an inquiry (INSERT only); only admins can read/update.
drop policy if exists "public submit inquiry" on public.inquiries;
create policy "public submit inquiry"
  on public.inquiries for insert to anon, authenticated
  with check (true);

drop policy if exists "admins read inquiries" on public.inquiries;
create policy "admins read inquiries"
  on public.inquiries for select to authenticated
  using (public.is_admin());

drop policy if exists "admins update inquiries" on public.inquiries;
create policy "admins update inquiries"
  on public.inquiries for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- NOTE ON ROLES & ACCESS
-- New sign-ups default to role 'creator'. To make yourself a studio admin
-- (access to /admin), promote your user once:
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'you@example.com');
--
-- To let a creator edit their public profile from /dashboard, link their
-- account to a roster slug (and grant ownership of the row if it exists):
--   update public.profiles set creator_slug = 'alexandra-m'
--   where id = (select id from auth.users where email = 'creator@example.com');
--
-- Keep signups locked down so only invited people get accounts:
--   Supabase → Authentication → Providers → Email → turn OFF "Enable signups",
--   then create users manually under Authentication → Users.
-- ─────────────────────────────────────────────────────────────
