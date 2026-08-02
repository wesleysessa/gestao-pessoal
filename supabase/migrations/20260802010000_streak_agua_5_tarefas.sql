-- Hidratação vira a 5ª tarefa da "Chama Acesa" (agora 4 das 5: vocabulário,
-- diário, livros, check-in de saúde, água — bate a meta do dia). De
-- carona, corrige o vocabulário pra comparar por `data` (coluna local, como
-- diário/livros) em vez de `created_at::date` (UTC) — o mesmo bug de fuso já
-- corrigido no front em outras telas, mas que ainda restava aqui na função
-- que fecha a conta no banco.
create or replace function public.sync_streak()
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
begin
  select * into estado from public.streak_estado where user_id = uid;
  if not found then
    insert into public.streak_estado (user_id, ultimo_dia_processado)
    values (uid, current_date - 1)
    returning * into estado;
  end if;

  d := estado.ultimo_dia_processado + 1;
  while d < current_date loop
    concluidas := 0;
    if exists (select 1 from public.vocabulario where user_id = uid and data = d) then
      concluidas := concluidas + 1;
    end if;
    if exists (select 1 from public.diario where user_id = uid and data = d) then
      concluidas := concluidas + 1;
    end if;
    if exists (select 1 from public.livros where user_id = uid and data = d) then
      concluidas := concluidas + 1;
    end if;
    if exists (select 1 from public.saude_checkins where user_id = uid and data = d) then
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
        and (registrado_em at time zone 'America/Sao_Paulo')::date = d;

      if total_ml >= meta_ml then
        concluidas := concluidas + 1;
      end if;
    end if;

    if concluidas >= 4 then
      estado.streak_atual := estado.streak_atual + 1;
      if estado.streak_atual % 100 = 0 then
        estado.congelamentos_disponiveis := estado.congelamentos_disponiveis + 1;
      end if;
    elsif estado.congelamentos_disponiveis > 0 then
      estado.congelamentos_disponiveis := estado.congelamentos_disponiveis - 1;
      -- dia perdoado: chama não apaga nem avança
    else
      estado.streak_atual := 0;
    end if;

    if estado.streak_atual > estado.recorde then
      estado.recorde := estado.streak_atual;
    end if;

    d := d + 1;
  end loop;

  estado.ultimo_dia_processado := current_date - 1;
  estado.updated_at := now();

  update public.streak_estado set
    streak_atual = estado.streak_atual,
    recorde = estado.recorde,
    congelamentos_disponiveis = estado.congelamentos_disponiveis,
    ultimo_dia_processado = estado.ultimo_dia_processado,
    updated_at = estado.updated_at
  where user_id = uid;

  return estado;
end;
$$;
