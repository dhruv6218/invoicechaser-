-- ============================================================
-- Astrix AI — Database Schema for Supabase
-- Run this in Supabase SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  plan_type text not null default 'Hook', -- Hook, Solo, Agency
  credits_used int not null default 0,
  status text not null default 'active', -- active, suspended, blocked
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Workspaces
create table if not exists public.workspaces (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null default 'My Workspace',
  slug text unique,
  timezone text not null default 'UTC',
  logo_url text,
  plan text not null default 'Hook',
  created_at timestamptz not null default now()
);

-- Payment Gateways
create table if not exists public.gateways (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  type text not null, -- stripe, razorpay, upi, custom
  label text not null,
  api_key_enc text, -- encrypted API key
  static_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Invoices
create table if not exists public.invoices (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  client_name text not null,
  client_email text not null,
  amount numeric not null,
  currency text not null default 'USD',
  due_date date not null,
  status text not null default 'pending', -- pending, paid, paused, disputed
  ai_status text not null default 'pending', -- nudge_sent, escalated, pending, paid
  last_chased_at timestamptz,
  reminder_count int not null default 0,
  payment_link text,
  created_at timestamptz not null default now()
);

-- Tone Settings (AI voice cloning)
create table if not exists public.tone_settings (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade unique,
  sample_emails text,
  tone_level int not null default 2,
  ai_prompt text,
  updated_at timestamptz not null default now()
);

-- Reminder Logs (sent emails)
create table if not exists public.reminder_logs (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  sent_at timestamptz not null default now(),
  email_content text,
  tone_level int,
  decline_reason text
);

-- Activity Feed
create table if not exists public.activity_feed (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  type text not null, -- reminder_sent, payment_received, invoice_created, ai_action, paused, escalated
  message text not null,
  amount numeric,
  created_at timestamptz not null default now()
);

-- Subscriptions (Dodo Payments)
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  dodo_subscription_id text,
  plan text not null default 'Hook',
  status text not null default 'active', -- active, canceled, past_due
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TRIGGERS — Auto-create profile + workspace on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );

  insert into public.workspaces (owner_id, name, slug)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'workspace_name', 'My Workspace'),
    lower(replace(coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), ' ', '-'))
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.gateways enable row level security;
alter table public.invoices enable row level security;
alter table public.tone_settings enable row level security;
alter table public.reminder_logs enable row level security;
alter table public.activity_feed enable row level security;
alter table public.subscriptions enable row level security;

-- Helper: get current user's workspace IDs
create or replace function public.get_user_workspace_ids()
returns uuid[]
language sql
security definer set search_path = public
as $$
  select array_agg(id) from public.workspaces where owner_id = auth.uid();
$$;

-- Profiles: users can see own profile, admins can see all
create policy "Users can view own profile" on public.profiles
  for select using (id = auth.uid());
create policy "Users can update own profile" on public.profiles
  for update using (id = auth.uid());
create policy "Admins can view all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
create policy "Admins can update all profiles" on public.profiles
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Workspaces: users can CRUD their own
create policy "Users can view own workspaces" on public.workspaces
  for select using (owner_id = auth.uid());
create policy "Users can insert own workspaces" on public.workspaces
  for insert with check (owner_id = auth.uid());
create policy "Users can update own workspaces" on public.workspaces
  for update using (owner_id = auth.uid());
create policy "Users can delete own workspaces" on public.workspaces
  for delete using (owner_id = auth.uid());

-- Gateways: users can CRUD within their workspace
create policy "Users can view own gateways" on public.gateways
  for select using (workspace_id = any(public.get_user_workspace_ids()));
create policy "Users can insert own gateways" on public.gateways
  for insert with check (workspace_id = any(public.get_user_workspace_ids()));
create policy "Users can update own gateways" on public.gateways
  for update using (workspace_id = any(public.get_user_workspace_ids()));
create policy "Users can delete own gateways" on public.gateways
  for delete using (workspace_id = any(public.get_user_workspace_ids()));

-- Invoices: users can CRUD within their workspace
create policy "Users can view own invoices" on public.invoices
  for select using (workspace_id = any(public.get_user_workspace_ids()));
create policy "Users can insert own invoices" on public.invoices
  for insert with check (workspace_id = any(public.get_user_workspace_ids()));
create policy "Users can update own invoices" on public.invoices
  for update using (workspace_id = any(public.get_user_workspace_ids()));
create policy "Users can delete own invoices" on public.invoices
  for delete using (workspace_id = any(public.get_user_workspace_ids()));

-- Tone settings: users can CRUD within their workspace
create policy "Users can view own tone" on public.tone_settings
  for select using (workspace_id = any(public.get_user_workspace_ids()));
create policy "Users can insert own tone" on public.tone_settings
  for insert with check (workspace_id = any(public.get_user_workspace_ids()));
create policy "Users can update own tone" on public.tone_settings
  for update using (workspace_id = any(public.get_user_workspace_ids()));
create policy "Users can delete own tone" on public.tone_settings
  for delete using (workspace_id = any(public.get_user_workspace_ids()));

-- Reminder logs: users can view within their workspace
create policy "Users can view own reminders" on public.reminder_logs
  for select using (workspace_id = any(public.get_user_workspace_ids()));
create policy "Users can insert own reminders" on public.reminder_logs
  for insert with check (workspace_id = any(public.get_user_workspace_ids()));

-- Activity feed: users can view/insert within their workspace
create policy "Users can view own activity" on public.activity_feed
  for select using (workspace_id = any(public.get_user_workspace_ids()));
create policy "Users can insert own activity" on public.activity_feed
  for insert with check (workspace_id = any(public.get_user_workspace_ids()));

-- Subscriptions: users can view own, admins can view all
create policy "Users can view own subs" on public.subscriptions
  for select using (user_id = auth.uid());
create policy "Admins can view all subs" on public.subscriptions
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_invoices_workspace on public.invoices(workspace_id);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_gateways_workspace on public.gateways(workspace_id);
create index if not exists idx_reminders_invoice on public.reminder_logs(invoice_id);
create index if not exists idx_activity_workspace on public.activity_feed(workspace_id);
create index if not exists idx_workspaces_owner on public.workspaces(owner_id);
