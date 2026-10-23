-- Dono decidiu simplificar o fluxo: saem "Aguardando Aprovação" e "Revisão".
-- Por segurança, algum cartão que estivesse nelas volta pra Em Processamento.
update public.kanban_cartoes set coluna = 'em_processamento'
  where coluna in ('aguardando_aprovacao', 'revisao');
alter table public.kanban_cartoes drop constraint kanban_cartoes_coluna_check;
alter table public.kanban_cartoes add constraint kanban_cartoes_coluna_check
  check (coluna in ('backlog', 'a_fazer', 'em_processamento', 'concluido'));
