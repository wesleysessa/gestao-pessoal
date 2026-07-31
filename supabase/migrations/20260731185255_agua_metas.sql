-- Meta diária de água, com vigência por data: cada linha vale a partir de
-- `vigente_desde` até a próxima meta cadastrada (ou até hoje, se for a mais
-- recente). Trocar a meta não reescreve o histórico — dias passados
-- continuam comparados contra a meta que estava valendo na época.
create table public.agua_metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  quantidade_ml int not null check (quantidade_ml > 0),
  vigente_desde date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, vigente_desde)
);
create index agua_metas_user_id_idx on public.agua_metas (user_id, vigente_desde);

alter table public.agua_metas enable row level security;
create policy "agua_metas_own_rows" on public.agua_metas
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
