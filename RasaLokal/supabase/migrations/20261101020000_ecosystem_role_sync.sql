begin;

create or replace function public.sync_store_owner_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.user_roles(user_id,role) values(new.id,'seller_owner') on conflict do nothing;
  insert into public.store_memberships(store_id,user_id,role,status) values(new.id,new.id,'owner','active')
    on conflict(store_id,user_id) do update set role='owner',status='active',updated_at=now();
  return new;
end;
$$;
revoke all on function public.sync_store_owner_role() from public,anon,authenticated;
drop trigger if exists sync_store_owner_role_trigger on public.stores;
create trigger sync_store_owner_role_trigger after insert on public.stores for each row execute function public.sync_store_owner_role();

create or replace function public.sync_driver_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.user_roles(user_id,role) values(new.user_id,'driver') on conflict do nothing;
  return new;
end;
$$;
revoke all on function public.sync_driver_role() from public,anon,authenticated;
drop trigger if exists sync_driver_role_trigger on public.delivery_drivers;
create trigger sync_driver_role_trigger after insert on public.delivery_drivers for each row execute function public.sync_driver_role();

create or replace function public.sync_platform_admin_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.active then
    insert into public.user_roles(user_id,role) values(new.user_id,'platform_admin') on conflict do nothing;
  else
    delete from public.user_roles where user_id=new.user_id and role='platform_admin';
  end if;
  return new;
end;
$$;
revoke all on function public.sync_platform_admin_role() from public,anon,authenticated;
drop trigger if exists sync_platform_admin_role_trigger on public.marketplace_admins;
create trigger sync_platform_admin_role_trigger after insert or update of active on public.marketplace_admins for each row execute function public.sync_platform_admin_role();

commit;
