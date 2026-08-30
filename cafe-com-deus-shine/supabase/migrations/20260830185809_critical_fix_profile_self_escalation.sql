-- ACHADO CRÍTICO (durante S6, não relacionado a avatar): a policy
-- "profiles_update" (using/with check: id = auth.uid() or app_is_admin())
-- só restringe QUAL LINHA pode ser tocada, nunca QUAIS COLUNAS — ao
-- contrário de `participants`, que já tem app_guard_participant_self_update()
-- para isso. Isso significa que QUALQUER usuária autenticada (líder ou
-- participante) podia rodar, do próprio browser, com a sessão normal (sem
-- service_role nenhuma):
--   supabase.from('profiles').update({ role: 'admin' }).eq('id', meuId)
-- e se autopromover a admin/desenvolvedor. Confirmado via simulação de RLS
-- antes desta migration (uma líder virou 'desenvolvedor' com um UPDATE
-- comum). Mesma lógica se aplica a `active` (uma conta desativada poderia
-- se reativar sozinha). Corrigido com o mesmo padrão de trigger já usado em
-- participants: qualquer sessão sem app_is_admin() que tente mudar role ou
-- active no próprio profile é bloqueada com exceção.
--
-- NOTA: esta versão tinha um bug corrigido na migration seguinte
-- (fix_profile_guard_service_role_bypass) — ver lá o porquê.
create or replace function app_guard_profile_self_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if app_is_admin() then
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

revoke all on function app_guard_profile_self_update() from public;

create trigger guard_profile_self_update
  before update on profiles
  for each row
  execute function app_guard_profile_self_update();
