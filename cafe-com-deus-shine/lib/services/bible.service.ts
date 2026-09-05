import "server-only";
import { readFile } from "fs/promises";
import path from "path";
import { createClient } from "@/lib/supabase/server";
import { verseOfTheDay, type VerseReference } from "@/lib/daily-verse";
import { AppError, dbError } from "@/lib/errors";

export type BibleBook = { abbrev: string; name: string; chapters: number };
export type BibleChapter = { abbrev: string; name: string; chapter: number; verses: string[] };

// A Bíblia (Almeida, domínio público) fica em /public/biblia, um arquivo
// por livro — o maior tem ~220KB, então só o livro aberto é lido, nunca
// os 3,8MB inteiros.
const BIBLE_DIR = path.join(process.cwd(), "public", "biblia");

export async function listBibleBooks(): Promise<BibleBook[]> {
  const raw = await readFile(path.join(BIBLE_DIR, "index.json"), "utf-8");
  return JSON.parse(raw);
}

export async function getBibleChapter(abbrev: string, chapter: number): Promise<BibleChapter> {
  // O nome do arquivo vem da URL: aceita só o formato das abreviações
  // conhecidas, senão vira caminho arbitrário dentro do servidor.
  if (!/^[a-z0-9]{1,5}$/.test(abbrev)) throw new AppError("Livro inválido.");

  let raw: string;
  try {
    raw = await readFile(path.join(BIBLE_DIR, `${abbrev}.json`), "utf-8");
  } catch {
    throw new AppError("Livro não encontrado.");
  }

  const book = JSON.parse(raw) as { abbrev: string; name: string; chapters: string[][] };
  const index = chapter - 1;
  if (!Number.isInteger(index) || index < 0 || index >= book.chapters.length) {
    throw new AppError("Capítulo não encontrado.");
  }

  return { abbrev: book.abbrev, name: book.name, chapter, verses: book.chapters[index] };
}

export type DailyVerse = VerseReference & { bookName: string; text: string };

export async function getDailyVerse(): Promise<DailyVerse | null> {
  const reference = verseOfTheDay();
  try {
    const chapter = await getBibleChapter(reference.abbrev, reference.chapter);
    const text = chapter.verses[reference.verse - 1];
    if (!text) return null;
    return { ...reference, bookName: chapter.name, text };
  } catch {
    // O versículo do dia é enfeite do Feed — se falhar a leitura, o resto
    // da tela continua de pé.
    return null;
  }
}

export type BibleFavorite = {
  id: string;
  book_abbrev: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
  created_at: string;
};

export async function listMyBibleFavorites(): Promise<BibleFavorite[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bible_favorites")
    .select("id, book_abbrev, book_name, chapter, verse, text, created_at")
    .order("created_at", { ascending: false });

  if (error) dbError(error, "bible.listFavorites");
  return data ?? [];
}

export async function toggleBibleFavorite(input: {
  bookAbbrev: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AppError("Sessão expirada. Faça login novamente.");

  const { data: existing } = await supabase
    .from("bible_favorites")
    .select("id")
    .eq("book_abbrev", input.bookAbbrev)
    .eq("chapter", input.chapter)
    .eq("verse", input.verse)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("bible_favorites").delete().eq("id", existing.id);
    if (error) dbError(error, "bible.unfavorite");
    return { favorited: false };
  }

  const { error } = await supabase.from("bible_favorites").insert({
    profile_id: user.id,
    book_abbrev: input.bookAbbrev,
    book_name: input.bookName,
    chapter: input.chapter,
    verse: input.verse,
    text: input.text,
  });
  if (error) dbError(error, "bible.favorite");
  return { favorited: true };
}
