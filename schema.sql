-- ============================================================
-- Poolify – Database Schema for Supabase
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ── Teardown (safe to re-run) ─────────────────────────────────
drop policy if exists "Users can view all profiles" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Authenticated users can create clans" on public.clans;
drop policy if exists "Only owner can update clan" on public.clans;
drop policy if exists "Clan members can view their clan" on public.clans;
drop policy if exists "Members can view fellow members" on public.clan_members;
drop policy if exists "Authenticated users can join clans" on public.clan_members;
drop policy if exists "Members can leave clans" on public.clan_members;
drop policy if exists "Anyone can view matches" on public.matches;
drop policy if exists "Clan members can view predictions in their clan" on public.predictions;
drop policy if exists "Users can insert their own predictions" on public.predictions;
drop policy if exists "Users can update their own predictions" on public.predictions;
drop policy if exists "Anyone can view tournaments" on public.tournaments;
drop policy if exists "Anyone can view teams" on public.teams;
drop policy if exists "Clan members can view clan_tournaments" on public.clan_tournaments;
drop policy if exists "Clan owner can manage clan_tournaments" on public.clan_tournaments;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.is_clan_member(uuid);

drop table if exists public.predictions cascade;
drop table if exists public.clan_members cascade;
drop table if exists public.clan_tournaments cascade;
drop table if exists public.clans cascade;
drop table if exists public.teams cascade;
drop table if exists public.matches cascade;
drop table if exists public.tournaments cascade;
drop table if exists public.profiles cascade;

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── Profiles ────────────────────────────────────────────────
-- Mirrors auth.users; populated via a trigger on signup.
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text not null unique,
  default_clan_id uuid,                             -- set on demand; FK added below after clans exists
  language        text not null default 'en' check (language in ('en','es','de')),
  created_at      timestamptz not null default now(),
  -- Personal info (locked once all fields are filled)
  bet_amount      numeric,
  religion        text,
  sexual_orientation text,
  race            text,
  fav_cabo_verde_player text,
  personal_info_locked boolean not null default false,
  is_admin        boolean not null default false
);
alter table public.profiles enable row level security;

create policy "Users can view all profiles"
  on public.profiles for select using (true);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Trigger: auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'username'), ''),
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Clans ────────────────────────────────────────────────────
create table public.clans (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text not null unique default upper(substring(gen_random_uuid()::text, 1, 8)),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  settings    jsonb not null default '{"points_exact": 4, "points_sign": 1, "can_members_invite": true}'::jsonb,
  created_at  timestamptz not null default now()
);
alter table public.clans enable row level security;

create policy "Authenticated users can create clans"
  on public.clans for insert
  with check (auth.uid() = owner_id);

create policy "Only owner can update clan"
  on public.clans for update
  using (auth.uid() = owner_id);

-- ── Clan Members ─────────────────────────────────────────────
create table public.clan_members (
  id         uuid primary key default gen_random_uuid(),
  clan_id    uuid not null references public.clans(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  unique (clan_id, user_id)
);
alter table public.clan_members enable row level security;

create policy "Authenticated users can join clans"
  on public.clan_members for insert
  with check (auth.uid() = user_id);

create policy "Members can leave clans"
  on public.clan_members for delete
  using (auth.uid() = user_id);

-- Now that clans exists, wire the optional default_clan_id FK on profiles.
alter table public.profiles
  add constraint profiles_default_clan_id_fkey
  foreign key (default_clan_id) references public.clans(id) on delete set null;

-- Helper: check membership without triggering RLS recursion
-- Defined after clan_members table exists, before policies that use it
create or replace function public.is_clan_member(p_clan_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.clan_members
    where clan_id = p_clan_id and user_id = auth.uid()
  );
$$;

create policy "Members can view fellow members"
  on public.clan_members for select
  using (public.is_clan_member(clan_id));

create policy "Clan members can view their clan"
  on public.clans for select
  using (public.is_clan_member(id));

-- ── Tournaments ──────────────────────────────────────────────
create table public.tournaments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  status      text not null default 'upcoming'
              check (status in ('upcoming', 'in_progress', 'finished')),
  created_at  timestamptz not null default now()
);
alter table public.tournaments enable row level security;

create policy "Anyone can view tournaments"
  on public.tournaments for select using (true);

-- ── Teams ────────────────────────────────────────────────────
-- Canonical team roster per tournament (used for flags + dropdowns)
create table public.teams (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  name          text not null,   -- canonical name matching matches.home_team / away_team
  flag_code     text,             -- ISO code for flagcdn.com (e.g. 'es', 'gb-eng')
  created_at    timestamptz not null default now(),
  unique (tournament_id, name)
);
alter table public.teams enable row level security;

create policy "Anyone can view teams"
  on public.teams for select using (true);

-- ── Matches ──────────────────────────────────────────────────
create table public.matches (
  id            uuid primary key default gen_random_uuid(),
  home_team     text not null,
  away_team     text not null,
  match_date    timestamptz not null,
  home_score    int,
  away_score    int,
  stage         text not null default 'Group Stage',
  status        text not null default 'upcoming' check (status in ('upcoming','live','finished')),
  tournament_id uuid references public.tournaments(id) on delete set null,
  created_at    timestamptz not null default now(),
  ratified      boolean not null default false
);
alter table public.matches enable row level security;

create policy "Anyone can view matches"
  on public.matches for select using (true);

