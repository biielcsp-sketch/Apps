-- S1 (auditoria de RLS): o app nunca faz leitura/escrita direta em tabela como
-- `anon` — toda página pública usa signInWithPassword ou o client de
-- service_role (que já ignora RLS por design). O grant padrão do Postgres/
-- Supabase concede a `anon` INSERT/SELECT/UPDATE/DELETE/TRUNCATE em toda
-- tabela do schema public; hoje isso é inofensivo só porque toda policy é
-- "to authenticated" (anon não casa com nenhuma policy = acesso negado).
-- Removemos o grant na raiz para que a barreira não dependa unicamente da
-- RLS permanecer habilitada em toda tabela futura — defesa em profundidade.
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
