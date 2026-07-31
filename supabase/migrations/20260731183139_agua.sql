-- Registro de consumo de água ao longo do dia (vários lançamentos por dia).
create table public.agua_registros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  quantidade_ml int not null check (quantidade_ml > 0),
  registrado_em timestamptz not null default now()
);
create index agua_registros_user_id_idx on public.agua_registros (user_id, registrado_em);

alter table public.agua_registros enable row level security;
create policy "agua_registros_own_rows" on public.agua_registros
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
