import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// S3 (headers de segurança): tentamos primeiro o padrão oficial do Next.js
// (nonce por requisição + 'strict-dynamic', documentado para o App Router) e
// validamos com um browser real (Playwright) antes de subir — quebrou a
// hidratação inteira da aplicação. Duas causas confirmadas: (1) 'strict-dynamic'
// anula 'self' por definição da spec de CSP, então os próprios chunks
// same-origin do Next (/_next/static/chunks/*.js) passaram a ser bloqueados;
// (2) o Next 16.3.3 com Turbopack não propaga o nonce gerado aqui para os
// <script> inline que ele mesmo injeta para hidratação (payload do RSC) —
// eles saem sem nenhum atributo nonce, então não têm como validar contra
// 'nonce-...'. Sem 'strict-dynamic' e sem o nonce nos scripts do próprio
// framework, a única política que efetivamente funciona é 'self' (para os
// chunks, que são todos same-origin — não carregamos nenhum script externo)
// mais 'unsafe-inline' só para o payload de hidratação do Next. Continua
// bem mais estrito que "sem CSP": nenhum script de outra origem passa.
// Mantemos o nonce disponível via `x-nonce` para o dia em que precisarmos
// de um <script> inline autoral — hoje o app não tem nenhum.
function buildCsp(supabaseUrl: string) {
  const supabaseHost = new URL(supabaseUrl).host;
  return `
    default-src 'self';
    script-src 'self' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*.tile.openstreetmap.org https://unpkg.com;
    font-src 'self';
    connect-src 'self' https://${supabaseHost} wss://${supabaseHost};
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();
}

// Cabeçalhos que não dependem do nonce — aplicados em toda resposta,
// inclusive redirects (item 3 do prompt S3).
function applyStaticSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  // Geolocalização é usada (endereço/cidade de participante) — não bloqueamos
  // geral, só câmera/microfone, que o app nunca usa.
  response.headers.set("Permissions-Policy", "camera=(), microphone=()");
  return response;
}

export async function updateSession(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(process.env.NEXT_PUBLIC_SUPABASE_URL!);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: não remova este await. Ele revalida o token e garante que a
  // sessão seja renovada antes de chegar em Server Components/Actions.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublicRoute =
    path === "/login" ||
    path === "/" ||
    path === "/definir-senha" ||
    path === "/criar-acesso" ||
    // Q2 (cadastro público via QR Code): a visitante nunca tem sessão.
    path === "/cadastro";

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return applyStaticSecurityHeaders(NextResponse.redirect(url));
  }

  response.headers.set("Content-Security-Policy", csp);
  return applyStaticSecurityHeaders(response);
}
