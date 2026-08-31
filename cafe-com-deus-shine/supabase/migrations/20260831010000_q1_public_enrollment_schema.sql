-- Fase 9 (Q1): cadastro público via QR Code — schema de enrollment_sources
-- (seção 3 do documento de arquitetura) e rate limit dedicado ao
-- autocadastro público, reaproveitando o núcleo genérico do S4
-- (app_rate_limit_hit), no mesmo padrão de app_check_claim_account_rate_limit.
create table enrollment_sources (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  code text not null unique,
  active boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index enrollment_sources_active_idx on enrollment_sources (active);

alter table enrollment_sources enable row level security;

-- Matriz da seção 4: admin CRUD total, líder SELECT apenas, sem acesso a
-- mais ninguém (participants.enrollment_source só guarda o `code` usado —
-- não há necessidade de leitura por participante). `anon` não tem grant
-- nenhum na tabela (revogado na raiz pela migration s1) — a validação do
-- `?origem=` na rota pública (Q2) não lê esta tabela direto pelo client,
-- passa por Server Action própria.
create policy "enrollment_sources_admin_all" on enrollment_sources for all to authenticated
  using (app_is_admin()) with check (app_is_admin());
-- "not app_is_admin()" incluiria também o papel participante (a matriz diz
-- "sem acesso" para ela) — app_current_leader_id() só retorna não-nulo pra
-- quem tem linha em `leaders`, restringindo certo a líder.
create policy "enrollment_sources_leader_select" on enrollment_sources for select to authenticated
  using (app_current_leader_id() is not null);

-- Autocadastro público (/cadastro, Q2): 5 tentativas / 10 min por IP — mais
-- generoso que login (mesma pessoa pode reenviar depois de corrigir um
-- campo), mas restritivo o bastante pra travar um script varrendo o
-- formulário.
create or replace function app_check_public_enrollment_rate_limit(p_key text)
returns boolean language sql security definer set search_path = public
as $$ select app_rate_limit_hit('public_enrollment:' || p_key, 5, 600); $$;
grant execute on function app_check_public_enrollment_rate_limit(text) to anon, authenticated;