-- ── Predictions ──────────────────────────────────────────────
create table public.predictions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  match_id        uuid not null references public.matches(id) on delete cascade,
  clan_id         uuid not null references public.clans(id) on delete cascade,
  home_score      text not null check (home_score in ('0','1','2','+')),
  away_score      text not null check (away_score in ('0','1','2','+')),
  points          int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, match_id, clan_id)
);
alter table public.predictions enable row level security;

create policy "Clan members can view predictions in their clan"
  on public.predictions for select
  using (public.is_clan_member(clan_id));

create policy "Users can insert their own predictions"
  on public.predictions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own predictions"
  on public.predictions for update
  using (auth.uid() = user_id);

-- ── Seed Data – 3 World Cup 2026 Matches ─────────────────────
insert into public.matches (home_team, away_team, match_date, stage) values
  ('México',    'Estados Unidos', '2026-06-15 20:00:00+00', 'Grupo A'),
  ('España',    'Argentina',      '2026-06-17 20:00:00+00', 'Grupo B'),
  ('Brasil',    'Francia',        '2026-06-19 20:00:00+00', 'Grupo C');

-- ── Tournament Predictions ────────────────────────────────────
-- One row per user per clan. Filled before tournament deadline.
create table public.tournament_predictions (
  id            uuid primary key default gen_random_uuid(),
  clan_id       uuid not null references public.clans(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  winner        text,
  runner_up     text,
  semi1         text,
  semi2         text,
  top_scorer    text,
  custom_answers jsonb not null default '{}'::jsonb,
  points        int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (clan_id, user_id)
);
alter table public.tournament_predictions enable row level security;

create policy "Clan members can view tournament predictions"
  on public.tournament_predictions for select
  using (public.is_clan_member(clan_id));

create policy "Users can insert their own tournament prediction"
  on public.tournament_predictions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tournament prediction"
  on public.tournament_predictions for update
  using (auth.uid() = user_id);

-- ── Tournament Results (owner-set actual results for scoring) ─
create table public.tournament_results (
  clan_id        uuid primary key references public.clans(id) on delete cascade,
  winner         text,
  runner_up      text,
  semis          text[] not null default '{}',
  top_scorer     text,
  custom_results jsonb not null default '{}'::jsonb,
  awarded_at     timestamptz
);
alter table public.tournament_results enable row level security;

create policy "Clan members can view tournament results"
  on public.tournament_results for select
  using (public.is_clan_member(clan_id));

-- Owner writes/updates results via admin client (bypasses RLS).

-- ── Clan Tournaments ─────────────────────────────────────────
-- Which tournaments each clan participates in (bets on)
create table public.clan_tournaments (
  clan_id        uuid not null references public.clans(id) on delete cascade,
  tournament_id  uuid not null references public.tournaments(id) on delete cascade,
  joined_at      timestamptz not null default now(),
  primary key (clan_id, tournament_id)
);
alter table public.clan_tournaments enable row level security;

create policy "Clan members can view clan_tournaments"
  on public.clan_tournaments for select
  using (public.is_clan_member(clan_id));

create policy "Clan owner can manage clan_tournaments"
  on public.clan_tournaments for all
  using (exists (
    select 1 from public.clans where id = clan_id and owner_id = auth.uid()
  ));

-- ── Incremental Migration Notes ─────────────────────────────
-- If a previous version of this schema is already deployed, run the
-- following statements (they are no-ops on a fresh install):
--
-- NEW (personal info):
--   alter table public.profiles add column if not exists bet_amount numeric;
--   alter table public.profiles add column if not exists religion text;
--   alter table public.profiles add column if not exists sexual_orientation text;
--   alter table public.profiles add column if not exists race text;
--   alter table public.profiles add column if not exists fav_cabo_verde_player text;
--   alter table public.profiles add column if not exists personal_info_locked boolean not null default false;
--
--   alter table public.profiles
--     add column if not exists default_clan_id uuid
--       references public.clans(id) on delete set null;
--
--   alter table public.profiles
--     add column if not exists language text not null default 'en'
--       check (language in ('en','es','de'));
--
--   alter table public.clans
--     add column if not exists settings jsonb not null
--       default '{"points_exact": 4, "points_sign": 1, "can_members_invite": true}'::jsonb;
--
-- NEW (tournament predictions):
--   Run the tournament_predictions + tournament_results blocks above.
--
-- NEW (tournaments + clan_tournaments):
--   create table public.tournaments (...) -- see block above
--   alter table public.matches add column if not exists tournament_id uuid references public.tournaments(id) on delete set null;
--   create table public.clan_tournaments (...) -- see block above
--
-- NEW (teams table + text prediction scores):
--   create table public.teams (...) -- see block above
--   alter table public.predictions
--     alter column home_score type text using case when home_score >= 3 then '+' else home_score::text end,
--     alter column away_score type text using case when away_score >= 3 then '+' else away_score::text end;
--   alter table public.predictions
--     add constraint predictions_home_score_check check (home_score in ('0','1','2','+')),
--     add constraint predictions_away_score_check check (away_score in ('0','1','2','+'));
--
-- NEW (admin panel: global admins + match ratification):
--   alter table public.profiles add column if not exists is_admin boolean not null default false;
--   alter table public.matches add column if not exists ratified boolean not null default false;
--   -- Promote a user to admin manually:
--   --   update public.profiles set is_admin = true where username = 'your_username';
--
-- NEW (knockout qualifier + per-round scoring overrides):
--   See migration-knockout.sql.
--
-- NEW (exact-score flag on predictions, used by the ranking's "exactos" column):
--   See migration-is-exact.sql. After applying it, re-run the admin panel's
--   "recalculate all finished matches" action to backfill is_exact on
--   existing predictions.
