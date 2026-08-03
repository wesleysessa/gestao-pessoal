-- "Aniversário": atalho que fixa dia inteiro + repetição anual + cor rosa,
-- e vira 🎂 no calendário em vez de bolinha comum.
-- "Destaque": evento fica no topo da lista do dia, independente do horário
-- (lista de prioridade manual — trocar horário/cor já ajuda, isso reforça).
alter table public.agenda_eventos
  add column aniversario boolean not null default false,
  add column destaque boolean not null default false;
