-- Reestrutura Livros: o livro (box principal) passa a ser só título/autor/
-- capa; as leituras do dia a dia (anotações, nota da sessão, páginas lidas)
-- viram registros filhos em livros_entradas — permite acompanhar leitura
-- diária de um mesmo livro, não só "um livro = um registro de conclusão".

-- Bucket pra capa (uma só por livro, não é galeria — por isso upsert em vez
-- do padrão de fotos múltiplas já usado em diario/vocabulario/agenda).
insert into storage.buckets (id, name, public)
values ('livros-capas', 'livros-capas', false)
on conflict (id) do nothing;

create policy "livros_capas_storage_select" on storage.objects
  for select using (bucket_id = 'livros-capas' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "livros_capas_storage_insert" on storage.objects
  for insert with check (bucket_id = 'livros-capas' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "livros_capas_storage_update" on storage.objects
  for update using (bucket_id = 'livros-capas' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "livros_capas_storage_delete" on storage.objects
  for delete using (bucket_id = 'livros-capas' and (storage.foldername(name))[1] = auth.uid()::text);

alter table public.livros add column capa_path text;

create table public.livros_entradas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  livro_id uuid not null references public.livros (id) on delete cascade,
  data date not null default current_date,
  anotacoes text,
  nota smallint check (nota between 1 and 5),
  paginas integer check (paginas >= 0),
  created_at timestamptz not null default now()
);
create index livros_entradas_livro_id_idx on public.livros_entradas (livro_id);
create index livros_entradas_user_id_data_idx on public.livros_entradas (user_id, data);

alter table public.livros_entradas enable row level security;
create policy "livros_entradas_own_rows" on public.livros_entradas
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Backfill: cada livro já cadastrado ganha uma entrada com o que já tinha
-- (nota e comentário), pra não perder nada. As colunas antigas de
-- livros.nota/comentario ficam como estavam (não usadas mais pelo app, só
-- histórico) — nada é apagado.
insert into public.livros_entradas (user_id, livro_id, data, anotacoes, nota, created_at)
select user_id, id, data, comentario, nullif(nota, 0), created_at
from public.livros;
