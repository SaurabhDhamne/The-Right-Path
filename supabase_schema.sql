-- ========================================================
-- THE RIGHT PATH - COMPLETE & SAFE DATABASE MIGRATION SCRIPT
-- Safely drops existing policies first to prevent Error 42710
-- ========================================================

-- 1. Create PROFILES Table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  role text not null default 'user' check (role in ('admin', 'user')),
  user_type text check (user_type in ('student', 'institution')),
  account_status text not null default 'active' check (account_status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

-- 2. Extend LEADS Table for Authentication & CRM
alter table public.leads add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.leads add column if not exists submission_type text not null default 'guest' check (submission_type in ('guest', 'authenticated'));
alter table public.leads add column if not exists internal_notes text;
alter table public.leads add column if not exists assigned_to uuid references auth.users(id) on delete set null;

-- 3. Create ACTIVITY_LOGS Table for Audit Trail
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb
);

-- 4. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.activity_logs enable row level security;

-- 5. Drop existing policies to prevent "ERROR: 42710 policy already exists"
drop policy if exists "Allow service role full access on profiles" on public.profiles;
drop policy if exists "Allow users to read their own profile" on public.profiles;
drop policy if exists "Allow service role full access on leads" on public.leads;
drop policy if exists "Public can submit leads" on public.leads;
drop policy if exists "Users can view their own leads" on public.leads;
drop policy if exists "Admins can update leads" on public.leads;
drop policy if exists "Authenticated users can read leads" on public.leads;
drop policy if exists "Authenticated users can update lead status" on public.leads;
drop policy if exists "Allow service role full access on activity_logs" on public.activity_logs;
drop policy if exists "Users can view own activity logs" on public.activity_logs;

-- 6. Create Fresh RLS Policies
-- Profiles
create policy "Allow service role full access on profiles"
on public.profiles for all to service_role
using (true) with check (true);

create policy "Allow users to read their own profile"
on public.profiles for select to authenticated
using (auth.uid() = id);

-- Leads
create policy "Allow service role full access on leads"
on public.leads for all to service_role
using (true) with check (true);

create policy "Public can submit leads"
on public.leads for insert to anon, authenticated
with check (status = 'new' and consent = true);

create policy "Users can view their own leads"
on public.leads for select to authenticated
using (
  auth.uid() = user_id or 
  email = (select email from auth.users where id = auth.uid()) or
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Admins can update leads"
on public.leads for update to authenticated
using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
)
with check (true);

-- Activity Logs
create policy "Allow service role full access on activity_logs"
on public.activity_logs for all to service_role
using (true) with check (true);

create policy "Users can view own activity logs"
on public.activity_logs for select to authenticated
using (
  actor_id = auth.uid() or
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
