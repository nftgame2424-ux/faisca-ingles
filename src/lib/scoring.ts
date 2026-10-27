// Comparação entre o que você falou (ou escreveu) e a frase certa.
import { SOUNDS } from "../data/diction";

export function norm(s: string): string {
  return String(s).toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\bi'm\b/g, "i am").replace(/n't\b/g, " not").replace(/'re\b/g, " are")
    .replace(/'ll\b/g, " will").replace(/'ve\b/g, " have").replace(/'d\b/g, " would")
    .replace(/\bcan not\b/g, "cannot")
    .replace(/\b(\d+)\b/g, (m) => NUM[m] ?? m)
    .replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
}
const NUM: Record<string, string> = { "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten", "25": "twenty five", "28": "twenty eight" };

export function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let p = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const c = [i];
    for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    p = c;
  }
  return p[n];
}
export const sim = (a: string, b: string) => { const L = Math.max(a.length, b.length); return L ? 1 - lev(a, b) / L : 1; };

export interface WordMark { w: string; hit: boolean; near?: boolean }
export interface SpeechScore { score: number; words: WordMark[]; heard: string; conf: number; wrongPair?: string; self?: boolean }

/** Quantas palavras da frase alvo apareceram no que foi reconhecido. */
export function compareWords(said: string, target: string): { score: number; words: WordMark[] } {
  const tw = norm(target).split(" ").filter(Boolean);
  const pool: Record<string, number> = {};
  norm(said).split(" ").filter(Boolean).forEach((x) => { pool[x] = (pool[x] || 0) + 1; });
  let hit = 0;
  const words = tw.map((w) => {
    if (pool[w]) { pool[w]--; hit++; return { w, hit: true }; }
    const near = Object.keys(pool).find((k) => pool[k] > 0 && sim(k, w) >= 0.75);
    if (near) { pool[near]--; hit += 0.6; return { w, hit: true, near: true }; }
    return { w, hit: false };
  });
  return { score: tw.length ? hit / tw.length : 0, words };
}
export function scoreAlts(alts: { t: string; c: number }[], target: string): SpeechScore {
  let best: SpeechScore = { score: -1, words: [], heard: "", conf: 0 };
  for (const a of alts) {
    const r = compareWords(a.t, target);
    if (r.score > best.score) best = { ...r, heard: a.t, conf: a.c };
  }
  return best;
}
/** Par mínimo: saiu a palavra certa ou a vizinha? */
export function pairScore(alts: { t: string; c: number }[], target: string, other: string): SpeechScore {
  const t = norm(target), o = norm(other);
  for (const a of alts) {
    const words = norm(a.t).split(" ");
    if (words.includes(t) || norm(a.t) === t) return { score: 1, words: [{ w: t, hit: true }], heard: a.t, conf: a.c };
  }
  for (const a of alts) {
    const words = norm(a.t).split(" ");
    if (words.includes(o)) return { score: 0, words: [{ w: t, hit: false }], heard: a.t, conf: a.c, wrongPair: other };
  }
  const first = alts[0]?.t || "";
  const s = Math.max(0, ...norm(first).split(" ").map((x) => sim(x, t)));
  return { score: s >= 0.8 ? 0.8 : 0, words: [{ w: t, hit: s >= 0.8, near: s >= 0.8 }], heard: first, conf: alts[0]?.c || 0 };
}

const PATTERNS: [string, RegExp][] = [
  ["th", /th/], ["ed", /[a-z]{2,}ed$/], ["s", /^s[ptkmnlwc]/], ["h", /^h/], ["r", /^r|[bcdfgkpt]r/],
  ["l", /l$|l[bcdfgkmnpstvz]/], ["v", /v/], ["end", /[bdgkpt]$/], ["ih", /i[^aeiou]|ee|ea/], ["ae", /^[^aeiou]*a[^aeiouyrw]/]
];
/** Dicas de dicção para as palavras que não saíram claras (no máximo 2). */
export function tipsFor(words: WordMark[]): { id: string; text: string }[] {
  const missed = words.filter((w) => !w.hit || w.near).map((w) => w.w);
  const out: { id: string; text: string }[] = [];
  for (const [id, re] of PATTERNS) {
    if (out.length >= 2) break;
    if (missed.some((m) => re.test(m))) {
      const s = SOUNDS.find((x) => x.id === id);
      if (s) out.push({ id, text: s.short });
    }
  }
  return out;
}
