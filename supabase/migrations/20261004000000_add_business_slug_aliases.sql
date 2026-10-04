create table if not exists public.business_slug_aliases (
  alias text primary key,
  business_id uuid not null references public.businesses(id),
  created_at timestamptz not null default now()
);
