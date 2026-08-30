-- S6 (upload de avatar seguro): bucket privado, path por usuária
-- (`{auth.uid()}/avatar.<ext>`) — nome de arquivo gerado pelo sistema, nunca
-- o nome original enviado pelo navegador. Privado por padrão (não público):
-- exibição usa signed URL de curta duração, gerada sob demanda, nunca uma
-- URL pública permanente.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp']);

-- RLS de Storage: cada usuária só escreve/lê a própria pasta
-- (storage.foldername(name))[1] = auth.uid()::text. Sem policy pra outras
-- usuárias, nem para admin/desenvolvedor — exibir o avatar de outra pessoa
-- não é uma funcionalidade pedida aqui; se vier a ser, adiciona-se uma
-- policy de SELECT nova, não se afrouxa esta.
create policy "avatars_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
