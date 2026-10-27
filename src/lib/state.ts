// Estado do app: um objeto salvo no aparelho (localStorage) e um hook para a interface reagir às mudanças.
import { useSyncExternalStore } from "react";
import type { Level } from "../data/content";
import { BADGES } from "../data/meta";
import { freshRpg, type RpgState } from "./rpgTypes";

export interface Card { b: number; d: number; r: number; w: number; f: number }
export interface LogEntry { t: number; d: number; m: string; xp: number; ok: number; n: number; dur: number; nw?: number; sc?: number }
export interface PronEntry { t: number; d: number; k: string; id: string; s: number; x: string }
export interface Settings {
  accent: string; voice: string; rate: number; min: number; goal: number;
  sfx: boolean; vib: boolean; autoVoice: boolean; aiKey: string; aiModel: string;
}
export interface AppState {
  v: number; updated: number; xp: number; streak: number; bestStreak: number; shields: number;
  lastDay: number | null; days: Record<string, number>; level: Level; onboarded: boolean;
  cards: Record<string, Card>; sessions: number; best: { blitz: number };
  memBest: Record<string, number>; twBest: Record<string, number>; pron: Record<string, number[]>;
  pronLog: PronEntry[]; log: LogEntry[]; badges: string[]; intention: string; settings: Settings;
  rpg: RpgState;
}

const KEY = "faisca.v2";

export function freshState(): AppState {
  return {
    v: 2, updated: 0, xp: 0, streak: 0, bestStreak: 0, shields: 1, lastDay: null, days: {}, level: "A",
    onboarded: false, cards: {}, sessions: 0, best: { blitz: 0 }, memBest: {}, twBest: {}, pron: {},
    pronLog: [], log: [], badges: [], intention: "",
    settings: { accent: "en-US", voice: "", rate: 0.95, min: 5, goal: 50, sfx: true, vib: true, autoVoice: true, aiKey: "", aiModel: "claude-opus-5-5" },
    rpg: freshRpg()
  };
}

export function mergeState(o: Partial<AppState> | null | undefined): AppState {
  const f = freshState();
  if (!o || typeof o !== "object") return f;
  const s = { ...f, ...o } as AppState;
  s.settings = { ...f.settings, ...(o.settings || {}) };
  s.best = { ...f.best, ...(o.best || {}) };
  s.rpg = { ...f.rpg, ...(o.rpg || {}) };
  for (const k of ["cards", "days", "memBest", "twBest", "pron"] as const) s[k] = (o[k] as never) || {};
  for (const k of ["badges", "log", "pronLog"] as const) s[k] = Array.isArray(o[k]) ? (o[k] as never) : [];
  for (const c of Object.values(s.cards)) if (c.f == null) c.f = c.d;
  return s;
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem("faisca.v1");
    return mergeState(raw ? JSON.parse(raw) : null);
  } catch {
    return freshState();
  }
}

export let S: AppState = load();
let version = 0;
const subs = new Set<() => void>();

export function commit() {
  S.updated = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* armazenamento cheio ou bloqueado */ }
  version++;
  subs.forEach((f) => f());
}
export function replaceState(next: AppState) { S = next; commit(); }
export function useAppState(): AppState {
  useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => version);
  return S;
}

