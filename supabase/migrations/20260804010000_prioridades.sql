-- "Lista de Prioridades": acompanhamento de médio/longo prazo, sem data —
-- diferente do Radar da Agenda (que é sempre um compromisso datado). Cor
-- indica o grau de prioridade (vermelho/amarelo/verde), inspirado no Trello
-- que o usuário já usa.
create table public.prioridades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo text not null,
  descricao text,
  cor text not null default 'amarelo' check (cor in ('vermelho', 'amarelo', 'verde')),
  concluida boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index prioridades_user_id_idx on public.prioridades (user_id);

alter table public.prioridades enable row level security;
create policy "prioridades_own_rows" on public.prioridades
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
