-- Evento da Agenda criado a partir de um cartão do Kanban. Excluir o
-- cartão não apaga o compromisso — só desfaz o vínculo.
alter table public.agenda_eventos
  add column kanban_cartao_id uuid references public.kanban_cartoes (id) on delete set null;
create index agenda_eventos_kanban_cartao_id_idx on public.agenda_eventos (kanban_cartao_id)
  where kanban_cartao_id is not null;
