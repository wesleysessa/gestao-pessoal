-- Permite meia-estrela (0.5 em 0.5) nas notas do Diário e de Livros.
alter table public.diario
  alter column nota type numeric(2, 1) using nota::numeric(2, 1);
alter table public.diario
  add constraint diario_nota_meia_estrela check (nota is null or mod(nota * 2, 1) = 0);

alter table public.livros
  alter column nota type numeric(2, 1) using nota::numeric(2, 1);
alter table public.livros
  add constraint livros_nota_meia_estrela check (mod(nota * 2, 1) = 0);
