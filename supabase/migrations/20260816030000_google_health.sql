-- Integração Google Health (ex-Fitbit Web API): tokens OAuth, status de
-- conexão (exposto ao cliente, sem dados sensíveis) e dados sincronizados
-- (passos, frequência cardíaca de repouso, sono).

-- Tokens ficam totalmente fora do alcance do cliente — só o service role
-- (usado pelas Edge Functions) lê/escreve aqui. RLS habilitado sem nenhuma
-- policy pra authenticated/anon = acesso negado por padrão.
create table public.google_health_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expira_em timestamptz not null,
  escopo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.google_health_tokens enable row level security;

-- Status "público" (sem segredos) — o app usa isso pra mostrar
-- "Conectado ✓" / "Reconectar" sem nunca expor o token em si.
create table public.google_health_status (
  user_id uuid primary key references auth.users(id) on delete cascade,
  conectado boolean not null default false,
  expira_em timestamptz,
  ultima_sincronizacao timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.google_health_status enable row level security;
create policy "google_health_status_select_own" on public.google_health_status
  for select using (user_id = auth.uid());

-- Dados sincronizados por dia. `bruto` guarda a resposta crua da API como
-- rede de segurança, caso algum campo específico mude de nome no futuro.
create table public.google_health_dados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data date not null,
  passos integer,
  frequencia_repouso integer,
  sono_minutos integer,
  sono_fases jsonb,
  bruto jsonb,
  sincronizado_em timestamptz not null default now(),
  unique (user_id, data)
);
alter table public.google_health_dados enable row level security;
create policy "google_health_dados_own_rows" on public.google_health_dados
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create index google_health_dados_user_id_data_idx on public.google_health_dados (user_id, data);
