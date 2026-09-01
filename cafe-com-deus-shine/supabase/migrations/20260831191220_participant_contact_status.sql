-- Trilha de acompanhamento (contato/outreach) por líder, pedida pelo
-- usuário com base na tela "Novo Começo" do app de referência — não
-- confundir com `participant_status` (estágio de distribuição) nem com
-- `follow_ups` (log pastoral livre): aqui é especificamente o pipeline de
-- tentativas de contato com uma participante, com histórico imutável.
create type contact_status as enum (
  'aguardando_1_contato',
  'primeira_mensagem_enviada',
  'segunda_mensagem_enviada',
  'em_conversa',
  'em_processo',
  'nao_respondeu',
  'parou_de_responder',
  'numero_invalido',
  'consolidada',
  'sem_interesse'
);

alter table participants
  add column contact_status contact_status not null default 'aguardando_1_contato';

create table participant_contact_status_history (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  status contact_status not null,
  note text,
  changed_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_pcsh_participant on participant_contact_status_history(participant_id);
create index idx_pcsh_changed_by on participant_contact_status_history(changed_by);

alter table participant_contact_status_history enable row level security;

-- Mesmo padrão de follow_ups: admin vê/edita tudo, líder vê e insere para
-- quem ela é responsável (atual ou histórica) via app_is_responsible_for_participant.
-- Histórico é imutável (sem update/delete pra líder).
create policy "pcsh_select" on participant_contact_status_history for select to authenticated
  using (app_is_admin() or app_is_responsible_for_participant(participant_id));
create policy "pcsh_leader_insert" on participant_contact_status_history for insert to authenticated
  with check (app_is_admin() or app_is_responsible_for_participant(participant_id));
create policy "pcsh_admin_write" on participant_contact_status_history for update to authenticated
  using (app_is_admin()) with check (app_is_admin());
create policy "pcsh_admin_delete" on participant_contact_status_history for delete to authenticated
  using (app_is_admin());

-- Fecha a mesma brecha corrigida no fix crítico de auto-escalonamento de
-- profiles: uma coluna nova em participants que fica de fora da lista de
-- campos autoeditáveis fica liberada por omissão se não entrar no guard.
create or replace function app_guard_participant_self_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if exists (select 1 from profiles where id = auth.uid() and role = 'participante') then
    if new.full_name is distinct from old.full_name
      or new.preferred_name is distinct from old.preferred_name
      or new.email is distinct from old.email
      or new.birth_date is distinct from old.birth_date
      or new.city is distinct from old.city
      or new.neighborhood is distinct from old.neighborhood
      or new.geo_lat is distinct from old.geo_lat
      or new.geo_lng is distinct from old.geo_lng
      or new.other_notes is distinct from old.other_notes
      or new.status is distinct from old.status
      or new.contact_status is distinct from old.contact_status
      or new.current_leader_id is distinct from old.current_leader_id
      or new.current_group_id is distinct from old.current_group_id
      or new.enrollment_date is distinct from old.enrollment_date
      or new.enrollment_source is distinct from old.enrollment_source
      or new.admin_notes is distinct from old.admin_notes
      or new.deleted_at is distinct from old.deleted_at
      or new.consent_accepted_at is distinct from old.consent_accepted_at
      or new.consent_version is distinct from old.consent_version
      or new.consent_method is distinct from old.consent_method
      or new.anonymized_at is distinct from old.anonymized_at
      or new.profile_id is distinct from old.profile_id
    then
      raise exception 'Participante só pode atualizar telefone, whatsapp, endereço e disponibilidade.';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function app_guard_participant_self_update() from public, anon, authenticated;
