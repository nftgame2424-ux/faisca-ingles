// Monta as sequências de exercícios de cada sessão.
import { UNITS, type Level, type Quiz, type Unit } from "../data/content";
import type { Sound } from "../data/diction";
import { S, today } from "./state";
import { ITEMS, type Item, poolFor, rnd, shuffle, sentenceOf } from "./srs";

export type ExType =
  | "intro" | "mcqEnPt" | "mcqPtEn" | "mcqAudio" | "flash" | "listen" | "build" | "speak" | "gram"
  | "pairHear" | "pairSay" | "sayWord" | "saySent";

export interface Ex {
  key: number; t: ExType; it?: Item; q?: Quiz; u?: Unit; isNew?: boolean;
  /** dicção */ w?: string; o?: string; sid?: string;
}
export interface RunSpec { seq: Ex[]; title: string; kind: string }

let keySeq = 1;
export const mk = (e: Omit<Ex, "key">): Ex => ({ ...e, key: keySeq++ });

let pending: RunSpec | null = null;
export const setPendingRun = (r: RunSpec) => { pending = r; };
export const takePendingRun = () => pending;

export interface Summary { xp: number; acc: number; combo: number; time: number; early: boolean; chest: boolean; kind: string; title: string }
let lastSummary: Summary | null = null;
export const setSummary = (s: Summary) => { lastSummary = s; };
export const getSummary = () => lastSummary;

export const EX_COUNT: Record<number, number> = { 2: 6, 5: 14, 10: 26, 15: 38 };
export const MAX_NEW: Record<number, number> = { 2: 2, 5: 4, 10: 6, 15: 8 };

export function pickType(it: Item): ExType {
  const c = S.cards[it.id];
  const b = c ? c.b : 0;
  const n = sentenceOf(it).split(/\s+/).length;
  let t: ExType[] = b <= 1 ? ["mcqEnPt", "mcqAudio", "flash", "mcqPtEn"] : b <= 3 ? ["mcqPtEn", "listen", "build", "speak", "mcqAudio"] : ["listen", "build", "speak", "mcqPtEn"];
  if (n < 3 || n > 10) t = t.filter((x) => x !== "build");
  if (it.k === "p") t = t.filter((x) => x !== "mcqAudio");
  return t[rnd(t.length)] || "mcqEnPt";
}

export function planFocus(min: number, lv: Level) {
  const newN = Math.min(MAX_NEW[min] ?? 4, ITEMS.filter((it) => it.lv === lv && !S.cards[it.id]).length);
  const t = today();
  const due = ITEMS.filter((it) => S.cards[it.id] && S.cards[it.id].d <= t).length;
  return { newN, revN: Math.min(due, Math.max(0, (EX_COUNT[min] ?? 14) - newN * 2)) };
}

