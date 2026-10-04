-- NexTap additive hardening: narrow direct table access and restrict public fields.
-- Apply only after reviewing the actual migration history; this does not rewrite prior migrations.

revoke all on table public.businesses from authenticated;
revoke all on table public.cards from authenticated;
revoke all on table public.business_slugs from authenticated;
revoke all on table public.business_slug_aliases from authenticated;
revoke all on table public.business_sections from authenticated;
revoke all on table public.business_links from authenticated;
revoke all on table public.business_hours from authenticated;
revoke all on table public.business_hour_intervals from authenticated;
revoke all on table public.business_images from authenticated;
revoke all on table public.card_history from authenticated;
revoke all on table public.admin_audit_events from authenticated;
revoke all on table public.idempotency_records from authenticated;
revoke all on table public.import_previews from authenticated;
revoke all on table public.temporary_objects from authenticated;
revoke all on table public.image_cleanup_candidates from authenticated;

-- Retire the earlier broad projection and route functions: their signatures expose
-- internal Business identity to public callers.
revoke all on function public.public_business_projection(uuid) from public;
revoke all on function public.public_business_by_slug(text) from public;

create or replace function public.public_business_public_projection(p_business_id uuid)
returns table (
  name text, description text, phone text, whatsapp text, email text,
  address text, map_url text, directions_url text, google_reviews_url text,
  timezone text, content_revision bigint, sections jsonb, hours jsonb, images jsonb
)
language sql stable security definer
set search_path = public
as $$
  select b.name, b.description,
         case when exists (select 1 from business_sections s where s.business_id = b.id and s.section_type = 'contact' and s.is_enabled) then b.phone end,
         case when exists (select 1 from business_sections s where s.business_id = b.id and s.section_type = 'contact' and s.is_enabled) then b.whatsapp end,
         case when exists (select 1 from business_sections s where s.business_id = b.id and s.section_type = 'contact' and s.is_enabled) then b.email end,
         case when exists (select 1 from business_sections s where s.business_id = b.id and s.section_type = 'location' and s.is_enabled) then b.address end,
         case when exists (select 1 from business_sections s where s.business_id = b.id and s.section_type = 'location' and s.is_enabled) then b.map_url end,
         case when exists (select 1 from business_sections s where s.business_id = b.id and s.section_type = 'location' and s.is_enabled) then b.directions_url end,
         case when exists (select 1 from business_sections s where s.business_id = b.id and s.section_type = 'reviews' and s.is_enabled) then b.google_reviews_url end,
         b.timezone, b.content_revision,
         coalesce((select jsonb_agg(jsonb_build_object(
           'type', s.section_type, 'enabled', s.is_enabled, 'sortOrder', s.sort_order,
           'settings', s.settings,
           'links', coalesce((select jsonb_agg(jsonb_build_object(
             'type', l.link_type, 'label', l.label, 'url', l.url, 'icon', l.icon_key,
             'sortOrder', l.sort_order) order by l.sort_order, l.id)
             from business_links l where l.section_id = s.id and l.is_active), '[]'::jsonb)
         ) order by s.sort_order, s.id) from business_sections s
           where s.business_id = b.id and s.is_enabled), '[]'::jsonb),
         case when exists (select 1 from business_sections s where s.business_id = b.id and s.section_type = 'hours' and s.is_enabled)
           then coalesce((select jsonb_agg(jsonb_build_object(
             'weekday', h.weekday, 'open', h.open_minute, 'close', h.close_minute)
             order by h.weekday, h.sort_order, h.id)
             from business_hour_intervals h where h.business_id = b.id), '[]'::jsonb)
           else '[]'::jsonb end,
         coalesce((select jsonb_agg(jsonb_build_object('role', i.role, 'id', i.id))
           from business_images i where i.business_id = b.id and i.is_current), '[]'::jsonb)
  from businesses b where b.id = p_business_id and b.status = 'enabled';
$$;

create or replace function public.public_business_route_by_slug(p_slug text)
returns table (current_slug text, is_redirect boolean)
language sql stable security definer
set search_path = public
as $$
  with registry(slug, business_id, is_current) as (
    select s.slug, s.business_id, s.is_current from business_slugs s
    union all
    select a.alias, a.business_id, false from business_slug_aliases a
  )
  select (select c.slug from business_slugs c where c.business_id = r.business_id and c.is_current), not r.is_current
  from registry r join businesses b on b.id = r.business_id
  where r.slug = p_slug and b.status = 'enabled';
$$;

revoke all on function public.public_business_public_projection(uuid) from public;
revoke all on function public.public_business_route_by_slug(text) from public;
grant execute on function public.public_business_public_projection(uuid) to anon, authenticated;
grant execute on function public.public_business_route_by_slug(text) to anon, authenticated;
