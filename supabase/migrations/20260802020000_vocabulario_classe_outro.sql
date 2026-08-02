-- Adiciona "Outro" como opção de Classe Gramatical.
alter table public.vocabulario drop constraint vocabulario_classe_gramatical_check;
alter table public.vocabulario add constraint vocabulario_classe_gramatical_check
  check (classe_gramatical in ('adjetivo', 'substantivo', 'verbo', 'outro'));
