-- NexTap Wave B: maintenance helpers and operational indexes.
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger admin_memberships_set_updated_at before update on public.admin_memberships
for each row execute function public.set_updated_at();
create trigger businesses_set_updated_at before update on public.businesses
for each row execute function public.set_updated_at();
create trigger cards_set_updated_at before update on public.cards
for each row execute function public.set_updated_at();
create trigger business_sections_set_updated_at before update on public.business_sections
for each row execute function public.set_updated_at();
create trigger business_links_set_updated_at before update on public.business_links
for each row execute function public.set_updated_at();
create trigger business_hours_set_updated_at before update on public.business_hours
for each row execute function public.set_updated_at();

create or replace function public.maintenance_expired_idempotency(p_limit integer default 1000)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare removed integer;
begin
  delete from public.idempotency_records
   where id in (
     select id from public.idempotency_records
      where expires_at <= now() and state <> 'processing'
      order by expires_at, id limit greatest(p_limit, 0)
   );
  get diagnostics removed = row_count;
  return removed;
end;
$$;

create or replace function public.maintenance_expired_staging(p_limit integer default 1000)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare removed integer;
begin
  update public.temporary_objects
     set validation_state = 'expired'
   where id in (
     select id from public.temporary_objects
      where expires_at <= now() and consumed_at is null
      order by expires_at, id limit greatest(p_limit, 0)
   );
  delete from public.import_previews
   where id in (
     select id from public.import_previews
      where expires_at <= now() order by expires_at, id limit greatest(p_limit, 0)
   );
  get diagnostics removed = row_count;
  return removed;
end;
$$;

create or replace function public.maintenance_due_image_cleanup(p_limit integer default 1000)
returns table (candidate_id uuid, storage_object_key text, former_image_id uuid)
language sql
security invoker
set search_path = public
as $$
  select c.id, c.storage_object_key, c.former_image_id
    from image_cleanup_candidates c
   where c.completed_at is null and c.cleanup_due_at <= now()
     and not exists (
       select 1 from business_images i
        where i.storage_object_key = c.storage_object_key and i.is_current
     )
   order by c.cleanup_due_at, c.id
   limit greatest(p_limit, 0);
$$;

create index business_slug_aliases_business_idx on public.business_slug_aliases (business_id);
create index business_images_object_key_idx on public.business_images (storage_object_key);
create index temporary_objects_business_role_idx on public.temporary_objects (business_id, role);
create index import_previews_actor_created_idx on public.import_previews (actor_user_id, created_at desc);
create index idempotency_records_actor_scope_idx on public.idempotency_records (actor_user_id, scope, key_digest);
create index card_history_mutation_idx on public.card_history (mutation_id);

revoke all on function public.maintenance_expired_idempotency(integer) from public;
revoke all on function public.maintenance_expired_staging(integer) from public;
revoke all on function public.maintenance_due_image_cleanup(integer) from public;
