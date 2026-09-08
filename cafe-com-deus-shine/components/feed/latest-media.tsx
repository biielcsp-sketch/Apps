import Link from "next/link";
import { Images, ChevronRight } from "lucide-react";
import { MediaCard } from "@/components/mural/media-card";
import { Card } from "@/components/ui/Card";
import type { CafeMedia } from "@/lib/services/cafe-media.service";

// A última publicação do mural, no Feed. É o mesmo cartão da aba Mural —
// curtir, comentar e baixar funcionam igual aqui, sem precisar sair da
// tela. Apagar não: isso é decisão que se toma no mural, com a lista
// inteira à vista.
export function LatestMedia({
  media,
  currentProfileId,
}: {
  media: CafeMedia | null;
  currentProfileId: string | null;
}) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Images size={16} className="text-primary" />
          Mural de fotos
        </p>
        <Link
          href="/mural"
          className="flex shrink-0 items-center gap-0.5 text-sm font-medium text-primary hover:underline"
        >
          Ver tudo
          <ChevronRight size={16} />
        </Link>
      </div>

      {media ? (
        <MediaCard media={media} canDelete={false} currentProfileId={currentProfileId} />
      ) : (
        <p className="text-sm text-muted-foreground">
          O mural ainda está vazio. Assim que alguém publicar, aparece aqui.
        </p>
      )}
    </Card>
  );
}
