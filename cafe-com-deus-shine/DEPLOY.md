# Deploy no Netlify

Este projeto usa Next.js com Server Actions e autenticação via cookies —
**não é compatível** com o "Deploy manually" (arrastar pasta) do Netlify,
que só serve arquivos estáticos. Use um dos dois caminhos abaixo.

## Opção A — Git (recomendado)

1. Suba este código para um repositório no GitHub/GitLab.
2. No Netlify: **Add new site → Import an existing project** → conecte o repositório.
3. O Netlify detecta o Next.js automaticamente e usa o `netlify.toml` já incluído
   (plugin oficial `@netlify/plugin-nextjs`, que suporta Server Actions).
4. Em **Site settings → Environment variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (a mesma do `.env.local` — nunca vai para o git)
5. Deploy.

## Opção B — Netlify CLI (a partir deste zip)

```bash
npm install
npm install -g netlify-cli
netlify init          # ou: netlify link, se o site já existir
netlify env:set NEXT_PUBLIC_SUPABASE_URL "..."
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "..."
netlify env:set SUPABASE_SERVICE_ROLE_KEY "..."
netlify deploy --prod
```

## Primeiro acesso (bootstrap da admin)

Não existe cadastro público — o primeiro usuário precisa ser criado manualmente:

1. No Supabase Studio → **Authentication → Add user**, crie a conta da administradora
   (e-mail + senha). Isso já cria automaticamente uma linha em `profiles` com
   `role = 'lider'` (padrão do trigger `on_auth_user_created`).
2. No **SQL Editor**, rode:
   ```sql
   update profiles set role = 'admin' where email = 'email-da-admin@...';
   ```
3. Faça login normalmente pelo app — ela cairá em `/dashboard`.

Novas líderes **não** precisam desse passo manual: a tela "Nova líder" (em
Líderes → Nova líder) já cria a conta. O sistema não envia e-mail nenhum —
a tela gera uma senha provisória, você copia a mensagem pronta e manda para
a líder pelo WhatsApp. No primeiro acesso ela é obrigada a criar a senha
dela antes de conseguir usar qualquer tela.

Isso é de propósito: o serviço de e-mail embutido do Supabase é limitado a
poucos envios por hora (a documentação deles o descreve como algo "para
experimentar", com disponibilidade best-effort), e na prática o cadastro
travava a partir da segunda líder seguida. Se um dia você quiser
recuperação de senha por e-mail, aí sim vale configurar um SMTP próprio em
*Authentication → SMTP Settings* e subir o limite em *Authentication →
Rate Limits* — mas o cadastro de líder não depende mais disso.

## Texto legal da LGPD

O texto em `app_terms_versions` está com um placeholder explícito
("TEXTO PROVISÓRIO"). Substitua por um termo revisado juridicamente antes de
usar o sistema com dados reais de participantes — inserir uma nova linha na
tabela com uma versão maior é o suficiente, o formulário de cadastro sempre
usa a mais recente por `published_at`.
