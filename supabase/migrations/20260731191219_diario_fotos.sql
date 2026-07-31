-- Fotos anexadas a uma entrada do diário. Bucket privado; cada objeto fica
-- em "<user_id>/<entrada_id>/<arquivo>", e a policy usa o 1º segmento do
-- path (storage.foldername) pra restringir acesso ao dono.
insert into storage.buckets (id, name, public)
values ('diario-fotos', 'diario-fotos', false)
on conflict (id) do nothing;

create policy "diario_fotos_storage_select" on storage.objects
  for select using (bucket_id = 'diario-fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "diario_fotos_storage_insert" on storage.objects
  for insert with check (bucket_id = 'diario-fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "diario_fotos_storage_delete" on storage.objects
  for delete using (bucket_id = 'diario-fotos' and (storage.foldername(name))[1] = auth.uid()::text);

create table public.diario_fotos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entrada_id uuid not null references public.diario (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);
create index diario_fotos_entrada_id_idx on public.diario_fotos (entrada_id);

alter table public.diario_fotos enable row level security;
create policy "diario_fotos_own_rows" on public.diario_fotos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
