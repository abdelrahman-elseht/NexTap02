-- NexTap Wave B: retries, imports, upload intents and cleanup candidates.
create table public.idempotency_records (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  key_digest bytea not null check (octet_length(key_digest) > 0),
  request_digest bytea not null check (octet_length(request_digest) > 0),
  state text not null check (state in ('processing', 'committed', 'failed')),
  response_status smallint check (response_status between 100 and 599),
  response_body jsonb,
  resource_version bigint check (resource_version is null or resource_version > 0),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  completed_at timestamptz,
  unique (scope, actor_user_id, key_digest)
);
create index idempotency_records_expires_idx on public.idempotency_records (expires_at);
create unique index idempotency_actor_key_key on public.idempotency_records (actor_user_id, key_digest);

create table public.import_previews (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  file_sha256 bytea not null check (octet_length(file_sha256) = 32),
  parsed_rows jsonb not null check (jsonb_typeof(parsed_rows) = 'array'),
  validation_summary jsonb not null check (jsonb_typeof(validation_summary) = 'object'),
  row_count integer not null check (row_count between 0 and 10000),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index import_previews_expires_idx on public.import_previews (expires_at);

create table public.temporary_objects (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  business_id uuid not null references public.businesses(id) on delete restrict,
  role text not null check (role in ('logo', 'cover')),
  storage_object_key text not null unique,
  sha256 bytea not null check (octet_length(sha256) = 32),
  byte_size integer not null check (byte_size between 1 and 2097152),
  validation_state text not null check (validation_state in ('pending', 'validated', 'rejected', 'consumed', 'expired')),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint temporary_objects_consumption check ((validation_state = 'consumed') = (consumed_at is not null))
);
create index temporary_objects_expires_idx on public.temporary_objects (expires_at);

create table public.image_cleanup_candidates (
  id uuid primary key default gen_random_uuid(),
  storage_object_key text not null,
  former_image_id uuid references public.business_images(id) on delete restrict,
  eligible_at timestamptz not null default now(),
  cleanup_due_at timestamptz not null,
  completed_at timestamptz,
  retry_count integer not null default 0 check (retry_count >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  constraint image_cleanup_candidates_due check (cleanup_due_at >= eligible_at),
  constraint image_cleanup_candidates_completion check ((completed_at is null) or completed_at >= eligible_at)
);
create index image_cleanup_candidates_due_idx on public.image_cleanup_candidates (cleanup_due_at) where completed_at is null;
