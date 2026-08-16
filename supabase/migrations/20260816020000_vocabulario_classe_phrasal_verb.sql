-- Adiciona "Phrasal Verbs" como opção de Classe Gramatical — usada pelo
-- quadro dedicado de Phrasal Verbs dentro de Vocabulário (mesma tabela,
-- só filtrada por classe_gramatical = 'phrasal_verb').
alter table public.vocabulario drop constraint vocabulario_classe_gramatical_check;
alter table public.vocabulario add constraint vocabulario_classe_gramatical_check
  check (classe_gramatical in ('adjetivo', 'substantivo', 'verbo', 'outro', 'phrasal_verb'));
