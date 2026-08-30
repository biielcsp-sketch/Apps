-- Correção do achado anterior: como escrito, o guard também bloquearia
-- escritas legítimas via service_role (claimParticipantAccount setando
-- role='participante', createLeaderAccount/createDirectAccount setando
-- role na criação de conta) — porque auth.uid() é NULL numa conexão
-- service_role, então app_is_admin() (que faz "where id = auth.uid()")
-- também dá falso lá, e o guard achava que devia bloquear.
-- O padrão já usado em app_guard_participant_self_update() evita isso
-- porque a condição é sempre "where id = auth.uid()" — com auth.uid() nulo,
-- a condição nunca bate e o guard não ativa. Replicamos a mesma lógica
-- aqui: só ativa o guard quando existe uma sessão de usuário real.
create or replace function app_guard_profile_self_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null or app_is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Você não pode alterar seu próprio papel de acesso.';
  end if;

  if new.active is distinct from old.active then
    raise exception 'Você não pode alterar o próprio status de conta.';
  end if;

  return new;
end;
$$;