/* ---- datas: dias contados no fuso local ---- */
export function today(): number {
  const d = new Date();
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
}
export function dateOf(n: number): Date {
  return new Date(n * 86400000 + new Date().getTimezoneOffset() * 60000);
}
const WD = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MO = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
export const weekdayShort = (n: number) => WD[dateOf(n).getDay()];
export function dayLabel(n: number): string {
  const t = today();
  if (n === t) return "Hoje";
  if (n === t - 1) return "Ontem";
  const d = dateOf(n);
  return `${WD[d.getDay()]}, ${d.getDate()} ${MO[d.getMonth()]}`;
}
export function fmtDuration(ms: number): string {
  const m = Math.round(ms / 60000);
  if (m < 1) return ms > 0 ? "< 1 min" : "0 min";
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}`;
}
export const fmtClock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/* ---- toast ---- */
let toastMsg = "";
let toastVer = 0;
const toastSubs = new Set<() => void>();
let toastTimer: number | undefined;
export function toast(msg: string) {
  toastMsg = msg; toastVer++;
  toastSubs.forEach((f) => f());
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toastMsg = ""; toastVer++; toastSubs.forEach((f) => f()); }, 2600);
}
export function useToast(): string {
  useSyncExternalStore((cb) => { toastSubs.add(cb); return () => toastSubs.delete(cb); }, () => toastVer);
  return toastMsg;
}

/* ---- progresso ---- */
export function liveStreak(): number {
  if (S.lastDay == null) return 0;
  const g = today() - S.lastDay;
  if (g <= 1) return S.streak;
  if (g === 2 && S.shields > 0) return S.streak;
  return 0;
}
function touchStreak() {
  const t = today();
  if (S.lastDay === t) return;
  const g = S.lastDay == null ? null : t - S.lastDay;
  if (g === 1) S.streak++;
  else if (g === 2 && S.shields > 0) { S.shields--; S.streak++; setTimeout(() => toast("Escudo usado: sua sequência foi protegida"), 400); }
  else S.streak = 1;
  S.lastDay = t;
  S.bestStreak = Math.max(S.bestStreak, S.streak);
  if (S.streak > 0 && S.streak % 7 === 0 && S.shields < 2) { S.shields++; setTimeout(() => toast("Você ganhou um escudo de sequência"), 2800); }
}
/* ---- eventos do jogo (o módulo de RPG escuta daqui, sem import circular) ---- */
export type GameEvent =
  | { type: "xp" }
  | { type: "correct" }
  | { type: "pron"; score: number; kind: string }
  | { type: "activity"; m: string; o: { xp?: number; ok?: number; n?: number; dur?: number; sc?: number } };
const gameListeners: ((e: GameEvent) => void)[] = [];
export const onGameEvent = (f: (e: GameEvent) => void) => { gameListeners.push(f); };
export const emitGame = (e: GameEvent) => gameListeners.forEach((f) => f(e));
let xpMultiplier = () => 1;
export const setXpMultiplier = (f: () => number) => { xpMultiplier = f; };

/** Soma XP (com os bônus do herói) e devolve quanto foi somado de fato. */
export function addXP(n: number): number {
  if (n <= 0) return 0;
  const g = Math.round(n * xpMultiplier());
  S.xp += g;
  const t = today();
  S.days[t] = (S.days[t] || 0) + g;
  touchStreak();
  commit();
  emitGame({ type: "xp" });
  return g;
}
export function award(id: string) {
  if (S.badges.includes(id)) return;
  S.badges.push(id);
  commit();
  const b = BADGES.find((x) => x.id === id);
  if (b) setTimeout(() => toast(`Conquista: ${b.t}`), 900);
}
export function logSession(m: string, o: { xp?: number; ok?: number; n?: number; dur?: number; nw?: number; sc?: number }) {
  S.log.push({ t: Date.now(), d: today(), m, xp: o.xp || 0, ok: o.ok || 0, n: o.n || 0, dur: Math.max(0, Math.round(o.dur || 0)), nw: o.nw, sc: o.sc });
  if (S.log.length > 800) S.log = S.log.slice(-800);
  commit();
  emitGame({ type: "activity", m, o });
}
export function recordPron(kind: string, id: string, score: number, text: string) {
  const s = Math.round(score * 100);
  S.pronLog.push({ t: Date.now(), d: today(), k: kind, id, s, x: text.slice(0, 90) });
  if (S.pronLog.length > 500) S.pronLog = S.pronLog.slice(-500);
  if (kind === "som") {
    const arr = (S.pron[id] = S.pron[id] || []);
    arr.push(s);
    if (arr.length > 40) arr.splice(0, arr.length - 40);
  }
  commit();
  award("mic");
  emitGame({ type: "pron", score, kind });
}
