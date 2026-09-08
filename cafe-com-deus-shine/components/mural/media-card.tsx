"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Heart, MessageCircle, Send, Trash2 } from "lucide-react";
import {
  toggleLikeAction,
  listCommentsAction,
  addCommentAction,
  deleteCommentAction,
  deleteMediaAction,
} from "@/app/actions/cafe-media";
import type { CafeMedia, CafeMediaComment } from "@/lib/services/cafe-media.service";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function MediaCard({
  media,
  canDelete,
  currentProfileId,
}: {
  media: CafeMedia;
  canDelete: boolean;
  currentProfileId: string | null;
}) {
  const [liked, setLiked] = useState(media.likedByMe);
  const [likeCount, setLikeCount] = useState(media.likeCount);
  const [commentCount, setCommentCount] = useState(media.commentCount);
  const [comments, setComments] = useState<CafeMediaComment[] | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [pending, startTransition] = useTransition();

  if (removed) return null;

  // O coração muda na hora e volta atrás se o servidor recusar — esperar
  // a resposta para pintar deixaria a interação lenta demais para algo
  // que se faz rolando a tela.
  function handleLike() {
    const before = { liked, likeCount };
    setLiked(!liked);
    setLikeCount(likeCount + (liked ? -1 : 1));
    setError(null);

    startTransition(async () => {
      const result = await toggleLikeAction(media.id);
      if ("error" in result) {
        setLiked(before.liked);
        setLikeCount(before.likeCount);
        setError(result.error);
        return;
      }
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    });
  }

  function handleToggleComments() {
    const next = !showComments;
    setShowComments(next);
    if (next && comments === null) {
      startTransition(async () => {
        const result = await listCommentsAction(media.id);
        if ("error" in result) setError(result.error);
        else setComments(result.comments);
      });
    }
  }

  function handleComment(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setError(null);

    startTransition(async () => {
      const result = await addCommentAction(media.id, text);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setComments(result.comments);
      setCommentCount(result.comments.length);
      setDraft("");
    });
  }

  function handleDeleteComment(commentId: string) {
    startTransition(async () => {
      const result = await deleteCommentAction(commentId, media.id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setComments(result.comments);
      setCommentCount(result.comments.length);
    });
  }

  function handleDeleteMedia() {
    if (!confirm("Apagar esta publicação? O arquivo também sai do Drive.")) return;
    startTransition(async () => {
      const result = await deleteMediaAction(media.id);
      if (result.error) setError(result.error);
      else setRemoved(true);
    });
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* O arquivo vem sempre da nossa rota, que confere a permissão antes
          de repassar os bytes do Drive. */}
      {media.mediaType === "video" ? (
        <video
          src={media.url}
          controls
          playsInline
          preload="metadata"
          className="aspect-square w-full bg-muted object-cover"
        />
      ) : (
        // <img> em vez de next/image de propósito: o otimizador do Next
        // teria que baixar cada foto do Drive para reprocessar, dobrando o
        // custo de uma imagem que já vem sob demanda.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.url}
          alt={media.caption ?? "Foto do café"}
          loading="lazy"
          className="aspect-square w-full bg-muted object-cover"
        />
      )}

      <div className="p-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleLike}
            aria-label={liked ? "Descurtir" : "Curtir"}
            aria-pressed={liked}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-muted"
          >
            <Heart
              size={20}
              className={liked ? "text-danger" : ""}
              fill={liked ? "currentColor" : "none"}
            />
            {likeCount > 0 && <span className="tabular-nums">{likeCount}</span>}
          </button>

          <button
            type="button"
            onClick={handleToggleComments}
            aria-label="Comentários"
            aria-expanded={showComments}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-muted"
          >
            <MessageCircle size={20} />
            {commentCount > 0 && <span className="tabular-nums">{commentCount}</span>}
          </button>

          <a
            href={`${media.url}?download=1`}
            download
            aria-label="Baixar"
            className="flex items-center rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-muted"
          >
            <Send size={20} />
          </a>

          {canDelete && (
            <button
              type="button"
              onClick={handleDeleteMedia}
              disabled={pending}
              aria-label="Apagar publicação"
              className="ml-auto flex items-center rounded-lg px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-danger"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {media.caption && (
          <p className="mt-2 whitespace-pre-line text-sm text-foreground">{media.caption}</p>
        )}

        <p className="mt-1.5 text-xs text-muted-foreground">
          {[media.groupName, media.authorName].filter(Boolean).join(" · ")}
          {media.groupName || media.authorName ? " · " : ""}
          {formatDate(media.createdAt)}
        </p>

        {error && <p className="mt-2 text-sm text-danger">{error}</p>}

        {showComments && (
          <div className="mt-4 border-t border-border pt-3">
            {comments === null ? (
              <p className="text-sm text-muted-foreground">Carregando comentários...</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ainda não há comentários. Seja a primeira.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {comments.map((comment) => (
                  <li key={comment.id} className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{comment.authorName ?? "Alguém"}</span>{" "}
                        {comment.body}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(comment.createdAt)}
                      </p>
                    </div>
                    {(canDelete || comment.authorId === currentProfileId) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={pending}
                        aria-label="Apagar comentário"
                        className="shrink-0 rounded p-1 text-muted-foreground hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={handleComment} className="mt-3 flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Escreva um comentário..."
                maxLength={1000}
                className={inputClass}
                aria-label="Escreva um comentário"
              />
              <button
                type="submit"
                disabled={pending || !draft.trim()}
                aria-label="Enviar comentário"
                className="shrink-0 rounded-lg bg-primary px-3 py-2.5 text-primary-foreground disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
}
