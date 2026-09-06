/* ===================================================================
   Café com Deus Shine — landing pública / função de inscrição

   Este é o único lugar do projeto que fala com o banco. A chave
   service_role vive numa variável de ambiente do Netlify e NUNCA sai
   daqui: o navegador só vê o JSON de resposta.

   Sem dependências de propósito — chama a API REST do Supabase por
   fetch. Assim o projeto não precisa de `npm install` nem de build, e o
   deploy é só arrastar a pasta.

   Duas rotas:
     GET  /api/config     -> { open, code, rules }
     POST /api/inscricao  -> { status: "created" | "duplicate" }
   =================================================================== */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DAYS = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];
const PERIODS = ["manha", "tarde", "noite"];
const MAX_TEXT = 2000;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

/* ------------------------- Supabase (REST) ------------------------- */

async function db(path, init = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`supabase ${response.status}: ${detail.slice(0, 300)}`);
  }

  // Um INSERT com Prefer: return=minimal responde 201 sem corpo.
  const body = await response.text();
  return body ? JSON.parse(body) : null;
}

function rpc(name, args) {
  return db(`rpc/${name}`, { method: "POST", body: JSON.stringify(args) });
}

/* ------------------------- Leituras públicas ------------------------- */

// Código da origem de inscrição ativa. `enrollment_sources` não libera
// SELECT para visitante nenhum, por isso a leitura acontece aqui e só o
// código atravessa para o navegador.
async function getActiveCode() {
  const rows = await db(
    "enrollment_sources?select=code&active=is.true&order=created_at.asc&limit=1",
  );
  return rows?.[0]?.code ?? null;
}

async function getRules() {
  const rows = await db("app_config?select=value&key=eq.cafe_rules&limit=1");
  const text = rows?.[0]?.value?.text;
  return typeof text === "string" ? text.trim() : "";
}

async function isCodeValid(code) {
  const rows = await db(
    `enrollment_sources?select=id&active=is.true&code=eq.${encodeURIComponent(code)}&limit=1`,
  );
  return Boolean(rows?.length);
}

async function getTermsVersion() {
  const rows = await db(
    "app_terms_versions?select=version&order=published_at.desc&limit=1",
  );
  return rows?.[0]?.version ?? null;
}

async function findDuplicateByPhone(phone) {
  const rows = await db(
    `participants?select=id&phone=eq.${encodeURIComponent(phone)}&status=neq.inativa&deleted_at=is.null&limit=1`,
  );
  return Boolean(rows?.length);
}

/* ------------------------- Validação ------------------------- */

function str(value, max = 200) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function pickList(value, allowed) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => allowed.includes(item));
}

// Mesmas regras do sistema. O navegador já checou, mas quem manda o POST
// pode ser qualquer um — a barreira de verdade é esta.
function parse(payload) {
  const values = {
    full_name: str(payload.full_name),
    preferred_name: str(payload.preferred_name),
    phone: str(payload.phone, 40),
    whatsapp: str(payload.whatsapp, 40),
    email: str(payload.email, 200).toLowerCase(),
    birth_date: str(payload.birth_date, 10),
    city: str(payload.city),
    neighborhood: str(payload.neighborhood),
    address: str(payload.address, 400),
    availability_days: pickList(payload.availability_days, DAYS),
    availability_period: pickList(payload.availability_period, PERIODS),
    location_preference: str(payload.location_preference, 400),
    home_meeting_ok: payload.home_meeting_ok !== false,
    other_notes: str(payload.other_notes, MAX_TEXT),
    consent_accepted: payload.consent_accepted === true,
    code: str(payload.code, 100),
    website: str(payload.website),
  };

  if (values.full_name.length < 2) return { error: "Informe seu nome completo." };
  if (values.phone.length < 8) return { error: "Informe um telefone válido, com DDD." };
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    return { error: "E-mail inválido." };
  }
  if (values.birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(values.birth_date)) {
    return { error: "Data de nascimento inválida." };
  }
  if (!values.address) return { error: "Informe seu endereço." };
  if (!values.availability_days.length) return { error: "Selecione ao menos um dia disponível." };
  if (!values.availability_period.length) {
    return { error: "Selecione ao menos um período disponível." };
  }
  if (!values.location_preference) return { error: "Informe sua preferência de localização." };
  if (!values.consent_accepted) {
    return { error: "É necessário aceitar os termos para se inscrever." };
  }
  if (!values.code) return { error: "Inscrição indisponível no momento." };

  return { values };
}

