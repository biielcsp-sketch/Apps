-- Mural de fotos do café (adaptado do MuralFotos do app Consolidação) e
-- favoritos da Bíblia. Conteúdo idêntico ao aplicado via apply_migration.

create table if not exists cafe_photos (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  author_profile_id uuid not null references profiles(id),
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);
create index if not exists cafe_photos_group_idx on cafe_photos (group_id, created_at desc);
alter table cafe_photos enable row level security;

create policy cafe_photos_select on cafe_photos for select using (
  app_is_admin()
  or exists (select 1 from groups g where g.id = cafe_photos.group_id and g.leader_id = app_current_leader_id())
  or group_id = app_hosted_group_id()
  or group_id = (select current_group_id from participants where id = app_current_participant_id())
);
create policy cafe_photos_insert on cafe_photos for insert with check (
  author_profile_id = auth.uid()
  and (app_is_admin()
       or exists (select 1 from groups g where g.id = cafe_photos.group_id and g.leader_id = app_current_leader_id()))
);
create policy cafe_photos_delete on cafe_photos for delete using (
  app_is_admin()
  or author_profile_id = auth.uid()
  or exists (select 1 from groups g where g.id = cafe_photos.group_id and g.leader_id = app_current_leader_id())
);

create table if not exists bible_favorites (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  book_abbrev text not null,
  book_name text not null,
  chapter integer not null,
  verse integer not null,
  text text not null,
  created_at timestamptz not null default now(),
  unique (profile_id, book_abbrev, chapter, verse)
);
create index if not exists bible_favorites_profile_idx on bible_favorites (profile_id, created_at desc);
alter table bible_favorites enable row level security;
create policy bible_favorites_own on bible_favorites for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit,
                               allowed_mime_types = excluded.allowed_mime_types;

create policy "fotos_select_authenticated" on storage.objects for select
  to authenticated using (bucket_id = 'fotos');
create policy "fotos_insert_lideranca" on storage.objects for insert
  to authenticated with check (bucket_id = 'fotos' and (app_is_admin() or app_current_leader_id() is not null));
create policy "fotos_delete_lideranca" on storage.objects for delete
  to authenticated using (bucket_id = 'fotos' and (app_is_admin() or app_current_leader_id() is not null));
