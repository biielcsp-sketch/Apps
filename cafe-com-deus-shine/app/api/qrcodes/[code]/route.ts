import QRCode from "qrcode";

// Q4: QR gerado sempre no servidor — nunca lib client-side pesada. Não
// precisa consultar `enrollment_sources` aqui: o código só codifica a URL
// de destino, e um code inexistente/inativo já cai em "Link expirado" na
// própria rota /cadastro (Q2). O domínio vem da própria requisição, não de
// uma variável de ambiente nova — funciona igual em dev, preview e
// produção sem configuração extra.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const origin = new URL(request.url).origin;
  const targetUrl = `${origin}/cadastro?origem=${encodeURIComponent(code)}`;

  const buffer = await QRCode.toBuffer(targetUrl, {
    type: "png",
    width: 512,
    margin: 2,
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
