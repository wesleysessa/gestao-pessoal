-- Banco de frases inspiradoras, usado pela "Frase do Dia" na Home.
create table public.frases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  texto text not null,
  autor text,
  created_at timestamptz not null default now()
);
create index frases_user_id_idx on public.frases (user_id);

alter table public.frases enable row level security;
create policy "frases_own_rows" on public.frases
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
