-- "Radar": evento fica destacado no grupo fixo do Quadro da Semana, além de
-- continuar aparecendo no dia dele normalmente.
alter table public.agenda_eventos add column radar boolean not null default false;
