-- "O que aprendeu de novo hoje?" — campo opcional; quando preenchido, o
-- card do Diário exibe uma estrela de prêmio.
alter table public.diario add column aprendizado text;
