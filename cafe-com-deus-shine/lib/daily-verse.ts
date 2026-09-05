// Versículos do dia, escolhidos para o Café com Deus Shine — passagens
// sobre identidade, força, descanso e propósito, que conversam com o
// público do ministério. A referência aponta para a Bíblia embutida em
// /public/biblia, então o texto exibido é sempre o do próprio arquivo,
// nunca uma cópia solta que pode divergir.
export type VerseReference = {
  abbrev: string;
  chapter: number;
  verse: number;
};

export const DAILY_VERSES: VerseReference[] = [
  { abbrev: "pv", chapter: 31, verse: 25 },
  { abbrev: "pv", chapter: 31, verse: 30 },
  { abbrev: "sl", chapter: 46, verse: 5 },
  { abbrev: "sl", chapter: 139, verse: 14 },
  { abbrev: "sl", chapter: 23, verse: 1 },
  { abbrev: "sl", chapter: 27, verse: 1 },
  { abbrev: "sl", chapter: 34, verse: 18 },
  { abbrev: "sl", chapter: 37, verse: 4 },
  { abbrev: "sl", chapter: 91, verse: 1 },
  { abbrev: "sl", chapter: 121, verse: 2 },
  { abbrev: "is", chapter: 40, verse: 31 },
  { abbrev: "is", chapter: 41, verse: 10 },
  { abbrev: "is", chapter: 43, verse: 2 },
  { abbrev: "sf", chapter: 3, verse: 17 },
  { abbrev: "jr", chapter: 29, verse: 11 },
  { abbrev: "jr", chapter: 31, verse: 3 },
  { abbrev: "mt", chapter: 11, verse: 28 },
  { abbrev: "mt", chapter: 6, verse: 33 },
  { abbrev: "jo", chapter: 14, verse: 27 },
  { abbrev: "jo", chapter: 15, verse: 5 },
  { abbrev: "rm", chapter: 8, verse: 28 },
  { abbrev: "rm", chapter: 12, verse: 2 },
  { abbrev: "rm", chapter: 15, verse: 13 },
  { abbrev: "fp", chapter: 4, verse: 6 },
  { abbrev: "fp", chapter: 4, verse: 13 },
  { abbrev: "fp", chapter: 1, verse: 6 },
  { abbrev: "ef", chapter: 2, verse: 10 },
  { abbrev: "cl", chapter: 3, verse: 23 },
  { abbrev: "1pe", chapter: 5, verse: 7 },
  { abbrev: "1pe", chapter: 3, verse: 4 },
  { abbrev: "hb", chapter: 11, verse: 1 },
  { abbrev: "tg", chapter: 1, verse: 5 },
  { abbrev: "gl", chapter: 5, verse: 22 },
  { abbrev: "2co", chapter: 12, verse: 9 },
  { abbrev: "2co", chapter: 5, verse: 17 },
  { abbrev: "lm", chapter: 3, verse: 22 },
  { abbrev: "js", chapter: 1, verse: 9 },
  { abbrev: "pv", chapter: 3, verse: 5 },
  { abbrev: "pv", chapter: 4, verse: 23 },
  { abbrev: "pv", chapter: 17, verse: 17 },
  { abbrev: "ec", chapter: 3, verse: 1 },
  { abbrev: "rt", chapter: 1, verse: 16 },
  { abbrev: "et", chapter: 4, verse: 14 },
  { abbrev: "sl", chapter: 16, verse: 8 },
  { abbrev: "sl", chapter: 55, verse: 22 },
  { abbrev: "sl", chapter: 62, verse: 1 },
  { abbrev: "sl", chapter: 73, verse: 26 },
  { abbrev: "sl", chapter: 118, verse: 24 },
  { abbrev: "1ts", chapter: 5, verse: 16 },
  { abbrev: "1jo", chapter: 4, verse: 19 },
];

// Mesmo versículo para todo mundo no mesmo dia, e muda sozinho à meia-noite:
// o índice sai da data, não de sorteio — assim a tela não fica trocando de
// versículo a cada recarga da página.
export function verseOfTheDay(date = new Date()): VerseReference {
  const daysSinceEpoch = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
  return DAILY_VERSES[daysSinceEpoch % DAILY_VERSES.length];
}