export function buildFocus(min: number, unit?: { lv: Level; u: number }): RunSpec {
  const lv = unit ? unit.lv : S.level;
  const n = EX_COUNT[min] ?? 14;
  const t = today();
  const inPool = (it: Item) => it.lv === lv && (!unit || it.u === unit.u);
  const due = ITEMS.filter((it) => (unit ? inPool(it) : true) && S.cards[it.id] && S.cards[it.id].d <= t)
    .sort((a, b) => S.cards[a.id].d - S.cards[b.id].d);
  const fresh = ITEMS.filter((it) => inPool(it) && !S.cards[it.id]).slice(0, MAX_NEW[min] ?? 4);
  const revs = shuffle(due.slice(0, Math.max(2, n - fresh.length * 2))).map((it) => mk({ t: pickType(it), it }));
  const seq: Ex[] = [];
  const tests: Ex[] = [];
  for (const it of fresh) {
    seq.push(mk({ t: "intro", it }));
    const r = revs.shift();
    if (r) seq.push(r);
    tests.push(mk({ t: it.k === "p" ? "mcqPtEn" : "mcqEnPt", it, isNew: true }));
  }
  seq.push(...shuffle(tests.concat(revs)));
  if (seq.length < n) {
    const used = new Set(seq.map((e) => e.it?.id));
    const extra = ITEMS.filter((it) => inPool(it) && S.cards[it.id] && !used.has(it.id))
      .sort((a, b) => S.cards[a.id].b - S.cards[b.id].b).slice(0, n - seq.length);
    shuffle(extra).forEach((it) => seq.push(mk({ t: pickType(it), it })));
  }
  const units = UNITS[lv].map((u, ui) => ({ u, ui }))
    .filter(({ ui }) => (!unit || ui === unit.u) && ITEMS.some((it) => it.lv === lv && it.u === ui && S.cards[it.id]));
  const gn = Math.max(1, Math.floor(n / 7));
  for (let k = 0; k < gn && units.length; k++) {
    const { u } = units[rnd(units.length)];
    seq.splice(1 + rnd(seq.length), 0, mk({ t: "gram", q: u.g.q[rnd(u.g.q.length)], u }));
  }
  if (!seq.length) shuffle(ITEMS.filter((it) => it.lv === lv)).slice(0, n).forEach((it) => seq.push(mk({ t: pickType(it), it })));
  return { seq, title: unit ? UNITS[lv][unit.u].t : "Sessão de foco", kind: unit ? "unit" : "focus" };
}

const MODE_TITLES: Record<string, string> = { listen: "Ditado", speak: "Repetir frases", build: "Montar frases", flash: "Flashcards" };
export function buildMode(type: "listen" | "speak" | "build" | "flash"): RunSpec {
  const lv = S.level;
  let items = poolFor(lv, 10);
  if (type === "build") items = poolFor(lv, 30).filter((it) => { const n = sentenceOf(it).split(/\s+/).length; return n >= 3 && n <= 10; }).slice(0, 8);
  if (type === "speak") items = shuffle(poolFor(lv, 5).concat(shuffle(ITEMS.filter((it) => it.lv === lv && it.k === "p")).slice(0, 3))).slice(0, 8);
  return { seq: items.map((it) => mk({ t: type, it })), title: MODE_TITLES[type], kind: type };
}

export function buildGram(lv: Level, ui?: number): RunSpec {
  const idx = ui == null ? UNITS[lv].map((_, i) => i) : [ui];
  const seq: Ex[] = [];
  idx.forEach((i) => UNITS[lv][i].g.q.forEach((q) => seq.push(mk({ t: "gram", q, u: UNITS[lv][i] }))));
  return { seq: ui == null ? shuffle(seq).slice(0, 8) : seq, title: "Gramática", kind: "gram" };
}

export function buildReview(items: Item[]): RunSpec {
  return { seq: shuffle(items).map((it) => mk({ t: pickType(it), it })), title: "Palavras difíceis", kind: "review" };
}

export function buildSound(s: Sound, phase: "hear" | "say" | "sent"): RunSpec {
  const seq: Ex[] = [];
  if (phase === "hear") {
    for (let i = 0; i < 6; i++) {
      const pair = s.pairs[i % s.pairs.length];
      const side = rnd(2);
      seq.push(mk({ t: "pairHear", w: pair[side], o: pair[1 - side], sid: s.id }));
    }
  } else if (phase === "say") {
    if (s.pairs.length) shuffle(s.pairs).slice(0, 6).forEach((p) => { const side = rnd(2); seq.push(mk({ t: "pairSay", w: p[side], o: p[1 - side], sid: s.id })); });
    else s.words.forEach((w) => seq.push(mk({ t: "sayWord", w, sid: s.id })));
  } else {
    s.sentences.forEach((w) => seq.push(mk({ t: "saySent", w, sid: s.id })));
    s.words.slice(0, 2).forEach((w) => seq.push(mk({ t: "sayWord", w, sid: s.id })));
  }
  const titles = { hear: "Escuta", say: "Fale as palavras", sent: "Fale as frases" };
  return { seq, title: `${s.t.split(" (")[0]} · ${titles[phase]}`, kind: "diction" };
}
