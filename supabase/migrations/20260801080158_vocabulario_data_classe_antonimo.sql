-- Vocabulário passa a ter data própria (independente de created_at, pra
-- não sofrer o mesmo problema de fuso — o cliente passa a data local
-- explicitamente ao criar), além de classe gramatical e antônimo.
alter table public.vocabulario add column data date;
update public.vocabulario set data = created_at::date where data is null;
alter table public.vocabulario alter column data set not null;
alter table public.vocabulario alter column data set default current_date;
create index vocabulario_user_id_data_idx on public.vocabulario (user_id, data);

alter table public.vocabulario
  add column classe_gramatical text check (classe_gramatical in ('adjetivo', 'substantivo', 'verbo')),
  add column antonimo text;
