-- Warehouse Ledger schema
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nicknames text[] not null default '{}',
  category text not null default 'Other',
  created_at timestamptz not null default now()
);

create table if not exists shopping_list (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  status text not null default 'planned' check (status in ('planned', 'purchased')),
  added_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists price_history (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  date date not null,
  price numeric(10,2) not null,
  qty numeric(10,2) not null default 1,
  receipt_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_price_history_item on price_history(item_id);
create index if not exists idx_shopping_list_item on shopping_list(item_id);
create index if not exists idx_shopping_list_status on shopping_list(status);

-- Row Level Security: open read/write since this app has no login
-- and the anon key is only ever used by you and your partner via a private URL.
alter table items enable row level security;
alter table shopping_list enable row level security;
alter table price_history enable row level security;

create policy "public read items" on items for select using (true);
create policy "public write items" on items for insert with check (true);
create policy "public update items" on items for update using (true);
create policy "public delete items" on items for delete using (true);

create policy "public read shopping_list" on shopping_list for select using (true);
create policy "public write shopping_list" on shopping_list for insert with check (true);
create policy "public update shopping_list" on shopping_list for update using (true);
create policy "public delete shopping_list" on shopping_list for delete using (true);

create policy "public read price_history" on price_history for select using (true);
create policy "public write price_history" on price_history for insert with check (true);
create policy "public update price_history" on price_history for update using (true);
create policy "public delete price_history" on price_history for delete using (true);
