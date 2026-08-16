-- Fotos anexadas a uma palavra do Vocabulário. Mesmo padrão de diario-fotos:
-- bucket privado, path "<user_id>/<vocabulario_id>/<arquivo>", policy usa o
-- 1º segmento do path (storage.foldername) pra restringir acesso ao dono.
insert into storage.buckets (id, name, public)
values ('vocabulario-fotos', 'vocabulario-fotos', false)
on conflict (id) do nothing;

create policy "vocabulario_fotos_storage_select" on storage.objects
  for select using (bucket_id = 'vocabulario-fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vocabulario_fotos_storage_insert" on storage.objects
  for insert with check (bucket_id = 'vocabulario-fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vocabulario_fotos_storage_delete" on storage.objects
  for delete using (bucket_id = 'vocabulario-fotos' and (storage.foldername(name))[1] = auth.uid()::text);

create table public.vocabulario_fotos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  vocabulario_id uuid not null references public.vocabulario (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);
create index vocabulario_fotos_vocabulario_id_idx on public.vocabulario_fotos (vocabulario_id);

alter table public.vocabulario_fotos enable row level security;
create policy "vocabulario_fotos_own_rows" on public.vocabulario_fotos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
