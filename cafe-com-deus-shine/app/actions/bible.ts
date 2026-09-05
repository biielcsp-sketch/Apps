"use server";

import { revalidatePath } from "next/cache";
import { getBibleChapter, toggleBibleFavorite } from "@/lib/services/bible.service";
import { toUserMessage } from "@/lib/errors";

// Troca de capítulo sem recarregar a página inteira.
export async function loadChapterAction(abbrev: string, chapter: number) {
  return getBibleChapter(abbrev, chapter);
}

export async function toggleFavoriteAction(input: {
  bookAbbrev: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
}) {
  try {
    const result = await toggleBibleFavorite(input);
    revalidatePath("/biblia");
    return result;
  } catch (e) {
    return { error: toUserMessage(e, "actions.bible.toggleFavorite", "Não foi possível salvar o favorito.") };
  }
}
