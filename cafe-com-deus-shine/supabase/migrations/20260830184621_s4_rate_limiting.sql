-- S4 (rate limiting): alternativa viável ao Upstash — sem criar conta/
-- dependência de terceiro sem aprovação explícita (exigida pelo prompt), e
-- sem cair no problema de "Map em memória" citado no prompt como inválido
-- em serverless (Netlify): usamos uma tabela no próprio Postgres já
-- provisionado, que é compartilhada entre todas as instâncias por natureza.
create table rate_limit_events (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now()
);
create index rate_limit_events_key_created_idx on rate_limit_events (key, created_at);

alter table rate_limit_events enable row level security;
-- Nenhuma policy: só a função abaixo (SECURITY DEFINER) acessa esta tabela.
-- Ninguém — nem admin — lê/escreve nela via PostgREST direto.

-- Núcleo genérico, NUNCA exposto via RPC diretamente: se `p_max`/`p_window`
-- fossem parâmetros de uma função pública, um caller anônimo poderia passar
-- max=999999999 pra sempre "passar" no limite e ainda assim inserir uma
-- linha por chamada, inflando a tabela sem controle. Por isso os limites
-- ficam fixos nas funções-wrapper abaixo, e só elas são expostas.
create or replace function app_rate_limit_hit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_count integer;
begin
  delete from rate_limit_events where created_at < now() - interval '1 day';

  select count(*) into v_count
  from rate_limit_events
  where key = p_key and created_at > now() - (p_window_seconds || ' seconds')::interval;

  if v_count >= p_max then
    return false;
  end if;

  insert into rate_limit_events (key) values (p_key);
  return true;
end;
$$;
revoke all on function app_rate_limit_hit(text, integer, integer) from public;

-- Login: 10 tentativas / 5 min, por e-mail tentado. Precisa ser chamável por
-- `anon` — login acontece antes de qualquer sessão existir.
create or replace function app_check_login_rate_limit(p_key text)
returns boolean language sql security definer set search_path = public
as $$ select app_rate_limit_hit('login:' || p_key, 10, 300); $$;
grant execute on function app_check_login_rate_limit(text) to anon, authenticated;

-- Autocadastro de participante (/criar-acesso): também pré-autenticado e
-- também cria conta real — mesmo risco de abuso do login.
create or replace function app_check_claim_account_rate_limit(p_key text)
returns boolean language sql security definer set search_path = public
as $$ select app_rate_limit_hit('claim_account:' || p_key, 10, 900); $$;
grant execute on function app_check_claim_account_rate_limit(text) to anon, authenticated;

-- Solicitar exclusão de dados: 3 / hora, por usuária autenticada.
create or replace function app_check_erasure_rate_limit(p_key text)
returns boolean language sql security definer set search_path = public
as $$ select app_rate_limit_hit('erasure:' || p_key, 3, 3600); $$;
grant execute on function app_check_erasure_rate_limit(text) to authenticated;

-- Criar/editar participante: 30 / minuto, por usuária autenticada.
create or replace function app_check_participant_write_rate_limit(p_key text)
returns boolean language sql security definer set search_path = public
as $$ select app_rate_limit_hit('participant_write:' || p_key, 30, 60); $$;
grant execute on function app_check_participant_write_rate_limit(text) to authenticated;
