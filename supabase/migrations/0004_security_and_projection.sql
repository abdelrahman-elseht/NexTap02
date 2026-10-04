-- NexTap Wave B: append-only protections, cross-row invariants and public projection.
create or replace function public.reject_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'append-only relation';
end;
$$;
create trigger business_slug_aliases_append_only before update or delete on public.business_slug_aliases
for each row execute function public.reject_mutation();

create trigger card_history_append_only before update or delete on public.card_history
for each row execute function public.reject_mutation();

create or replace function public.check_hour_overlap() returns trigger
language plpgsql as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.business_id::text, 1));
  if exists (
    select 1 from public.business_hour_intervals h
    where h.business_id = new.business_id and h.weekday = new.weekday and h.id <> new.id
      and new.open_minute < h.close_minute and h.open_minute < new.close_minute
  ) then
    raise exception 'overlapping business hour interval';
  end if;
  return new;
end;
$$;
create constraint trigger business_hour_intervals_no_overlap
after insert or update on public.business_hour_intervals
deferrable initially deferred for each row execute function public.check_hour_overlap();

create or replace function public.check_link_section_type() returns trigger
language plpgsql as $$
declare section_kind text;
begin
  select section_type into section_kind from public.business_sections where id = new.section_id and business_id = new.business_id;
  if section_kind not in ('social', 'payments', 'custom_links') then
    raise exception 'links require a link-bearing section';
  end if;
  if section_kind = 'social' and new.link_type not in ('instagram', 'facebook', 'tiktok', 'youtube', 'snapchat', 'linkedin', 'x') then
    raise exception 'unsupported social link type';
  end if;
  if section_kind = 'payments' and new.link_type not in ('payment', 'instapay', 'vodafone_cash', 'paypal', 'stripe') then
    raise exception 'unsupported payment link type';
  end if;
  if section_kind = 'custom_links' and new.link_type <> 'custom' then
    raise exception 'unsupported custom link type';
  end if;
  return new;
end;
$$;
create trigger business_links_section_type_guard
before insert or update on public.business_links
for each row execute function public.check_link_section_type();

create or replace function public.check_business_link_limit() returns trigger
language plpgsql as $$
begin
  if (select count(*) from public.business_links where business_id = new.business_id and id <> new.id) >= 50 then
    raise exception 'business link limit exceeded';
  end if;
  return new;
end;
$$;
create constraint trigger business_links_limit_guard
after insert or update on public.business_links
deferrable initially deferred for each row execute function public.check_business_link_limit();

create or replace function public.check_business_hours_timezone() returns trigger
language plpgsql as $$
begin
  if not exists (select 1 from public.businesses b where b.id = new.business_id and b.timezone = new.timezone) then
    raise exception 'business hours timezone must match business timezone';
  end if;
  return new;
end;
$$;
create trigger business_hours_timezone_guard
before insert or update on public.business_hours
for each row execute function public.check_business_hours_timezone();

create or replace function public.public_business_projection(p_business_id uuid)
returns table (
  business_id uuid,
  name text,
  description text,
  phone text,
  whatsapp text,
  email text,
  address text,
  map_url text,
  directions_url text,
  google_reviews_url text,
  timezone text,
  content_revision bigint,
  sections jsonb,
  hours jsonb,
  images jsonb
)
language sql
stable
security invoker
set search_path = public
as $$
  select b.id, b.name, b.description, b.phone, b.whatsapp, b.email, b.address,
         b.map_url, b.directions_url, b.google_reviews_url, b.timezone, b.content_revision,
         coalesce((select jsonb_agg(jsonb_build_object(
           'type', s.section_type, 'enabled', s.is_enabled, 'sortOrder', s.sort_order,
           'settings', s.settings,
           'links', coalesce((select jsonb_agg(jsonb_build_object(
             'type', l.link_type, 'label', l.label, 'url', l.url, 'icon', l.icon_key,
             'sortOrder', l.sort_order) order by l.sort_order, l.id)
             from public.business_links l where l.section_id = s.id and l.is_active), '[]'::jsonb)
         ) order by s.sort_order, s.id) from public.business_sections s
           where s.business_id = b.id and s.is_enabled), '[]'::jsonb),
         coalesce((select jsonb_agg(jsonb_build_object(
           'weekday', h.weekday, 'open', h.open_minute, 'close', h.close_minute)
           order by h.weekday, h.sort_order, h.id)
           from public.business_hour_intervals h where h.business_id = b.id), '[]'::jsonb),
         coalesce((select jsonb_agg(jsonb_build_object('role', i.role, 'id', i.id))
           from public.business_images i where i.business_id = b.id and i.is_current), '[]'::jsonb)
  from public.businesses b
  where b.id = p_business_id and b.status = 'enabled';
$$;
