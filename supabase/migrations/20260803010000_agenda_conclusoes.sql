-- Conclusão por OCORRÊNCIA (evento_id + data), não por evento — assim marcar
-- uma sessão de um evento recorrente (ex.: "Tênis" toda terça) não afeta as
-- demais semanas. Usado também pra montar a lista de "pendências" (eventos
-- passados sem conclusão, candidatos a reagendar).
create table public.agenda_conclusoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  evento_id uuid not null references public.agenda_eventos (id) on delete cascade,
  data date not null,
  created_at timestamptz not null default now(),
  unique (evento_id, data)
);
create index agenda_conclusoes_user_id_idx on public.agenda_conclusoes (user_id);

alter table public.agenda_conclusoes enable row level security;
create policy "agenda_conclusoes_own_rows" on public.agenda_conclusoes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
