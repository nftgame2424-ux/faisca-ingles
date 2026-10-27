// Itens de estudo e repetição espaçada (caixas de Leitner).
import { UNITS, type Level } from "../data/content";
import { S, commit, today, award, liveStreak } from "./state";

export interface Item { id: string; lv: Level; u: number; k: "w" | "p"; en: string; pt: string; ex: string; exPt: string }

export const ITEMS: Item[] = [];
export const BY_ID: Record<string, Item> = {};
for (const lv of ["A", "B", "C"] as Level[]) {
  UNITS[lv].forEach((u, ui) => {
    u.w.forEach((w, i) => { const it: Item = { id: `${lv}${ui}w${i}`, lv, u: ui, k: "w", en: w[0], pt: w[1], ex: w[2], exPt: w[3] }; ITEMS.push(it); BY_ID[it.id] = it; });
    u.p.forEach((p, i) => { const it: Item = { id: `${lv}${ui}p${i}`, lv, u: ui, k: "p", en: p[0], pt: p[1], ex: p[0], exPt: p[1] }; ITEMS.push(it); BY_ID[it.id] = it; });
  });
}

/** Intervalo em dias para cada caixa. */
export const INTERVALS = [0, 1, 2, 4, 8, 16, 32, 64];

export const sentenceOf = (it: Item) => (it.k === "p" ? it.en : it.ex);
export const sentencePtOf = (it: Item) => (it.k === "p" ? it.pt : it.exPt);
export const isKnown = (it: Item) => { const c = S.cards[it.id]; return !!c && c.b >= 2; };
export const knownCount = (lv?: Level) => ITEMS.filter((it) => (!lv || it.lv === lv) && isKnown(it)).length;
export const dueItems = (lv?: Level) => { const t = today(); return ITEMS.filter((it) => (!lv || it.lv === lv) && S.cards[it.id] && S.cards[it.id].d <= t); };

export function setCard(it: Item, b: number) {
  const t = today();
  S.cards[it.id] = { b, d: t + (b > 0 ? INTERVALS[b] : 0), r: 0, w: 0, f: t };
  commit();
}
export function grade(it: Item, ok: boolean) {
  const t = today();
  const c = S.cards[it.id] || { b: 0, d: t, r: 0, w: 0, f: t };
  if (ok) { c.b = Math.min(c.b + 1, INTERVALS.length - 1); c.r++; c.d = t + INTERVALS[c.b]; }
  else { c.b = 1; c.w++; c.d = t; }
  S.cards[it.id] = c;
  commit();
}
export function nextUnit(lv: Level): number {
  for (let i = 0; i < UNITS[lv].length; i++) if (ITEMS.some((it) => it.lv === lv && it.u === i && !S.cards[it.id])) return i;
  return -1;
}
/** Itens que você mais erra, para revisão direcionada. */
export function hardItems(n = 8): Item[] {
  return ITEMS.filter((it) => S.cards[it.id] && S.cards[it.id].w > 0)
    .sort((a, b) => (S.cards[b.id].w - S.cards[b.id].r * 0.3) - (S.cards[a.id].w - S.cards[a.id].r * 0.3))
    .slice(0, n);
}
export function checkBadges() {
  if (S.sessions >= 1) award("first");
  const st = liveStreak();
  if (st >= 3) award("s3");
  if (st >= 7) award("s7");
  if (st >= 30) award("s30");
  const k = knownCount();
  if (k >= 25) award("w25");
  if (k >= 100) award("w100");
  if (S.best.blitz >= 20) award("blitz");
}

export const rnd = (n: number) => Math.floor(Math.random() * n);
export function shuffle<T>(a: T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = rnd(i + 1); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}
/** Distratores do mesmo nível e tipo, sem repetir o valor certo. */
export function distract(it: Item, f: "en" | "pt", n: number): string[] {
  const seen = new Set([it[f]]);
  const out: string[] = [];
  for (const pool of [ITEMS.filter((x) => x.lv === it.lv && x.k === it.k), ITEMS.filter((x) => x.k === it.k), ITEMS]) {
    for (const x of shuffle(pool)) {
      if (out.length >= n) break;
      if (!seen.has(x[f])) { seen.add(x[f]); out.push(x[f]); }
    }
  }
  return out;
}
/** Itens já vistos do nível (os mais fracos primeiro), completados com novos se faltar. */
export function poolFor(lv: Level, n: number): Item[] {
  const seen = ITEMS.filter((it) => it.lv === lv && S.cards[it.id]).sort((a, b) => S.cards[a.id].b - S.cards[b.id].b);
  let pool = shuffle(seen.slice(0, Math.max(n, 12))).slice(0, n);
  if (pool.length < n) pool = pool.concat(ITEMS.filter((it) => it.lv === lv && !S.cards[it.id]).slice(0, n - pool.length));
  return shuffle(pool);
}
