-- NexTap Wave B: least-privilege grants and identity-scoped RLS.
create or replace function public.public_business_projection(p_business_id uuid)
returns table (
  business_id uuid, name text, description text, phone text, whatsapp text, email text,
  address text, map_url text, directions_url text, google_reviews_url text,
  timezone text, content_revision bigint, sections jsonb, hours jsonb, images jsonb
)
language sql stable security definer
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
             from business_links l where l.section_id = s.id and l.is_active), '[]'::jsonb)
         ) order by s.sort_order, s.id) from business_sections s
           where s.business_id = b.id and s.is_enabled), '[]'::jsonb),
         coalesce((select jsonb_agg(jsonb_build_object(
           'weekday', h.weekday, 'open', h.open_minute, 'close', h.close_minute)
           order by h.weekday, h.sort_order, h.id)
           from business_hour_intervals h where h.business_id = b.id), '[]'::jsonb),
         coalesce((select jsonb_agg(jsonb_build_object('role', i.role, 'id', i.id))
           from business_images i where i.business_id = b.id and i.is_current), '[]'::jsonb)
  from businesses b where b.id = p_business_id and b.status = 'enabled';
$$;

create or replace function public.public_business_by_slug(p_slug text)
returns table (business_id uuid, current_slug text, is_redirect boolean)
language sql stable security definer
set search_path = public
as $$
  with registry(slug, business_id, is_current) as (
    select s.slug, s.business_id, s.is_current from business_slugs s
    union all
    select a.alias, a.business_id, false from business_slug_aliases a
  )
  select r.business_id,
         (select c.slug from business_slugs c where c.business_id = r.business_id and c.is_current),
         not r.is_current
  from registry r join businesses b on b.id = r.business_id
  where r.slug = p_slug and b.status = 'enabled';
$$;

revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;
revoke all on function public.public_business_projection(uuid) from public;
revoke all on function public.public_business_by_slug(text) from public;
grant execute on function public.public_business_projection(uuid) to anon, authenticated;
grant execute on function public.public_business_by_slug(text) to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

do $$
declare t text;
begin
  foreach t in array array['admin_memberships','businesses','cards','business_slugs','business_slug_aliases','business_sections','business_links','business_hours','business_hour_intervals','business_images','card_history','admin_audit_events','idempotency_records','import_previews','temporary_objects','image_cleanup_candidates'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

create policy admin_memberships_self_read on public.admin_memberships
  for select to authenticated using (user_id = auth.uid());

create policy businesses_admin_access on public.businesses
  for all to authenticated
  using (exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'))
  with check (exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'));
create policy cards_admin_access on public.cards
  for all to authenticated
  using (exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'))
  with check (exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'));
create policy business_slugs_admin_access on public.business_slugs
  for all to authenticated
  using (exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'))
  with check (exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'));
create policy business_slug_aliases_admin_access on public.business_slug_aliases
  for all to authenticated
  using (exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'))
  with check (exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'));
create policy business_sections_admin_access on public.business_sections
  for all to authenticated
  using (exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'))
  with check (exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'));
create policy business_links_admin_access on public.business_links
  for all to authenticated
  using (exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'))
  with check (exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'));
create policy business_hours_admin_access on public.business_hours
  for all to authenticated
  using (exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'))
  with check (exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'));
create policy business_hour_intervals_admin_access on public.business_hour_intervals
  for all to authenticated
  using (exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'))
  with check (exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'));
create policy business_images_admin_access on public.business_images
  for all to authenticated
  using (exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'))
  with check (exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'));
create policy card_history_admin_read on public.card_history
  for select to authenticated
  using (exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'));
create policy card_history_admin_append on public.card_history
  for insert to authenticated
  with check (actor_user_id = auth.uid() and exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'));
create policy audit_admin_read on public.admin_audit_events
  for select to authenticated
  using (exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'));
create policy audit_admin_append on public.admin_audit_events
  for insert to authenticated
  with check (actor_user_id = auth.uid() and exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'));
create policy idempotency_admin_access on public.idempotency_records
  for all to authenticated
  using (actor_user_id = auth.uid() and exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'))
  with check (actor_user_id = auth.uid() and exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'));
create policy import_preview_admin_access on public.import_previews
  for all to authenticated
  using (actor_user_id = auth.uid() and exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'))
  with check (actor_user_id = auth.uid() and exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'));
create policy temporary_objects_admin_access on public.temporary_objects
  for all to authenticated
  using (actor_user_id = auth.uid() and exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'))
  with check (actor_user_id = auth.uid() and exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'));
create policy cleanup_admin_read on public.image_cleanup_candidates
  for select to authenticated
  using (exists (select 1 from public.admin_memberships m where m.user_id = auth.uid() and m.status = 'active'));
