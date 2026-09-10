-- Nível de dificuldade da palavra — usado pro Jogo de Cards sortear com peso
-- (vermelho aparece mais, verde aparece menos). Sem valor ainda = "amarelo"
-- (peso neutro), pra não penalizar nem favorecer palavra ainda não avaliada.
alter table public.vocabulario
  add column dificuldade text not null default 'amarelo'
    check (dificuldade in ('verde', 'amarelo', 'vermelho'));
