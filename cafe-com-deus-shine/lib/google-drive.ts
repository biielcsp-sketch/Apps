import "server-only";
import { AppError } from "@/lib/errors";

/* ===================================================================
   Google Drive — o único lugar do sistema que fala com o Drive.

   Por que OAuth de usuária e não conta de serviço: uma conta de serviço
   não tem cota de armazenamento própria, então subir arquivo para uma
   pasta do "Meu Drive" de alguém falha com storageQuotaExceeded. Com o
   refresh token de uma conta real, o arquivo é da conta real e usa o
   espaço dela — que é o que a pastora quer.

   Sem biblioteca do Google: a API é REST e o que precisamos dela cabe
   em quatro chamadas. Menos uma dependência de 20 MB no bundle.
   =================================================================== */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://www.googleapis.com/drive/v3";
const UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";

function config() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    const faltando = driveConfigStatus()
      .filter((v) => !v.presente)
      .map((v) => v.nome)
      .join(", ");
    console.error("[drive] variáveis de ambiente ausentes:", faltando);
    throw new AppError(
      "O envio de fotos e vídeos ainda não foi configurado. Fale com quem cuida do sistema.",
    );
  }
  return { clientId, clientSecret, refreshToken };
}

export function isDriveConfigured() {
  return driveConfigStatus().every((v) => v.presente);
}

// Diz quais das três variáveis o servidor está enxergando de fato —
// só o nome e sim/não, nunca o valor. Existe porque "não foi
// configurado" sozinho não diz o que falta, e quem cuida do sistema
// fica adivinhando entre variável ausente, nome errado e escopo errado
// no painel da hospedagem.
export function driveConfigStatus(): { nome: string; presente: boolean }[] {
  return [
    { nome: "GOOGLE_OAUTH_CLIENT_ID", presente: Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID) },
    {
      nome: "GOOGLE_OAUTH_CLIENT_SECRET",
      presente: Boolean(process.env.GOOGLE_OAUTH_CLIENT_SECRET),
    },
    {
      nome: "GOOGLE_OAUTH_REFRESH_TOKEN",
      presente: Boolean(process.env.GOOGLE_OAUTH_REFRESH_TOKEN),
    },
  ];
}

// Pasta fixada por variável de ambiente. Só funciona com a permissão
// ampla do Drive; com a estreita (drive.file, que é a recomendada) o app
// não enxerga pasta que não criou, e quem manda é a pasta própria dele —
// ver createDriveFolder abaixo.
export function getPinnedFolderId(): string | null {
  return process.env.GOOGLE_DRIVE_FOLDER_ID || null;
}

// Cria a pasta do mural no Drive da conta que autorizou. Como foi o app
// que criou, ele continua enxergando ela mesmo com a permissão estreita —
// e é isso que dispensa a verificação do Google.
export async function createDriveFolder(name: string): Promise<string> {
  const token = await getAccessToken();
  const response = await fetch(`${API}/files?fields=id`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder" }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("[drive] criação da pasta falhou:", response.status, detail.slice(0, 400));
    throw new AppError("Não foi possível criar a pasta do mural no Google Drive.");
  }

  const data = (await response.json()) as { id: string };
  return data.id;
}

/* ------------------------- Token de acesso -------------------------
   O access token vale 1h. Guardar em memória evita uma ida ao Google a
   cada foto — mas cada instância serverless tem a sua cópia, então isto
   é só uma economia, nunca uma garantia. A margem de 5 min impede usar
   um token que expira no meio da requisição. */

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  const { clientId, clientSecret, refreshToken } = config();
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("[drive] falha ao renovar o token:", response.status, detail.slice(0, 400));
    // invalid_grant = a autorização foi revogada ou expirou. É o erro que
    // aparece quando o app OAuth ficou em "Testing" (o Google derruba o
    // refresh token em 7 dias) — merece uma frase que aponte a causa.
    const expirado = detail.includes("invalid_grant");
    throw new AppError(
      expirado
        ? "A autorização do Google Drive expirou. É preciso autorizar o sistema de novo."
        : "Não foi possível falar com o Google Drive agora. Tente de novo em instantes.",
    );
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };
  return data.access_token;
}

