# Café com Deus Shine — Landing

Página pública de inscrição. **Projeto separado do sistema**: sobe no seu
próprio site do Netlify, com o próprio endereço.

As inscrições feitas aqui caem no **mesmo banco de dados** do sistema —
elas aparecem em *Participantes → Novas inscrições*, exatamente como as
que chegam pelo QR Code.

```
cafe-com-deus-landing/
├── netlify.toml            configuração do deploy (nada a editar)
├── public/                 o site em si
│   ├── index.html
│   ├── styles.css
│   ├── fonts.css           as fontes (servidas pelo próprio site)
│   ├── app.js
│   ├── config.js           ← o único arquivo que você edita
│   ├── favicon.png
│   └── assets/             logo, ícones e fontes/
└── netlify/functions/
    └── api.mjs             fala com o banco (a chave fica só aqui)
```

Não tem `npm install`, não tem build, não tem framework. É HTML, CSS e
JavaScript.

As fontes (Cormorant Garamond e Geist, as duas sob licença SIL Open Font
License 1.1) ficam dentro do próprio projeto, em `public/assets/fonts/`.
A página não faz nenhuma requisição a servidor de terceiro para carregar
— nem ao Google.

---

## Como colocar no ar

### 1. Criar o site no Netlify

No painel do Netlify, **Add new site → Deploy manually** e arraste a pasta
`cafe-com-deus-landing` inteira (não só a `public`).

Se preferir pelo Git, crie um repositório com estes arquivos e conecte —
o `netlify.toml` já diz tudo o que o Netlify precisa saber. Deixe o campo
*Build command* vazio.

### 2. Configurar as duas variáveis de ambiente

Em **Site configuration → Environment variables**, adicione:

| Nome | Valor |
|---|---|
| `SUPABASE_URL` | O endereço do projeto Supabase, ex. `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | A chave `service_role` do Supabase |

As duas são as **mesmas** que já estão configuradas no site do sistema.
Você as encontra no painel do Supabase em *Project Settings → API*.

> A chave `service_role` dá acesso total ao banco. Ela só pode existir
> nesse campo de variável de ambiente do Netlify — nunca em um arquivo,
> nunca no Git, nunca numa mensagem. Depois de salvar, refaça o deploy
> (**Deploys → Trigger deploy**) para a função enxergar as variáveis.

### 3. Apontar para o sistema

Abra `public/config.js` e troque o endereço pelo do **sistema** (o app
onde as líderes entram):

```js
window.CAFE_CONFIG = {
  appUrl: "https://o-endereco-do-seu-sistema.netlify.app",
};
```

É esse endereço que os links *"Já participo — entrar"* e *"Criar meu
acesso"* usam.

### 4. Ligar as inscrições

A landing só mostra o formulário se existir uma **origem de inscrição
ativa** no sistema. Entre no painel como pastora, vá em *QR Codes* e
confira que há pelo menos uma origem marcada como ativa.

Se não houver, a página mostra *"As inscrições estão fechadas no
momento"* — que também é a forma de fechar as inscrições quando você
quiser: é só desativar a origem no painel.

---

## O que dá pra mudar sem mexer em código

**As regras do café** que aparecem acima do formulário saem do painel do
sistema (*Configurações → Regras do café*). O que você escrever lá
aparece aqui no próximo carregamento da página.

**Abrir e fechar as inscrições**: ativar ou desativar a origem no painel,
como no passo 4.

Os textos da página (o "O que é", os passos, o rodapé) estão em
`public/index.html`, em português normal — dá pra editar direto no
arquivo.

---

## Como testar na sua máquina

```bash
npx netlify-cli dev
```

Sobe em `http://localhost:8888` com a função funcionando. Para o
formulário funcionar no teste, crie um arquivo `.env` na raiz com as duas
variáveis do passo 2 (o `.gitignore` já impede que ele vá para o Git).

Só para ver o visual, sem formulário, qualquer servidor estático serve:

```bash
npx serve public
```

---

## Como isso conversa com o banco

O navegador **nunca** fala com o Supabase. Ele chama duas rotas da função:

- `GET /api/config` — devolve se a inscrição está aberta e o texto das
  regras.
- `POST /api/inscricao` — recebe o formulário e grava a participante.

A função repete, do lado do servidor, as mesmas proteções do sistema:

- campo-armadilha (*honeypot*) contra robô;
- limite de tentativas por IP, na mesma função do Postgres que o sistema
  usa;
- conferência da origem de inscrição;
- checagem de telefone repetido;
- e o cadastro montado campo a campo — `status`, consentimento e origem
  são decididos no servidor, nunca vêm do formulário.
