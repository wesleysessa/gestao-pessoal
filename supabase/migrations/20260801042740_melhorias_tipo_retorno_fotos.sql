-- Separa Sugestão/Relatar erro, adiciona retorno (resposta ao marcar
-- em funcionamento) e fotos/prints anexados — mesmo padrão de
-- diario-fotos (bucket privado, path "<user_id>/<melhoria_id>/<arquivo>").
alter table public.melhorias
  add column tipo text not null default 'sugestao' check (tipo in ('sugestao', 'erro')),
  add column retorno text;

insert into storage.buckets (id, name, public)
values ('melhorias-fotos', 'melhorias-fotos', false)
on conflict (id) do nothing;

create policy "melhorias_fotos_storage_select" on storage.objects
  for select using (bucket_id = 'melhorias-fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "melhorias_fotos_storage_insert" on storage.objects
  for insert with check (bucket_id = 'melhorias-fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "melhorias_fotos_storage_delete" on storage.objects
  for delete using (bucket_id = 'melhorias-fotos' and (storage.foldername(name))[1] = auth.uid()::text);

create table public.melhorias_fotos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  melhoria_id uuid not null references public.melhorias (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);
create index melhorias_fotos_melhoria_id_idx on public.melhorias_fotos (melhoria_id);

alter table public.melhorias_fotos enable row level security;
create policy "melhorias_fotos_own_rows" on public.melhorias_fotos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
