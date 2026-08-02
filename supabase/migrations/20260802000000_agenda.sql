-- Agenda de compromissos (modelo Google: horário ou dia inteiro, cor,
-- repetição simples, lembrete só anotado por enquanto — sem push ainda).
-- date/time puros (sem timezone) de propósito: evita reintroduzir o bug de
-- fuso já corrigido em src/lib/data.ts (hoje()/dataLocalDe()).
create table public.agenda_eventos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  titulo text not null,
  descricao text,
  local text,
  dia_inteiro boolean not null default false,
  data date not null,
  data_fim date,
  hora_inicio time,
  hora_fim time,
  cor text not null default 'blueberry'
    check (cor in ('tomato','flamingo','tangerine','banana','sage','basil',
                    'peacock','blueberry','lavender','grape','graphite')),
  recorrencia text not null default 'nenhuma'
    check (recorrencia in ('nenhuma','diaria','semanal','mensal','anual')),
  recorrencia_fim date,
  lembrete_minutos integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index agenda_eventos_user_data_idx on public.agenda_eventos (user_id, data);

alter table public.agenda_eventos enable row level security;
create policy "agenda_eventos_own_rows" on public.agenda_eventos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
