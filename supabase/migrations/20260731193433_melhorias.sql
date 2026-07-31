-- Backlog pessoal de melhorias/ideias para o próprio app.
create table public.melhorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo text not null,
  descricao text,
  status text not null default 'sugerido' check (status in ('sugerido', 'em_funcionamento')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index melhorias_user_id_idx on public.melhorias (user_id);

alter table public.melhorias enable row level security;
create policy "melhorias_own_rows" on public.melhorias
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
