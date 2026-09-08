#!/usr/bin/env node
/* ===================================================================
   Gera o GOOGLE_OAUTH_REFRESH_TOKEN do mural.

   Roda uma vez só, na sua máquina. O token que sai daqui é o que deixa o
   sistema gravar na pasta do Drive sem ninguém precisar estar logado.

   Como usar:

     node scripts/autorizar-google-drive.mjs

   Ele pede o Client ID e o Client Secret (os que você criou no Google
   Cloud), abre um endereço para você autorizar no navegador e devolve o
   refresh token. O passo a passo completo está no DEPLOY.md.
   =================================================================== */

import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

// "urn:ietf:wg:oauth:2.0:oob" foi desativado pelo Google. O jeito que
// funciona hoje sem subir servidor: usar localhost como redirect e copiar
// o `code=` da barra de endereços quando o navegador tentar abrir a
// página (ela vai dar erro de conexão — é esperado, o que importa é a URL).
const REDIRECT = "http://localhost:53682/";

// Escopo cheio do Drive: é o que garante escrever numa pasta que já
// existe, criada por você e não pelo app. O drive.file, mais restrito,
// só enxerga arquivos que o próprio app criou — e aí a pasta que você
// escolheu não seria alcançável.
const SCOPE = "https://www.googleapis.com/auth/drive";

const rl = createInterface({ input: stdin, output: stdout });

const clientId = (await rl.question("Client ID: ")).trim();
const clientSecret = (await rl.question("Client Secret: ")).trim();

if (!clientId || !clientSecret) {
  console.error("\nPrecisa dos dois. Veja o DEPLOY.md, seção do mural.");
  process.exit(1);
}

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT,
    response_type: "code",
    scope: SCOPE,
    // Sem estes dois o Google devolve só o access token, que vale 1h e
    // não serve para um servidor que precisa gravar daqui a seis meses.
    access_type: "offline",
    prompt: "consent",
  });

console.log("\n1. Abra este endereço no navegador, logada na conta dona da pasta:\n");
console.log(authUrl);
console.log(
  "\n2. Autorize. O navegador vai tentar abrir localhost e dar erro de" +
    "\n   conexão — isso é esperado.\n" +
    "\n3. Copie da barra de endereços o que estiver entre `code=` e `&scope`.\n",
);

const code = (await rl.question("Cole o code aqui: ")).trim();
rl.close();

if (!code) {
  console.error("\nSem o code não dá para continuar.");
  process.exit(1);
}

const response = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    code: decodeURIComponent(code),
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: REDIRECT,
    grant_type: "authorization_code",
  }),
});

const data = await response.json();

if (!response.ok || !data.refresh_token) {
  console.error("\nNão deu certo. O Google respondeu:\n");
  console.error(JSON.stringify(data, null, 2));
  console.error(
    "\nO mais comum:" +
      "\n  invalid_grant     -> o code já foi usado ou passou do prazo. Refaça do passo 1." +
      "\n  redirect_uri_mismatch -> cadastre exatamente " + REDIRECT +
      " como URI de redirecionamento autorizado no Google Cloud." +
      "\n  sem refresh_token -> falta access_type=offline (ou a conta já autorizou antes:" +
      "\n                       revogue em myaccount.google.com/permissions e refaça).",
  );
  process.exit(1);
}

console.log("\nPronto. Coloque isto nas variáveis de ambiente do Netlify:\n");
console.log("GOOGLE_OAUTH_REFRESH_TOKEN=" + data.refresh_token);
console.log(
  "\nGuarde bem: este valor dá acesso de escrita ao Drive dessa conta." +
    "\nNão mande por mensagem nem coloque em arquivo do projeto.\n",
);
