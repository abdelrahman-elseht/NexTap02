-- NexTap Wave B: content, assignments and operational history.
create table public.business_sections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  section_type text not null check (section_type in ('hero', 'contact', 'social', 'payments', 'location', 'hours', 'reviews', 'custom_links')),
  is_enabled boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  settings_schema_version smallint not null default 1 check (settings_schema_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  edit_version bigint not null default 1 check (edit_version > 0),
  unique (id, business_id),
  unique (business_id, section_type)
);

create table public.business_links (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  section_id uuid not null,
  link_type text not null,
  label text not null check (char_length(label) between 1 and 80),
  normalized_label text not null,
  url text not null check (char_length(url) <= 2048 and url ~ '^https://[^/@[:space:]]+(/.*)?$'),
  icon_key text,
  is_active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  edit_version bigint not null default 1 check (edit_version > 0),
  foreign key (section_id, business_id) references public.business_sections(id, business_id) on delete restrict,
  constraint business_links_type_by_section check (
    link_type in ('instagram', 'facebook', 'tiktok', 'youtube', 'snapchat', 'linkedin', 'x', 'payment', 'instapay', 'vodafone_cash', 'paypal', 'stripe', 'custom')
    and (icon_key is null or icon_key in ('instagram', 'facebook', 'tiktok', 'youtube', 'snapchat', 'linkedin', 'x', 'payment', 'instapay', 'vodafone_cash', 'paypal', 'stripe', 'custom'))
  )
);
create index business_sections_business_visibility_order_idx on public.business_sections (business_id, is_enabled, sort_order, id);
create index business_links_business_section_visibility_order_idx on public.business_links (business_id, section_id, is_active, sort_order, id);
create unique index business_links_active_label_key on public.business_links (business_id, section_id, normalized_label) where is_active;

create table public.business_hours (
  business_id uuid primary key references public.businesses(id) on delete restrict,
  timezone text not null,
  updated_at timestamptz not null default now(),
  edit_version bigint not null default 1 check (edit_version > 0)
);

create table public.business_hour_intervals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  weekday smallint not null check (weekday between 0 and 6),
  open_minute smallint not null check (open_minute between 0 and 1439),
  close_minute smallint not null check (close_minute between 1 and 1440),
  sort_order smallint not null default 0 check (sort_order >= 0),
  constraint business_hour_intervals_order check (close_minute > open_minute)
);
create index business_hour_intervals_business_weekday_order_idx on public.business_hour_intervals (business_id, weekday, sort_order);

create table public.business_images (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  role text not null check (role in ('logo', 'cover')),
  storage_object_key text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  byte_size integer not null check (byte_size between 1 and 2097152),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  sha256 bytea not null check (octet_length(sha256) = 32),
  created_at timestamptz not null default now(),
  replaced_at timestamptz,
  is_current boolean not null default true
);
create unique index business_images_current_role_key on public.business_images (business_id, role) where is_current;

create table public.card_history (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete restrict,
  event_type text not null check (event_type in ('created', 'imported', 'assigned', 'reassigned', 'activated', 'deactivated', 'unassigned')),
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  occurred_at timestamptz not null default now(),
  old_status text check (old_status is null or old_status in ('inactive', 'active')),
  new_status text check (new_status is null or new_status in ('inactive', 'active')),
  old_business_id uuid references public.businesses(id) on delete restrict,
  new_business_id uuid references public.businesses(id) on delete restrict,
  mutation_id uuid not null unique
);
create index card_history_card_occurred_idx on public.card_history (card_id, occurred_at desc, id desc);

create table public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  event_type text not null,
  resource_type text,
  resource_id uuid,
  mutation_id uuid not null,
  request_id text,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object')
);
create index admin_audit_events_created_idx on public.admin_audit_events (created_at);
create index admin_audit_events_resource_created_idx on public.admin_audit_events (resource_type, resource_id, created_at);
