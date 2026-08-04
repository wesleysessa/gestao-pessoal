-- Bug de fuso na streak: sync_streak() usava `current_date` (fuso do
-- servidor, UTC) pra decidir "hoje"/"ontem". Das 21h às 23h59 no horário de
-- Brasília, o servidor já enxerga o dia seguinte em UTC — nessa janela, a
-- função fechava o dia (ainda em andamento pro usuário) usando dados
-- parciais, podia zerar a streak, e marcava o dia como processado antes da
-- pessoa terminar as tarefas da noite (ex.: hidratação). Troca todo uso de
-- `current_date` por uma data calculada no fuso America/Sao_Paulo.
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
  hoje_br date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  select * into estado from public.streak_estado where user_id = uid;
  if not found then
    insert into public.streak_estado (user_id, ultimo_dia_processado)
    values (uid, hoje_br - 1)
    returning * into estado;
  end if;

  d := estado.ultimo_dia_processado + 1;
  while d < hoje_br loop
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

  estado.ultimo_dia_processado := hoje_br - 1;
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

-- Correção pontual: nos dias 01, 02 e 03/08/2026 as 4 tarefas (de 5) foram
-- cumpridas, mas o bug acima zerou a streak antes de fechar o dia 03/08
-- corretamente (o usuário completou a hidratação por volta das 22h e o dia
-- já tinha sido processado incorretamente minutos antes). Restaura os 3
-- dias — sem mexer no recorde, que já refletia um valor igual ou maior.
update public.streak_estado
set streak_atual = 3,
    updated_at = now()
where user_id = '90f4842c-03e2-4a3f-a76c-728e22b69e1d'
  and ultimo_dia_processado = '2026-08-03'
  and streak_atual = 0;
