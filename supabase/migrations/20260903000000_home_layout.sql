-- Ordem manual dos cards da Home — cada usuário pode reorganizar os módulos
-- (setas de mover, mesmo padrão de prioridades.ordem) sem precisar mudar
-- código. Uma linha por módulo (identificado pela rota); módulo novo que
-- ainda não tem linha aqui usa a ordem padrão definida no código.
create table public.modulos_home (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  rota text not null,
  posicao integer not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, rota)
);

alter table public.modulos_home enable row level security;
create policy "modulos_home_own_rows" on public.modulos_home
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
