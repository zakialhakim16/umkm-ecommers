-- Consumer order controls: safe cancellation, reorder, delivery preferences and verified reviews.

alter table public.orders
  add column if not exists delivery_note text not null default '',
  add column if not exists contactless_delivery boolean not null default false,
  add column if not exists include_cutlery boolean not null default false,
  add column if not exists cancelled_by uuid references auth.users(id) on delete set null,
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_at timestamptz;

create table if not exists public.order_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  driver_id uuid references auth.users(id) on delete set null,
  food_rating smallint not null check (food_rating between 1 and 5),
  delivery_rating smallint check (delivery_rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 500),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists order_reviews_store_created_idx
  on public.order_reviews (store_id, created_at desc);

alter table public.order_reviews enable row level security;

drop policy if exists "Participants read order reviews" on public.order_reviews;
create policy "Participants read order reviews" on public.order_reviews for select
using (
  buyer_id = (select auth.uid())
  or store_id = (select auth.uid())
  or driver_id = (select auth.uid())
);

grant select on public.order_reviews to authenticated;

create or replace function public.cancel_buyer_order(p_order_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.buyer_id <> auth.uid() then
    raise exception 'Pesanan tidak ditemukan.';
  end if;
  if v_order.status not in ('pending_payment', 'confirmed', 'pending') then
    raise exception 'Pesanan yang sudah diproses merchant tidak dapat dibatalkan dari aplikasi.';
  end if;
  if v_order.payment_status = 'success' and v_order.payment_method <> 'cod' then
    raise exception 'Pembayaran sudah berhasil. Hubungi bantuan untuk proses pengembalian dana.';
  end if;
  if char_length(trim(coalesce(p_reason, ''))) < 3 then
    raise exception 'Pilih atau tulis alasan pembatalan.';
  end if;

  update public.orders
  set status = 'cancelled', cancelled_by = auth.uid(),
      cancellation_reason = left(trim(p_reason), 240), cancelled_at = now(), updated_at = now()
  where id = p_order_id;
end;
$$;

create or replace function public.reorder_buyer_order(p_order_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not exists (select 1 from public.orders where id = p_order_id and buyer_id = auth.uid()) then
    raise exception 'Pesanan tidak ditemukan.';
  end if;

  insert into public.cart_items (user_id, product_id, variant, quantity, updated_at)
  select auth.uid(), item.product_id, item.variant, item.quantity, now()
  from public.order_items item
  join public.products product on product.id = item.product_id
  join public.stores store on store.id = product.store_id
  where item.order_id = p_order_id and product.is_available and store.is_open
  on conflict (user_id, product_id, variant) do update
  set quantity = public.cart_items.quantity + excluded.quantity, updated_at = now();

  get diagnostics v_count = row_count;
  if v_count = 0 then
    raise exception 'Menu dari pesanan ini sedang tidak tersedia.';
  end if;
  return v_count;
end;
$$;

create or replace function public.submit_order_review(
  p_order_id uuid,
  p_food_rating integer,
  p_delivery_rating integer default null,
  p_comment text default '',
  p_tags text[] default '{}'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id;
  if not found or v_order.buyer_id <> auth.uid() then
    raise exception 'Pesanan tidak ditemukan.';
  end if;
  if v_order.status not in ('delivered', 'completed') then
    raise exception 'Ulasan dapat diberikan setelah pesanan diterima.';
  end if;
  if p_food_rating not between 1 and 5
    or (p_delivery_rating is not null and p_delivery_rating not between 1 and 5) then
    raise exception 'Rating harus antara 1 sampai 5.';
  end if;

  insert into public.order_reviews (
    order_id, buyer_id, store_id, driver_id, food_rating, delivery_rating, comment, tags
  ) values (
    p_order_id, auth.uid(), v_order.store_id, v_order.driver_id, p_food_rating,
    p_delivery_rating, left(trim(coalesce(p_comment, '')), 500), coalesce(p_tags, '{}')
  )
  on conflict (order_id) do update
  set food_rating = excluded.food_rating,
      delivery_rating = excluded.delivery_rating,
      comment = excluded.comment,
      tags = excluded.tags,
      updated_at = now();
end;
$$;

revoke all on function public.cancel_buyer_order(uuid, text) from public, anon;
revoke all on function public.reorder_buyer_order(uuid) from public, anon;
revoke all on function public.submit_order_review(uuid, integer, integer, text, text[]) from public, anon;
grant execute on function public.cancel_buyer_order(uuid, text) to authenticated;
grant execute on function public.reorder_buyer_order(uuid) to authenticated;
grant execute on function public.submit_order_review(uuid, integer, integer, text, text[]) to authenticated;

