-- Ordem manual dentro de cada cor (grupo) — "quem ataco primeiro".
alter table public.prioridades add column ordem integer not null default 0;
