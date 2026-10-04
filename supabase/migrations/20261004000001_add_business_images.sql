create table if not exists public.business_images (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  role text not null check (role in ('logo', 'cover')),
  object_key text not null,
  content_type text not null,
  byte_size integer not null,
  content_revision bigint not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint business_images_byte_size_positive check (byte_size > 0 and byte_size <= 2097152),
  constraint business_images_content_type_allowed check (content_type in ('image/jpeg', 'image/png', 'image/webp')),
  constraint business_images_content_revision_positive check (content_revision > 0)
);

create unique index if not exists business_images_one_active_role
  on public.business_images (business_id, role)
  where active;
