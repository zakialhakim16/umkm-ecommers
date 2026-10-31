begin;

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('customer','seller_owner','seller_staff','driver','platform_admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);
alter table public.user_roles enable row level security;
revoke all on public.user_roles from public, anon;
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
drop policy if exists "Users read own roles" on public.user_roles;
create policy "Users read own roles" on public.user_roles for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.has_app_role(p_role text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.user_roles where user_id = auth.uid() and role = p_role);
$$;
revoke all on function public.has_app_role(text) from public, anon;
grant execute on function public.has_app_role(text) to authenticated;

create or replace function public.bootstrap_customer_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.user_roles(user_id,role) values(new.id,'customer') on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists bootstrap_customer_role_trigger on auth.users;
create trigger bootstrap_customer_role_trigger after insert on auth.users for each row execute function public.bootstrap_customer_role();

insert into public.user_roles(user_id,role) select id,'customer' from auth.users on conflict do nothing;
insert into public.user_roles(user_id,role) select id,'seller_owner' from public.stores on conflict do nothing;
insert into public.user_roles(user_id,role) select user_id,'driver' from public.delivery_drivers on conflict do nothing;
insert into public.user_roles(user_id,role) select user_id,'platform_admin' from public.marketplace_admins where active on conflict do nothing;

create table if not exists public.store_memberships (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','manager','staff')),
  status text not null default 'active' check (status in ('invited','active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (store_id,user_id)
);
alter table public.store_memberships enable row level security;
revoke all on public.store_memberships from public, anon;
grant select on public.store_memberships to authenticated;
grant all on public.store_memberships to service_role;
create or replace function public.is_store_member(p_store_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.store_memberships where store_id=p_store_id and user_id=auth.uid() and status='active');
$$;
revoke all on function public.is_store_member(uuid) from public, anon;
grant execute on function public.is_store_member(uuid) to authenticated;
drop policy if exists "Members read store team" on public.store_memberships;
create policy "Members read store team" on public.store_memberships for select to authenticated using (
  user_id = (select auth.uid()) or public.is_store_member(store_id)
);
insert into public.store_memberships(store_id,user_id,role,status) select id,id,'owner','active' from public.stores on conflict do nothing;

create table if not exists public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null,
  actor_id uuid references auth.users(id) on delete set null,
  actor_role text,
  from_status text,
  to_status text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists order_events_order_created_idx on public.order_events(order_id,created_at);
alter table public.order_events enable row level security;
revoke all on public.order_events from public, anon, authenticated;
grant select on public.order_events to authenticated;
grant all on public.order_events to service_role;
drop policy if exists "Order participants read timeline" on public.order_events;
create policy "Order participants read timeline" on public.order_events for select to authenticated using (
  exists(select 1 from public.orders o where o.id=order_id and (o.buyer_id=(select auth.uid()) or o.store_id=(select auth.uid()) or o.driver_id=(select auth.uid())))
  or public.is_marketplace_admin()
);

create table if not exists public.platform_outbox (
  id bigint generated always as identity primary key,
  topic text not null,
  aggregate_id uuid not null,
  payload jsonb not null,
  idempotency_key text not null unique,
  status text not null default 'pending' check(status in ('pending','processing','sent','failed')),
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists platform_outbox_pending_idx on public.platform_outbox(status,available_at) where status in ('pending','failed');
alter table public.platform_outbox enable row level security;
revoke all on public.platform_outbox from public, anon, authenticated;
grant all on public.platform_outbox to service_role;

create or replace function public.capture_order_event()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_event_id bigint; v_type text;
begin
  if tg_op='INSERT' then v_type:='order_created';
  elsif new.status is distinct from old.status then v_type:='order_status_changed';
  elsif new.payment_status is distinct from old.payment_status then v_type:='payment_status_changed';
  else return new;
  end if;
  insert into public.order_events(order_id,event_type,actor_id,actor_role,from_status,to_status,payload)
  values(new.id,v_type,auth.uid(),coalesce(auth.jwt()->>'user_role','system'),case when tg_op='UPDATE' then old.status end,new.status,
    jsonb_build_object('payment_status',new.payment_status,'driver_id',new.driver_id)) returning id into v_event_id;
  insert into public.platform_outbox(topic,aggregate_id,payload,idempotency_key)
  values('order.event',new.id,jsonb_build_object('event_id',v_event_id,'event_type',v_type,'order_id',new.id),concat('order-event:',v_event_id)) on conflict do nothing;
  return new;
end;
$$;
revoke all on function public.capture_order_event() from public, anon, authenticated;
drop trigger if exists capture_order_event_trigger on public.orders;
create trigger capture_order_event_trigger after insert or update of status,payment_status,driver_id on public.orders for each row execute function public.capture_order_event();

commit;
