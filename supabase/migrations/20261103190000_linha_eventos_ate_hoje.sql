-- Fato que começou e continua até hoje (ex.: Idade Contemporânea, 1789 → hoje).
-- Nesse caso ano_fim fica nulo e ate_hoje = true.
alter table public.linha_eventos
  add column ate_hoje boolean not null default false,
  add constraint linha_eventos_ate_hoje_check check (not ate_hoje or ano_fim is null);
