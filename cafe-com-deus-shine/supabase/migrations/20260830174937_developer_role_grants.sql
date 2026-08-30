-- Perfil "Desenvolvedor": visão completa e acesso ilimitado a todo o sistema,
-- nos mesmos moldes do papel "desenvolvedor" do app de referência (consolidação).
-- Como este projeto já é single-tenant e app_is_admin() é o único portão
-- checado por TODAS as policies de RLS, a forma mais segura de dar acesso
-- ilimitado ao desenvolvedor é redefinir esse mesmo portão para reconhecer
-- também o papel 'desenvolvedor' — em vez de tocar dezenas de policies uma a
-- uma (alto risco de esquecer alguma e deixar uma lacuna de acesso).
create or replace function app_is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role in ('admin', 'desenvolvedor')
  );
$$;

comment on function app_is_admin() is
  'Portão único de autorização "nível administrativo": true para role admin OU desenvolvedor. Nome mantido por compatibilidade — checado por todas as policies de RLS do projeto.';
