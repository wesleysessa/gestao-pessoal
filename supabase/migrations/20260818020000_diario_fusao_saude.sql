-- Funde Check-in Saúde dentro do Diário: humor/energia passam a ser campos
-- opcionais de cada entrada de diário (o indicador de academia continua numa
-- tabela própria, sem mudança — só passa a aparecer no card da entrada).

alter table public.diario
  add column humor smallint check (humor between 1 and 5),
  add column energia smallint check (energia between 1 and 5);

-- Backfill: pra cada check-in de saúde, junta com uma entrada de diário do
-- mesmo dia se existir (a mais recente, já que diário permite várias por
-- dia); senão cria uma entrada nova só com o que tinha no check-in.
do $$
declare
  chk record;
  alvo_id uuid;
  alvo_texto text;
begin
  for chk in select * from public.saude_checkins loop
    select id, texto into alvo_id, alvo_texto
    from public.diario
    where user_id = chk.user_id and data = chk.data
    order by created_at desc
    limit 1;

    if alvo_id is not null then
      update public.diario set
        humor = coalesce(humor, chk.humor),
        energia = coalesce(energia, chk.energia),
        texto = case
          when chk.obs is null then texto
          when texto = '' then chk.obs
          when position(chk.obs in texto) > 0 then texto
          else texto || E'\n\n' || chk.obs
        end
      where id = alvo_id;
    else
      insert into public.diario (user_id, data, texto, humor, energia, created_at)
      values (chk.user_id, chk.data, coalesce(chk.obs, ''), chk.humor, chk.energia, chk.created_at);
    end if;
  end loop;
end $$;

-- Não apaga — só arquiva, como rede de segurança caso algo precise ser
-- conferido/recuperado depois.
alter table public.saude_checkins rename to saude_checkins_legado;
