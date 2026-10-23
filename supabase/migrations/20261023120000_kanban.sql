-- Quadro Kanban pessoal: cada cartão vive numa coluna (etapa) e tem uma
-- ordem manual dentro dela. As colunas são fixas por enquanto (lista do
-- CHECK abaixo); se um dia virarem configuráveis, isto vira uma tabela.
create table public.kanban_cartoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo text not null,
  descricao text,
  coluna text not null default 'backlog'
    check (coluna in ('backlog', 'a_fazer', 'em_processamento', 'aguardando_aprovacao', 'revisao', 'concluido')),
  ordem integer not null default 0,
  prioridade text not null default 'media' check (prioridade in ('baixa', 'media', 'alta')),
  prazo date,
  escopo text not null default 'pessoal' check (escopo in ('pessoal', 'profissional')),
  -- quando entrou na coluna atual — mostra "parado há X dias"
  movido_em timestamptz not null default now(),
  concluido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index kanban_cartoes_user_coluna_idx on public.kanban_cartoes (user_id, coluna, ordem);

alter table public.kanban_cartoes enable row level security;
create policy "kanban_cartoes_own_rows" on public.kanban_cartoes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Na Home, o card Kanban ocupa o lugar que o card Melhorias tinha (Melhorias
-- continua acessível pelo rodapé e pelo menu).
update public.modulos_home set rota = '/kanban' where rota = '/melhorias';
