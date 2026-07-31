-- Nota de produtividade (1-5) por entrada do diário — termômetro do dia.
-- NULL é permitido (nem toda entrada precisa de nota).
alter table public.diario
  add column nota smallint check (nota between 1 and 5);
