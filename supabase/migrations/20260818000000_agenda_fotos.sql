-- Fotos anexadas a um evento da Agenda. Mesmo padrão de vocabulario-fotos:
-- bucket privado, path "<user_id>/<evento_id>/<arquivo>", policy usa o
-- 1º segmento do path (storage.foldername) pra restringir acesso ao dono.
insert into storage.buckets (id, name, public)
values ('agenda-fotos', 'agenda-fotos', false)
on conflict (id) do nothing;

create policy "agenda_fotos_storage_select" on storage.objects
  for select using (bucket_id = 'agenda-fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "agenda_fotos_storage_insert" on storage.objects
  for insert with check (bucket_id = 'agenda-fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "agenda_fotos_storage_delete" on storage.objects
  for delete using (bucket_id = 'agenda-fotos' and (storage.foldername(name))[1] = auth.uid()::text);

create table public.agenda_fotos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  evento_id uuid not null references public.agenda_eventos (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);
create index agenda_fotos_evento_id_idx on public.agenda_fotos (evento_id);

alter table public.agenda_fotos enable row level security;
create policy "agenda_fotos_own_rows" on public.agenda_fotos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