/* ------------------------- Rotas ------------------------- */

async function handleConfig() {
  // As regras nunca podem derrubar a página: se a leitura falhar, o
  // formulário continua de pé sem o bloco de regras.
  const [code, rules] = await Promise.all([
    getActiveCode(),
    getRules().catch(() => ""),
  ]);
  return json({ open: Boolean(code), code, rules });
}

async function handleInscricao(request, ip) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Requisição inválida." }, 400);
  }

  const parsed = parse(payload);
  if (parsed.error) return json({ error: parsed.error }, 400);
  const values = parsed.values;

  // 1. Honeypot: só bot preenche esse campo. Responde sucesso genérico —
  // contar que foi descartado só ensinaria o bot a se adaptar.
  if (values.website) {
    return json({ status: "created" });
  }

  // 2. Rate limit por IP, na mesma função do Postgres que o sistema usa.
  // Se o limitador falhar, libera (uma instabilidade do banco não pode
  // travar uma inscrição legítima).
  const allowed = await rpc("app_check_public_enrollment_rate_limit", { p_key: ip }).catch(
    () => true,
  );
  if (allowed === false) {
    return json({ error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." }, 429);
  }

  // 3. O código veio do navegador, então é conferido aqui de novo.
  if (!(await isCodeValid(values.code))) {
    return json({ error: "Inscrição indisponível no momento." }, 400);
  }

  // 4. Duplicata por telefone: a mesma pessoa mandando de novo não vira
  // um segundo cadastro.
  if (await findDuplicateByPhone(values.phone)) {
    return json({ status: "duplicate" });
  }

  const termsVersion = await getTermsVersion().catch(() => null);

  // 5. Payload montado campo a campo — nunca um spread do corpo recebido.
  // status, consent_method e enrollment_source são decididos aqui, jamais
  // vêm do formulário.
  await db("participants", {
    method: "POST",
    headers: { prefer: "return=minimal" },
    body: JSON.stringify({
      full_name: values.full_name,
      preferred_name: values.preferred_name || null,
      phone: values.phone,
      whatsapp: values.whatsapp || null,
      email: values.email || null,
      birth_date: values.birth_date || null,
      city: values.city || null,
      neighborhood: values.neighborhood || null,
      address: values.address,
      availability_days: values.availability_days,
      availability_period: values.availability_period,
      location_preference: values.location_preference,
      home_meeting_ok: values.home_meeting_ok,
      other_notes: values.other_notes || null,
      status: "nova_inscricao",
      consent_accepted_at: new Date().toISOString(),
      consent_version: termsVersion,
      consent_method: "autocadastro",
      enrollment_source: values.code,
    }),
  });

  return json({ status: "created" });
}

/* ------------------------- Entrada ------------------------- */

export default async (request, context) => {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("[api] SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurada");
    return json({ error: "Inscrição indisponível no momento." }, 503);
  }

  const route = new URL(request.url).pathname.split("/").pop();
  const ip = context?.ip || request.headers.get("x-nf-client-connection-ip") || "desconhecido";

  try {
    if (route === "config" && request.method === "GET") {
      return await handleConfig();
    }
    if (route === "inscricao" && request.method === "POST") {
      return await handleInscricao(request, ip);
    }
    return json({ error: "Rota não encontrada." }, 404);
  } catch (error) {
    // O erro real fica no log da função; a visitante recebe só o aviso.
    console.error(`[api:${route}]`, error);
    return json({ error: "Não foi possível concluir agora. Tente novamente." }, 500);
  }
};

export const config = {
  path: ["/api/config", "/api/inscricao"],
};
