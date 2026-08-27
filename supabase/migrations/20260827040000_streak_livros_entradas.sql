-- Livros passa a contar pra chama tanto por cadastrar um livro novo quanto
-- por registrar uma leitura (livros_entradas) nele — reflete a nova
-- metodologia de leituras diárias dentro do livro.
create or replace function public.sync_streak(fuso text default 'America/Sao_Paulo')
returns public.streak_estado
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  estado public.streak_estado;
  d date;
  concluidas int;
  meta_ml int;
  total_ml bigint;
  qtd_melhorias int;
  hoje_local date := (now() at time zone fuso)::date;
begin
  select * into estado from public.streak_estado where user_id = uid;
  if not found then
    insert into public.streak_estado (user_id, ultimo_dia_processado)
    values (uid, hoje_local - 1)
    returning * into estado;
  end if;

  d := estado.ultimo_dia_processado + 1;
  while d < hoje_local loop
    concluidas := 0;
    if exists (select 1 from public.vocabulario where user_id = uid and data = d) then
      concluidas := concluidas + 1;
    end if;
    if exists (select 1 from public.diario where user_id = uid and data = d) then
      concluidas := concluidas + 1;
    end if;
    if exists (select 1 from public.livros where user_id = uid and data = d)
       or exists (select 1 from public.livros_entradas where user_id = uid and data = d) then
      concluidas := concluidas + 1;
    end if;

    select quantidade_ml into meta_ml
    from public.agua_metas
    where user_id = uid and vigente_desde <= d
    order by vigente_desde desc
    limit 1;

    if meta_ml is not null then
      select coalesce(sum(quantidade_ml), 0) into total_ml
      from public.agua_registros
      where user_id = uid
        and (registrado_em at time zone fuso)::date = d;

      if total_ml >= meta_ml * 0.5 then
        concluidas := concluidas + 1;
      end if;
    end if;

    select count(*) into qtd_melhorias
    from public.melhorias
    where user_id = uid and (created_at at time zone fuso)::date = d;
    if qtd_melhorias >= 2 then
      concluidas := concluidas + 1;
    end if;

    if concluidas >= 3 then
      estado.streak_atual := estado.streak_atual + 1;
      if estado.streak_atual % 14 = 0 then
        estado.cristais_disponiveis := estado.cristais_disponiveis + 1;
      end if;
    elsif estado.cristais_disponiveis > 0 then
      estado.cristais_disponiveis := estado.cristais_disponiveis - 1;
      -- dia perdoado: chama não apaga nem avança
    else
      estado.streak_atual := 0;
    end if;

    if estado.streak_atual > estado.recorde then
      estado.recorde := estado.streak_atual;
    end if;

    d := d + 1;
  end loop;

  estado.ultimo_dia_processado := hoje_local - 1;
  estado.updated_at := now();

  update public.streak_estado set
    streak_atual = estado.streak_atual,
    recorde = estado.recorde,
    cristais_disponiveis = estado.cristais_disponiveis,
    ultimo_dia_processado = estado.ultimo_dia_processado,
    updated_at = estado.updated_at
  where user_id = uid;

  return estado;
end;
$$;
