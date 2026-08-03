-- "Check Academia": 1 marcação por dia (toggle), usada pra contar quantos
-- dias da semana (segunda a domingo) a pessoa foi à academia.
create table public.academia_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data date not null,
  created_at timestamptz not null default now(),
  unique (user_id, data)
);
create index academia_checkins_user_id_idx on public.academia_checkins (user_id, data);

alter table public.academia_checkins enable row level security;
create policy "academia_checkins_own_rows" on public.academia_checkins
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
