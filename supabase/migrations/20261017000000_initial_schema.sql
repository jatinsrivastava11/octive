-- ============================================================================
-- Octive: Initial Database Schema (Postgres 15+ / Supabase)
-- Status: Staged for review (DO NOT APPLY without user approval)
-- ============================================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  bio text,
  is_private boolean default false not null,
  birth_year smallint not null,
  birth_month smallint not null,
  show_play_counts boolean default true not null,
  plan text default 'pro' not null check (plan in ('free', 'pro')),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,

  constraint username_length check (char_length(username) >= 3 and char_length(username) <= 20),
  constraint birth_month_valid check (birth_month >= 1 and birth_month <= 12)
);

-- 2. PROVIDER CONNECTIONS (Spotify & Apple Music auth tokens)
create table if not exists public.provider_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  provider text not null check (provider in ('spotify', 'apple')),
  provider_user_id text not null,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  last_synced_at timestamptz,
  sync_cursor text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,

  unique (user_id, provider)
);

-- 3. PLAYS (Deduplicated individual stream events)
create table if not exists public.plays (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  track_id text not null,
  track_name text not null,
  artist_name text not null,
  album_name text,
  played_at timestamptz not null,
  source text default 'spotify_sync' not null check (source in ('spotify_sync', 'spotify_import', 'manual')),
  created_at timestamptz default timezone('utc'::text, now()) not null,

  -- Critical: Prevents duplicate plays from polling or re-imports
  unique (user_id, track_id, played_at)
);

create index if not exists plays_user_track_idx on public.plays (user_id, track_id);
create index if not exists plays_user_played_at_idx on public.plays (user_id, played_at desc);

-- 4. RANKINGS
create table if not exists public.rankings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  kind text not null check (kind in ('track', 'album', 'artist')),
  is_public boolean default true not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 5. RANKING ITEMS (Ordered list items with scores & Octive credibility)
create table if not exists public.ranking_items (
  id uuid default gen_random_uuid() primary key,
  ranking_id uuid references public.rankings(id) on delete cascade not null,
  position integer not null,
  item_id text not null,
  item_name text not null,
  artist_name text not null,
  image_url text,
  score numeric(3,1) not null check (score >= 0.0 and score <= 10.0),
  octive_rating smallint check (octive_rating >= 0 and octive_rating <= 100),
  octive_label text,
  play_count integer default 0 not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,

  unique (ranking_id, position),
  unique (ranking_id, item_id)
);

