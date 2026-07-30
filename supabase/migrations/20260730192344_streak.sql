-- "Chama Acesa": streak diária. Um dia conta se pelo menos 3 das 4 tarefas
-- (vocabulário, diário, livros, check-in de saúde) tiverem registro nele.
-- A cada 100 dias seguidos, ganha 1 congelamento (perdoa 1 dia sem quebrar
-- a chama). sync_streak() processa os dias pendentes (do último processado
-- até ontem) e devolve o estado atualizado — é chamada toda vez que a Home
-- carrega.

create table public.streak_estado (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique default auth.uid() references auth.users (id) on delete cascade,
  streak_atual int not null default 0,
  recorde int not null default 0,
  congelamentos_disponiveis int not null default 0,
  ultimo_dia_processado date,
  updated_at timestamptz not null default now()
);

alter table public.streak_estado enable row level security;
create policy "streak_estado_own_row" on public.streak_estado
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

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
    if exists (select 1 from public.vocabulario where user_id = uid and created_at::date = d) then
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

    if concluidas >= 3 then
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

grant execute on function public.sync_streak() to authenticated;
