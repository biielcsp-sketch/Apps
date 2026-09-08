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


## Mural de fotos e vídeos (Google Drive)

Os arquivos do mural ficam numa pasta do Google Drive, não no banco e não
no Supabase. O banco guarda só o id do arquivo, a legenda, quem publicou,
as curtidas e os comentários.

Enquanto as quatro variáveis abaixo não estiverem configuradas, a aba
Mural aparece e mostra o que já existe, mas publicar dá uma mensagem
dizendo que o envio ainda não foi configurado.

### 1. Criar as credenciais no Google Cloud

1. Em [console.cloud.google.com](https://console.cloud.google.com), crie
   um projeto (ou use um que já tenha).
2. **APIs e serviços → Biblioteca** → procure **Google Drive API** →
   *Ativar*.
3. **APIs e serviços → Tela de consentimento OAuth**: tipo **Externo**,
   preencha nome do app e e-mail de contato.
4. Ainda na tela de consentimento, **publique o app** (*Publicar app* /
   "Em produção"). Este passo não é opcional: enquanto o app estiver em
   **Testing**, o Google derruba a autorização a cada 7 dias e o mural
   para de aceitar envios toda semana.
5. **Credenciais → Criar credenciais → ID do cliente OAuth** → tipo
   **App para computador** (Desktop app). Anote o **Client ID** e o
   **Client Secret**.
6. Nesse mesmo cliente, cadastre `http://localhost:53682/` como **URI de
   redirecionamento autorizado**.

### 2. Gerar o refresh token

Na sua máquina, dentro da pasta do projeto:

```bash
node scripts/autorizar-google-drive.mjs
```

Ele pede o Client ID e o Client Secret, mostra um endereço para você
autorizar no navegador (logada na conta dona da pasta) e devolve o
`GOOGLE_OAUTH_REFRESH_TOKEN`.

### 3. Configurar no Netlify

Em **Site configuration → Environment variables**:

| Nome | Valor |
|---|---|
| `GOOGLE_DRIVE_FOLDER_ID` | `1hEjy6uVwOBOkfDTWiJo7AE_m7v6O9ArY` |
| `GOOGLE_OAUTH_CLIENT_ID` | o Client ID do passo 1 |
| `GOOGLE_OAUTH_CLIENT_SECRET` | o Client Secret do passo 1 |
| `GOOGLE_OAUTH_REFRESH_TOKEN` | o que saiu do passo 2 |

O `GOOGLE_DRIVE_FOLDER_ID` é o trecho final do endereço da pasta: em
`drive.google.com/drive/folders/XXXX`, é o `XXXX`.

Salve e refaça o deploy (**Deploys → Trigger deploy**) para as funções
enxergarem as variáveis.

> As três credenciais do Google dão acesso de escrita ao Drive dessa
> conta. Elas só podem existir nesse campo do Netlify — nunca em arquivo
> do projeto, nunca no Git, nunca por mensagem.

### Como o arquivo vai e volta

**Subindo:** o navegador pede ao servidor uma sessão de envio; o servidor
abre a sessão no Google (é ele que tem as credenciais) e devolve um
endereço de uso único; o navegador manda os bytes direto para o Google.
O arquivo nunca passa pelo nosso servidor — é o que permite mandar vídeo
de celular sem esbarrar no limite de tamanho das funções do Netlify.

**Descendo:** o Drive não tem endereço fixo de imagem para colocar numa
página, então cada foto e vídeo é servida por `/api/midia/<id>`, que
confere se quem pediu pode ver aquela publicação e só então repassa o
conteúdo. Vídeo funciona com adiantar/voltar normalmente.

### Se der problema

- **"A autorização do Google Drive expirou"** — o app OAuth voltou para
  Testing, ou alguém revogou o acesso em
  [myaccount.google.com/permissions](https://myaccount.google.com/permissions).
  Confira o passo 1.4 e gere o token de novo.
- **"A pasta configurada não foi encontrada"** — o `GOOGLE_DRIVE_FOLDER_ID`
  está errado, ou a conta que autorizou não tem acesso de escrita à pasta.
- **"O Google Drive está sem espaço"** — a conta bateu os 15 GB.
