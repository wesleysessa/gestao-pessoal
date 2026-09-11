-- Adiciona "bimestral" (a cada 2 meses) às opções de recorrência da Agenda.
alter table public.agenda_eventos drop constraint agenda_eventos_recorrencia_check;
alter table public.agenda_eventos add constraint agenda_eventos_recorrencia_check
  check (recorrencia in ('nenhuma', 'diaria', 'semanal', 'mensal', 'bimestral', 'anual'));