-- 6. RANKING SCORES (Community ratings for a user's ranking)
create table if not exists public.ranking_scores (
  id uuid default gen_random_uuid() primary key,
  ranking_id uuid references public.rankings(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  score numeric(3,1) not null check (score >= 0.0 and score <= 10.0),
  created_at timestamptz default timezone('utc'::text, now()) not null,

  unique (ranking_id, user_id)
);

-- 7. CARDS (Generated collectible stats cards)
create table if not exists public.cards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category text not null,
  title text not null,
  subtitle text not null,
  rarity text not null check (rarity in ('common', 'rare', 'epic', 'legendary')),
  stats_json jsonb not null default '[]'::jsonb,
  flavor_text text not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists cards_user_idx on public.cards (user_id, created_at desc);

-- 8. BADGES (Unlocked achievements)
create table if not exists public.badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id text not null,
  unlocked_at timestamptz default timezone('utc'::text, now()) not null,

  unique (user_id, badge_id)
);

-- 9. FOLLOWS (Social graph)
create table if not exists public.follows (
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'accepted' not null check (status in ('pending', 'accepted')),
  created_at timestamptz default timezone('utc'::text, now()) not null,

  primary key (follower_id, following_id)
);

-- 10. SHARE LINKS (Private profile revocable access)
create table if not exists public.share_links (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  token text unique not null,
  is_revoked boolean default false not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 11. DIARY ENTRIES (Letterboxd-style listening logs)
create table if not exists public.diary_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  album_id text not null,
  album_name text not null,
  artist_name text not null,
  image_url text,
  listened_date date not null default current_date,
  score numeric(3,1) check (score >= 0.0 and score <= 10.0),
  octive_rating smallint check (octive_rating >= 0 and octive_rating <= 100),
  review text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 12. REPORTS (Community safety)
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  target_type text not null check (target_type in ('ranking', 'diary', 'profile', 'comment')),
  target_id text not null,
  reason text not null,
  details text,
  status text default 'pending' not null check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enforces privacy and authorization at the database layer
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.provider_connections enable row level security;
alter table public.plays enable row level security;
alter table public.rankings enable row level security;
alter table public.ranking_items enable row level security;
alter table public.ranking_scores enable row level security;
alter table public.cards enable row level security;
alter table public.badges enable row level security;
alter table public.follows enable row level security;
alter table public.share_links enable row level security;
alter table public.diary_entries enable row level security;
alter table public.reports enable row level security;

-- Profiles: Public profiles readable by anyone; private profiles only by approved followers or owner
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (not is_private or auth.uid() = id or exists (
    select 1 from public.follows where follower_id = auth.uid() and following_id = public.profiles.id and status = 'accepted'
  ));

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Provider connections: Strictly private to the user
create policy "Users can only view their own provider connections" on public.provider_connections
  for select using (auth.uid() = user_id);

create policy "Users can modify their own provider connections" on public.provider_connections
  for all using (auth.uid() = user_id);

-- Plays: Viewable if owner, or if profile is public/followed
create policy "Plays are readable based on profile privacy" on public.plays
  for select using (auth.uid() = user_id or exists (
    select 1 from public.profiles where id = public.plays.user_id and (
      not is_private or exists (
        select 1 from public.follows where follower_id = auth.uid() and following_id = public.plays.user_id and status = 'accepted'
      )
    )
  ));

create policy "Users insert own plays" on public.plays
  for insert with check (auth.uid() = user_id);

-- Rankings: Public rankings or approved followers
create policy "Rankings readable if public or followed" on public.rankings
  for select using (is_public or auth.uid() = user_id or exists (
    select 1 from public.follows where follower_id = auth.uid() and following_id = public.rankings.user_id and status = 'accepted'
  ));

create policy "Users manage own rankings" on public.rankings
  for all using (auth.uid() = user_id);

-- Ranking Items: Inherits ranking visibility
create policy "Ranking items readable with ranking" on public.ranking_items
  for select using (exists (
    select 1 from public.rankings where id = public.ranking_items.ranking_id and (
      is_public or auth.uid() = user_id or exists (
        select 1 from public.follows where follower_id = auth.uid() and following_id = public.rankings.user_id and status = 'accepted'
      )
    )
  ));

create policy "Users manage own ranking items" on public.ranking_items
  for all using (exists (
    select 1 from public.rankings where id = public.ranking_items.ranking_id and auth.uid() = user_id
  ));

-- Cards & Badges: Visible if profile visible
create policy "Cards readable with profile" on public.cards
  for select using (auth.uid() = user_id or exists (
    select 1 from public.profiles where id = public.cards.user_id and (
      not is_private or exists (
        select 1 from public.follows where follower_id = auth.uid() and following_id = public.cards.user_id and status = 'accepted'
      )
    )
  ));

create policy "Badges readable with profile" on public.badges
  for select using (auth.uid() = user_id or exists (
    select 1 from public.profiles where id = public.badges.user_id and (
      not is_private or exists (
        select 1 from public.follows where follower_id = auth.uid() and following_id = public.badges.user_id and status = 'accepted'
      )
    )
  ));

-- Share Links: Only owner can view and manage
create policy "Owners manage share links" on public.share_links
  for all using (auth.uid() = user_id);

-- Reports: Authenticated users can insert reports; nobody reads except admin via service role
create policy "Users can submit reports" on public.reports
  for insert with check (auth.uid() = reporter_id);
