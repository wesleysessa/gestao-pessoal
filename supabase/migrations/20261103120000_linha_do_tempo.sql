-- Linha do Tempo: fatos históricos em ordem cronológica, desde a era dos
-- dinossauros até hoje. Datas guardadas como "ano astronômico" (negativo =
-- antes de Cristo; -66 milhões = era dos dinossauros), num bigint pra caber
-- milhões/bilhões de anos.

-- Fases/divisões (Pré-História, Idade Média, Era Mesozoica...). Podem ficar
-- umas dentro das outras (pai_id). Intervalo [inicio, fim): início nulo =
-- "desde sempre", fim nulo = "até hoje".
create table public.linha_periodos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null,
  pai_id uuid references public.linha_periodos (id) on delete set null,
  inicio bigint,
  fim bigint,
  cor text not null default 'slate',
  created_at timestamptz not null default now(),
  check (inicio is null or fim is null or inicio < fim)
);

alter table public.linha_periodos enable row level security;
create policy "linha_periodos_own_rows" on public.linha_periodos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Fatos. A fase de cada fato é deduzida pela data (a fase mais específica que
-- contém o ano), então não há vínculo fixo: criar uma fase nova já reorganiza
-- os fatos antigos.
create table public.linha_eventos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo text not null,
  descricao text,
  ano bigint not null,
  -- Como o fato foi lançado (milhões/mil anos atrás, a.C., d.C.), pra exibir
  -- do mesmo jeito que foi digitado.
  unidade text check (unidade in ('milhoes', 'mil', 'ac', 'dc')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.linha_eventos enable row level security;
create policy "linha_eventos_own_rows" on public.linha_eventos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create index linha_eventos_user_ano_idx on public.linha_eventos (user_id, ano);

-- As 5 grandes divisões da História já vêm criadas (editáveis/apagáveis).
insert into public.linha_periodos (user_id, nome, inicio, fim, cor)
select u.id, d.nome, d.inicio, d.fim, d.cor
from auth.users u
cross join (
  values
    ('Pré-História', null::bigint, -3500::bigint, 'amber'),
    ('Idade Antiga', -3500, 476, 'orange'),
    ('Idade Média', 476, 1453, 'emerald'),
    ('Idade Moderna', 1453, 1789, 'sky'),
    ('Idade Contemporânea', 1789, null, 'violet')
) as d (nome, inicio, fim, cor);
