-- Fato com duração (ex.: Revolução Agrícola, 10000 a.C. → 1000 a.C.). Fim
-- opcional: nulo = fato pontual. Mesmo formato de "ano" (negativo = a.C.).
alter table public.linha_eventos
  add column ano_fim bigint,
  add column unidade_fim text check (unidade_fim in ('milhoes', 'mil', 'ac', 'dc')),
  add constraint linha_eventos_fim_depois_check check (ano_fim is null or ano_fim > ano);
