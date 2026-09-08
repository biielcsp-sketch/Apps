import { NextRequest, NextResponse } from "next/server";
import { getMediaFileRef, getLegacySignedUrl } from "@/lib/services/cafe-media.service";
import { fetchFromDrive } from "@/lib/google-drive";

/* ===================================================================
   Serve o arquivo de uma publicação do mural.

   Existe porque o Google Drive não tem URL de imagem estável para
   embutir numa página: o jeito de mostrar é o servidor buscar o conteúdo
   e repassar. De quebra, isso é o que permite checar permissão — a URL
   sozinha não vale nada sem a sessão certa.

   O cabeçalho Range é repassado ao Google e a resposta 206 volta intacta
   para o navegador. É isso que faz o vídeo poder ser adiantado sem
   baixar tudo antes.
   =================================================================== */

// Nunca cachear no CDN: a permissão é por usuária, e resposta guardada no
// meio do caminho vazaria a foto de um café para quem não é dele.
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // A checagem de acesso é o próprio SELECT: a RLS decide se esta usuária
  // enxerga esta publicação. Sem linha, sem arquivo.
  const media = await getMediaFileRef(id).catch(() => null);
  if (!media) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  // Linhas antigas ainda vivem no Storage do Supabase.
  if (!media.drive_file_id && media.storage_path) {
    const signed = await getLegacySignedUrl(media.storage_path);
    if (!signed) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
    return NextResponse.redirect(signed);
  }

  if (!media.drive_file_id) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  const range = request.headers.get("range");
  const upstream = await fetchFromDrive(media.drive_file_id, range);

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json(
      { error: "Não foi possível carregar o arquivo." },
      { status: upstream.status === 404 ? 404 : 502 },
    );
  }

  const headers = new Headers();
  headers.set("content-type", media.mime_type ?? "application/octet-stream");
  // O navegador precisa saber que pode pedir pedaços, senão a barra do
  // vídeo não deixa adiantar.
  headers.set("accept-ranges", "bytes");
  headers.set("cache-control", "private, max-age=300");

  for (const h of ["content-length", "content-range"]) {
    const value = upstream.headers.get(h);
    if (value) headers.set(h, value);
  }

  // ?download=1 troca a exibição pelo salvar-arquivo. É o que o botão de
  // baixar usa.
  if (request.nextUrl.searchParams.get("download") === "1") {
    const name = (media.file_name ?? `cafe-${id}`).replace(/["\\]/g, "");
    headers.set("content-disposition", `attachment; filename="${name}"`);
  }

  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