/* --------------- Upload direto do navegador ---------------
   Vídeo de celular tem dezenas de MB e não passa por uma Server Action:
   o Netlify corta o corpo da requisição bem antes disso. A saída é a
   sessão retomável do Google — o servidor abre a sessão (é ele que tem o
   token) e devolve ao navegador uma URL de uso único, para onde os bytes
   vão direto, sem encostar na nossa infraestrutura.

   A URL é uma credencial de escopo mínimo: serve para um upload só,
   naquela pasta, e caduca sozinha. */

export async function createResumableUpload(input: {
  mimeType: string;
  fileName: string;
  folderId: string;
}): Promise<string> {
  const token = await getAccessToken();

  const response = await fetch(
    `${UPLOAD_API}/files?uploadType=resumable&supportsAllDrives=true&fields=id,name`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json; charset=UTF-8",
        "x-upload-content-type": input.mimeType,
      },
      body: JSON.stringify({ name: input.fileName, parents: [input.folderId] }),
    },
  );

  const uploadUrl = response.headers.get("location");
  if (!response.ok || !uploadUrl) {
    const detail = await response.text();
    console.error("[drive] sessão de upload falhou:", response.status, detail.slice(0, 400));
    if (response.status === 404) {
      throw new AppError(
        "A pasta configurada no Google Drive não foi encontrada. Confira o endereço da pasta.",
      );
    }
    throw new AppError("Não foi possível iniciar o envio agora. Tente de novo.");
  }

  return uploadUrl;
}

export type DriveFileMeta = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  parents: string[];
};

// Depois do upload direto, o servidor precisa conferir o que de fato
// entrou no Drive: o navegador só manda um id, e id vindo do navegador
// não se acredita. Aqui é onde se confirma que o arquivo existe, está na
// NOSSA pasta e é mesmo do tipo que diz ser — o Google detecta o tipo
// real, o que substitui a checagem de magic bytes que fazíamos quando os
// bytes passavam por aqui.
export async function getDriveFileMeta(fileId: string): Promise<DriveFileMeta | null> {
  const token = await getAccessToken();
  const response = await fetch(
    `${API}/files/${encodeURIComponent(fileId)}` +
      `?supportsAllDrives=true&fields=id,name,mimeType,size,parents`,
    { headers: { authorization: `Bearer ${token}` } },
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    console.error("[drive] metadados falharam:", fileId, response.status);
    return null;
  }

  const data = (await response.json()) as {
    id: string;
    name: string;
    mimeType: string;
    size?: string;
    parents?: string[];
  };
  return {
    id: data.id,
    name: data.name,
    mimeType: data.mimeType,
    size: Number(data.size ?? 0),
    parents: data.parents ?? [],
  };
}

// Busca o conteúdo do arquivo. `range` é repassado para o Google quando
// vem do navegador — é o que faz vídeo poder ser adiantado sem baixar o
// arquivo inteiro antes.
export async function fetchFromDrive(fileId: string, range?: string | null): Promise<Response> {
  const token = await getAccessToken();
  const headers: Record<string, string> = { authorization: `Bearer ${token}` };
  if (range) headers.range = range;

  const response = await fetch(
    `${API}/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`,
    { headers },
  );

  if (!response.ok && response.status !== 206) {
    console.error("[drive] leitura falhou:", fileId, response.status);
  }
  return response;
}

export async function deleteFromDrive(fileId: string): Promise<void> {
  const token = await getAccessToken();
  const response = await fetch(
    `${API}/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`,
    { method: "DELETE", headers: { authorization: `Bearer ${token}` } },
  );

  // 404 = já não existe, que é o estado desejado. Qualquer outro erro só
  // vira log: a linha no banco já foi apagada e não faz sentido segurar a
  // ação da usuária por causa de um arquivo órfão no Drive.
  if (!response.ok && response.status !== 404) {
    console.error("[drive] delete falhou:", fileId, response.status, await response.text());
  }
}
