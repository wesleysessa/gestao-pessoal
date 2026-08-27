-- "Escopo" da prioridade: pessoal ou profissional, mesmo conceito já usado
-- na Agenda (sem sincronizar com o Home & Tech aqui — é só categoria/filtro
-- dentro do Gestão Pessoal). Backfill: tudo que já existe vira profissional
-- por padrão (pedido explícito do dono); ele reclassifica manualmente o que
-- for pessoal.
alter table public.prioridades
  add column escopo text not null default 'profissional' check (escopo in ('pessoal', 'profissional'));
