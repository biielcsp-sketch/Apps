-- Mural de fotos e vídeos: arquivos passam a viver no Google Drive, e o
-- mural ganha curtida e comentário.
--
-- O arquivo em si NUNCA fica no banco (nem antes ficava — antes era o
-- Storage do Supabase). O que muda é para onde ele vai: agora o banco
-- guarda só o id do arquivo no Drive, e o app busca o conteúdo por ali
-- quando alguém abre o mural.

-- ---------------------------------------------------------------
-- 1. cafe_photos passa a guardar foto E vídeo, no Drive
-- ---------------------------------------------------------------

alter table cafe_photos
  add column if not exists drive_file_id text,
  add column if not exists media_type text not null default 'image',
  add column if not exists mime_type text,
  add column if not exists file_name text;

-- Linhas antigas (Storage do Supabase) continuam válidas com
-- storage_path preenchido e drive_file_id nulo; as novas nascem ao
-- contrário. Uma das duas colunas sempre tem que estar preenchida.
alter table cafe_photos alter column storage_path drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cafe_photos_media_type_check'
  ) then
    alter table cafe_photos
      add constraint cafe_photos_media_type_check
      check (media_type in ('image', 'video'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'cafe_photos_tem_arquivo_check'
  ) then
    alter table cafe_photos
      add constraint cafe_photos_tem_arquivo_check
      check (drive_file_id is not null or storage_path is not null);
  end if;
end $$;

-- O feed pede "a última publicação" a cada carregamento.
create index if not exists cafe_photos_recentes_idx on cafe_photos (created_at desc);

-- ---------------------------------------------------------------
-- 2. Curtidas
-- ---------------------------------------------------------------

create table if not exists cafe_photo_likes (
  photo_id uuid not null references cafe_photos(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Uma curtida por pessoa por publicação: a própria chave primária
  -- impede a segunda, sem precisar de checagem na aplicação.
  primary key (photo_id, profile_id)
);
create index if not exists cafe_photo_likes_photo_idx on cafe_photo_likes (photo_id);
alter table cafe_photo_likes enable row level security;

-- Quem enxerga a publicação pode curtir. A condição de visibilidade não é
-- repetida aqui: ela é delegada ao SELECT de cafe_photos, que já é a
-- fonte da verdade — se a política de lá mudar, esta acompanha sozinha.
create policy cafe_photo_likes_select on cafe_photo_likes for select using (
  exists (select 1 from cafe_photos p where p.id = cafe_photo_likes.photo_id)
);
create policy cafe_photo_likes_insert on cafe_photo_likes for insert with check (
  profile_id = auth.uid()
  and exists (select 1 from cafe_photos p where p.id = cafe_photo_likes.photo_id)
);
-- Descurtir é remover a própria curtida, e só a própria.
create policy cafe_photo_likes_delete on cafe_photo_likes for delete using (
  profile_id = auth.uid()
);

-- ---------------------------------------------------------------
-- 3. Comentários
-- ---------------------------------------------------------------

create table if not exists cafe_photo_comments (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references cafe_photos(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists cafe_photo_comments_photo_idx
  on cafe_photo_comments (photo_id, created_at);
alter table cafe_photo_comments enable row level security;

create policy cafe_photo_comments_select on cafe_photo_comments for select using (
  exists (select 1 from cafe_photos p where p.id = cafe_photo_comments.photo_id)
);
create policy cafe_photo_comments_insert on cafe_photo_comments for insert with check (
  profile_id = auth.uid()
  and exists (select 1 from cafe_photos p where p.id = cafe_photo_comments.photo_id)
);
-- Apaga quem escreveu, a líder do café e a admin — mesma régua do delete
-- da própria publicação.
create policy cafe_photo_comments_delete on cafe_photo_comments for delete using (
  app_is_admin()
  or profile_id = auth.uid()
  or exists (
    select 1 from cafe_photos p
    join groups g on g.id = p.group_id
    where p.id = cafe_photo_comments.photo_id
      and g.leader_id = app_current_leader_id()
  )
);
