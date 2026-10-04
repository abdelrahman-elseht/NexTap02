-- NexTap Wave B: core identities and tenant aggregates.
create extension if not exists pgcrypto;

create table public.admin_memberships (
  user_id uuid primary key references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  description text check (description is null or char_length(description) <= 1000),
  phone text,
  whatsapp text,
  email text,
  address text check (address is null or char_length(address) <= 500),
  map_url text,
  directions_url text,
  google_reviews_url text,
  timezone text not null default 'UTC' check (char_length(timezone) between 1 and 128),
  status text not null default 'disabled' check (status in ('disabled', 'enabled')),
  content_revision bigint not null default 1 check (content_revision > 0),
  enabled_at timestamptz,
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  edit_version bigint not null default 1 check (edit_version > 0),
  constraint businesses_map_url_https check (map_url is null or (char_length(map_url) <= 2048 and map_url ~ '^https://[^/@[:space:]]+(/.*)?$')),
  constraint businesses_directions_url_https check (directions_url is null or (char_length(directions_url) <= 2048 and directions_url ~ '^https://[^/@[:space:]]+(/.*)?$')),
  constraint businesses_reviews_url_https check (google_reviews_url is null or (char_length(google_reviews_url) <= 2048 and google_reviews_url ~ '^https://[^/@[:space:]]+(/.*)?$')),
  constraint businesses_transition_timestamps check (
    (status = 'enabled' and enabled_at is not null and disabled_at is null)
    or status = 'disabled'
  )
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  public_token text collate "C" not null check (char_length(public_token) > 0),
  status text not null default 'inactive' check (status in ('inactive', 'active')),
  business_id uuid references public.businesses(id) on delete restrict,
  activated_at timestamptz,
  deactivated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  edit_version bigint not null default 1 check (edit_version > 0),
  constraint cards_active_requires_business check (status = 'inactive' or business_id is not null)
);
create unique index cards_public_token_exact_key on public.cards (public_token collate "C");

create table public.business_slugs (
  slug text collate "C" primary key,
  business_id uuid not null references public.businesses(id) on delete restrict,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  retired_at timestamptz,
  constraint business_slugs_shape check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 1 and 80),
  constraint business_slugs_retirement check ((is_current and retired_at is null) or (not is_current and retired_at is not null))
);
create unique index business_slugs_one_current_per_business on public.business_slugs (business_id) where is_current;

-- Keeps the timestamped pre-Wave-B fixture migration a no-op while preserving its historical relation name.
create table public.business_slug_aliases (
  alias text collate "C" primary key,
  business_id uuid not null references public.businesses(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index businesses_status_id_idx on public.businesses (status, id);
create index businesses_updated_id_idx on public.businesses (updated_at, id);
create index cards_business_status_id_idx on public.cards (business_id, status, id);
create index business_slugs_business_current_idx on public.business_slugs (business_id, is_current);
