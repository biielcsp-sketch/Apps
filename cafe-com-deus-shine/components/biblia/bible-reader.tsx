"use client";

import { useEffect, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Play, Square, Heart, Share2 } from "lucide-react";
import { loadChapterAction, toggleFavoriteAction } from "@/app/actions/bible";
import { Card } from "@/components/ui/Card";
import type { BibleBook, BibleChapter, BibleFavorite } from "@/lib/services/bible.service";

const selectClass =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";

type Tab = "biblia" | "favoritos";

export function BibleReader({
  books,
  initialChapter,
  favorites,
}: {
  books: BibleBook[];
  initialChapter: BibleChapter;
  favorites: BibleFavorite[];
}) {
  const [tab, setTab] = useState<Tab>("biblia");
  const [chapter, setChapter] = useState(initialChapter);
  const [favoriteKeys, setFavoriteKeys] = useState(
    () => new Set(favorites.map((f) => `${f.book_abbrev}:${f.chapter}:${f.verse}`)),
  );
  const [pending, startTransition] = useTransition();

  const book = books.find((b) => b.abbrev === chapter.abbrev);
  const chapterCount = book?.chapters ?? 1;

  function go(abbrev: string, number: number) {
    startTransition(async () => {
      const next = await loadChapterAction(abbrev, number);
      setChapter(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Navegação encadeada: passar do último capítulo abre o livro seguinte.
  function step(direction: -1 | 1) {
    const target = chapter.chapter + direction;
    if (target >= 1 && target <= chapterCount) return go(chapter.abbrev, target);

    const index = books.findIndex((b) => b.abbrev === chapter.abbrev);
    const neighbour = books[index + direction];
    if (!neighbour) return;
    go(neighbour.abbrev, direction === 1 ? 1 : neighbour.chapters);
  }

  function toggleFavorite(verseNumber: number, text: string) {
    const key = `${chapter.abbrev}:${chapter.chapter}:${verseNumber}`;
    // Atualiza na hora e deixa o servidor confirmar — favoritar precisa
    // responder no toque, não depois do round-trip.
    setFavoriteKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    startTransition(async () => {
      await toggleFavoriteAction({
        bookAbbrev: chapter.abbrev,
        bookName: chapter.name,
        chapter: chapter.chapter,
        verse: verseNumber,
        text,
      });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {(["biblia", "favoritos"] as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              tab === key
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-foreground"
            }`}
          >
            {key === "biblia" ? "Bíblia" : `Favoritos${favorites.length ? ` (${favorites.length})` : ""}`}
          </button>
        ))}
      </div>

      {tab === "favoritos" ? (
        <FavoritesList favorites={favorites} onOpen={(f) => { setTab("biblia"); go(f.book_abbrev, f.chapter); }} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr]">
            <select
              aria-label="Livro"
              value={chapter.abbrev}
              onChange={(e) => go(e.target.value, 1)}
              className={selectClass}
            >
              {books.map((b) => (
                <option key={b.abbrev} value={b.abbrev}>{b.name}</option>
              ))}
            </select>
            <select
              aria-label="Capítulo"
              value={chapter.chapter}
              onChange={(e) => go(chapter.abbrev, Number(e.target.value))}
              className={selectClass}
            >
              {Array.from({ length: chapterCount }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>Cap. {n}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={pending}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Anterior
            </button>
            <p className="text-sm font-medium text-foreground">
              {chapter.name} {chapter.chapter}
            </p>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={pending}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground disabled:opacity-50"
            >
              Próximo
              <ChevronRight size={16} />
            </button>
          </div>

          <ChapterAudio key={`${chapter.abbrev}:${chapter.chapter}`} chapter={chapter} />

          <Card className="divide-y divide-border p-0">
            {chapter.verses.map((text, index) => {
              const number = index + 1;
              const key = `${chapter.abbrev}:${chapter.chapter}:${number}`;
              return (
                <VerseRow
                  key={key}
                  number={number}
                  text={text}
                  reference={`${chapter.name} ${chapter.chapter}:${number}`}
                  favorited={favoriteKeys.has(key)}
                  onToggleFavorite={() => toggleFavorite(number, text)}
                />
              );
            })}
          </Card>
        </>
      )}
    </div>
  );
}

// Leitura em voz alta pelo próprio navegador (Web Speech API) — sem
// serviço externo, sem custo e funciona offline depois que a página abre.
// O componente é remontado a cada capítulo (via `key` em quem o usa), então
// a leitura anterior é cancelada na limpeza e o estado volta ao início
// sozinho, sem precisar sincronizar nada por efeito.
function ChapterAudio({ chapter }: { chapter: BibleChapter }) {
  const [speaking, setSpeaking] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function toggle() {
    if (!("speechSynthesis" in window)) {
      setUnsupported(true);
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(
      `${chapter.name}, capítulo ${chapter.chapter}. ${chapter.verses.join(" ")}`,
    );
    utterance.lang = "pt-BR";
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  if (unsupported) {
    return (
      <p className="rounded-xl bg-muted px-4 py-3 text-center text-sm text-muted-foreground">
        Seu navegador não consegue ler o capítulo em voz alta.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex items-center justify-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm font-medium text-accent-foreground"
    >
      {speaking ? <Square size={15} /> : <Play size={15} />}
      {speaking ? "Parar leitura" : "Ouvir capítulo"}
    </button>
  );
}

function VerseRow({
  number,
  text,
  reference,
  favorited,
  onToggleFavorite,
}: {
  number: number;
  text: string;
  reference: string;
  favorited: boolean;
  onToggleFavorite: () => void;
}) {
  const [shared, setShared] = useState(false);

  async function share() {
    const payload = `"${text}" — ${reference}`;
    // Compartilhamento nativo no celular; no desktop cai para a área de
    // transferência, que é o que existe lá.
    if (navigator.share) {
      try {
        await navigator.share({ text: payload });
        return;
      } catch {
        // Cancelou o menu de compartilhar — não é erro.
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(payload);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // Sem permissão de área de transferência: o versículo continua na tela.
    }
  }

  return (
    <div className="flex items-start gap-3 p-4">
      <span className="w-6 shrink-0 pt-0.5 text-right text-xs text-muted-foreground">{number}</span>
      <p className="min-w-0 flex-1 text-sm leading-relaxed text-foreground">{text}</p>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={favorited ? "Remover dos favoritos" : "Favoritar versículo"}
          aria-pressed={favorited}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
        >
          <Heart size={16} className={favorited ? "fill-primary text-primary" : ""} />
        </button>
        <button
          type="button"
          onClick={share}
          aria-label="Compartilhar versículo"
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
        >
          <Share2 size={16} className={shared ? "text-primary" : ""} />
        </button>
      </div>
    </div>
  );
}

function FavoritesList({
  favorites,
  onOpen,
}: {
  favorites: BibleFavorite[];
  onOpen: (favorite: BibleFavorite) => void;
}) {
  if (favorites.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          Você ainda não guardou nenhum versículo. Toque no coração ao lado de um versículo
          para salvá-lo aqui.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {favorites.map((favorite) => (
        <button
          key={favorite.id}
          type="button"
          onClick={() => onOpen(favorite)}
          className="rounded-xl border border-border bg-card p-4 text-left hover:bg-muted"
        >
          <p className="text-sm leading-relaxed text-foreground">{favorite.text}</p>
          <p className="mt-2 text-xs font-medium text-primary">
            {favorite.book_name} {favorite.chapter}:{favorite.verse}
          </p>
        </button>
      ))}
    </div>
  );
}
