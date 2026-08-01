-- Bucket público pro logo do app (imagem exibida no menu/cabeçalho/login),
-- editável a qualquer momento. Público porque é uma imagem decorativa, não
-- dado pessoal — evita ter que gerar signed URL toda vez que ela aparece.
insert into storage.buckets (id, name, public)
values ('app-logo', 'app-logo', true)
on conflict (id) do nothing;

create policy "app_logo_select" on storage.objects
  for select using (bucket_id = 'app-logo');
create policy "app_logo_insert" on storage.objects
  for insert with check (bucket_id = 'app-logo' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "app_logo_update" on storage.objects
  for update using (bucket_id = 'app-logo' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "app_logo_delete" on storage.objects
  for delete using (bucket_id = 'app-logo' and (storage.foldername(name))[1] = auth.uid()::text);
