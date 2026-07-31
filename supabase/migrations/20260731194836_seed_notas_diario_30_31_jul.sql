-- Ajuste pontual pedido pelo usuário: nota 4.5 nas entradas de 30/07 e
-- 31/07/2026 (criadas antes de existir o campo nota de meia-estrela).
update public.diario set nota = 4.5 where data in ('2026-07-30', '2026-07-31');
