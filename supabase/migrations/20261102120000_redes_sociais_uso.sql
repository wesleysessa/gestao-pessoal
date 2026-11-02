-- Tempo de uso de rede social por dia (lançado à mão, copiado do Bem-estar
-- digital / Tempo de Uso do celular — o Instagram não expõe esse dado por
-- API). Um registro por rede por dia; lançar de novo o mesmo dia substitui.
create table public.redes_uso (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  rede text not null default 'instagram',
  data date not null,
  minutos integer not null check (minutos >= 0 and minutos <= 1440),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, rede, data)
);

alter table public.redes_uso enable row level security;
create policy "redes_uso_own_rows" on public.redes_uso
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Limite diário com histórico (mesmo padrão de agua_metas): mudar o limite
-- vale a partir do dia da mudança, dias anteriores mantêm o limite antigo.
create table public.redes_metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  rede text not null default 'instagram',
  minutos integer not null check (minutos > 0 and minutos <= 1440),
  vigente_desde date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, rede, vigente_desde)
);

alter table public.redes_metas enable row level security;
create policy "redes_metas_own_rows" on public.redes_metas
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Limite inicial pedido pelo dono: 15 min/dia no Instagram (um dia antes de
-- hoje em UTC, pra já valer no dia local de hoje).
insert into public.redes_metas (user_id, rede, minutos, vigente_desde)
select id, 'instagram', 15, current_date - 1 from auth.users;
