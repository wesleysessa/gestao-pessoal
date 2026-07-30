-- Vocabulário, Diário, Livros e Saúde (check-ins) — módulos de acompanhamento
-- pessoal. Cada tabela é isolada por usuário via RLS (user_id = auth.uid()).

create table public.vocabulario (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  termo text not null,
  idioma text not null default 'Geral',
  traducao text not null,
  exemplo text,
  created_at timestamptz not null default now()
);
create index vocabulario_user_id_idx on public.vocabulario (user_id);

alter table public.vocabulario enable row level security;
create policy "vocabulario_own_rows" on public.vocabulario
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.diario (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data date not null default current_date,
  titulo text,
  texto text not null,
  created_at timestamptz not null default now()
);
create index diario_user_id_idx on public.diario (user_id);

alter table public.diario enable row level security;
create policy "diario_own_rows" on public.diario
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.livros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo text not null,
  autor text,
  nota smallint not null default 0 check (nota between 0 and 5),
  comentario text,
  data date not null default current_date,
  created_at timestamptz not null default now()
);
create index livros_user_id_idx on public.livros (user_id);

alter table public.livros enable row level security;
create policy "livros_own_rows" on public.livros
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.saude_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data date not null default current_date,
  humor smallint not null check (humor between 1 and 5),
  energia smallint check (energia between 1 and 5),
  sono numeric(3, 1),
  obs text,
  created_at timestamptz not null default now(),
  unique (user_id, data)
);
create index saude_checkins_user_id_idx on public.saude_checkins (user_id);

alter table public.saude_checkins enable row level security;
create policy "saude_checkins_own_rows" on public.saude_checkins
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
