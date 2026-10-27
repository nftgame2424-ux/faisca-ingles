// Camada de RPG: herói, ouro, baús com raridade, equipamento, missões diárias, loja e chefes.
// Escuta os eventos de estudo (state.emitGame) e transforma treino em recompensa.
import type { IconName } from "../components/Icon";
import { MODES } from "../data/meta";
import { S, award, commit, onGameEvent, setXpMultiplier, today, toast } from "./state";
import type { Gear, HeroClass, Pending, Quest, Slot, Stat } from "./rpgTypes";

const R = () => S.rpg;
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/* ---------------- classes e raridade ---------------- */
export const CLASSES: Record<HeroClass, { n: string; d: string; icon: IconName }> = {
  warrior: { n: "Guerreiro", d: "+1 coração e +20% de dano contra chefes", icon: "sword" },
  mage: { n: "Mago", d: "+10% de XP em todos os treinos", icon: "spark" },
  bard: { n: "Bardo", d: "Falas certas dão dano dobrado e +15% de ouro em treinos de fala", icon: "mic" },
  rogue: { n: "Ladino", d: "+15% de ouro e +3 de sorte nos baús", icon: "coin" }
};
export const RARITY = ["Comum", "Incomum", "Raro", "Épico", "Lendário"];
export const SLOTS: { id: Slot; n: string; icon: IconName }[] = [
  { id: "head", n: "Cabeça", icon: "crown" }, { id: "weapon", n: "Arma", icon: "sword" },
  { id: "armor", n: "Armadura", icon: "shield" }, { id: "amulet", n: "Amuleto", icon: "gem" }, { id: "boots", n: "Botas", icon: "boot" }
];
export const STAT_LABEL: Record<Stat, (v: number) => string> = {
  xp: (v) => `+${v}% XP`, gold: (v) => `+${v}% ouro`, dmg: (v) => `+${v}% dano`, luck: (v) => `+${v} sorte`, hearts: (v) => `+${v} ${v === 1 ? "coração" : "corações"}`
};

const BASES: Record<Slot, string[]> = {
  head: ["Capuz", "Chapéu", "Elmo", "Tiara", "Boné"],
  weapon: ["Espada", "Cajado", "Arco", "Pena", "Microfone"],
  armor: ["Manto", "Armadura", "Colete", "Túnica", "Jaqueta"],
  amulet: ["Amuleto", "Anel", "Pingente", "Talismã", "Broche"],
  boots: ["Botas", "Sandálias", "Tênis", "Sapatilhas"]
};
const THEMES = ["do Phrasal Verb", "do Sotaque Britânico", "da Pronúncia Clara", "do TH Perfeito", "do Present Perfect", "da Revisão Espaçada",
  "do Shadowing", "do Vocabulário", "da Fluência", "do Small Talk", "dos Falsos Cognatos", "do Foco", "da Gramática", "do Ditado", "da Escuta Atenta"];
const LEGENDS: Record<Slot, string[]> = {
  head: ["Coroa de Shakespeare", "Chapéu de Oxford"], weapon: ["Pena de Shakespeare", "Microfone da Rainha"],
  armor: ["Manto do Big Ben", "Armadura de Londres"], amulet: ["Amuleto da Estátua da Liberdade", "Anel de Nova York"],
  boots: ["Botas da Broadway", "Tênis de Hollywood"]
};
const SLOT_STATS: Record<Slot, Stat[]> = { head: ["xp", "luck"], weapon: ["dmg", "xp"], armor: ["hearts", "xp", "dmg"], amulet: ["gold", "xp", "luck"], boots: ["gold", "luck", "dmg"] };
const VAL: Record<Stat, number[]> = { xp: [3, 5, 8, 12, 18], gold: [5, 8, 12, 18, 25], dmg: [5, 10, 15, 25, 40], luck: [1, 2, 3, 5, 8], hearts: [1, 1, 1, 2, 2] };
export const SELL_PRICE = [5, 12, 30, 80, 200];

/* ---------------- nível do herói ---------------- */
const need = (lvl: number) => Math.round(80 * Math.pow(lvl, 1.35));
export function heroLevel(xp = S.xp) {
  let lvl = 1, left = xp;
  while (left >= need(lvl)) { left -= need(lvl); lvl++; }
  return { lvl, into: left, need: need(lvl) };
}

/* ---------------- bônus ---------------- */
export function bonuses() {
  const b: Record<Stat, number> = { xp: 0, gold: 0, dmg: 0, luck: 0, hearts: 0 };
  for (const id of Object.values(R().eq)) {
    const g = R().inv.find((x) => x.id === id);
    if (g) for (const [k, v] of Object.entries(g.st)) b[k as Stat] += v || 0;
  }
  const c = R().cls;
  if (c === "mage") b.xp += 10;
  if (c === "rogue") { b.gold += 15; b.luck += 3; }
  if (c === "warrior") { b.hearts += 1; b.dmg += 20; }
  b.xp = Math.min(b.xp, 60);
  return b;
}
export const potionActive = () => R().xpBoostUntil > Date.now();
setXpMultiplier(() => 1 + bonuses().xp / 100 + (potionActive() ? 0.5 : 0));

const SPEAK_MODES = new Set(["speak", "diction", "twister", "dialog", "chat"]);
export function addGold(n: number, mode?: string): number {
  const mult = 1 + bonuses().gold / 100 + (R().cls === "bard" && mode && SPEAK_MODES.has(mode) ? 0.15 : 0);
  const g = Math.max(1, Math.round(n * mult));
  R().gold += g; R().goldTotal += g;
  commit();
  return g;
}

/* ---------------- baús e itens ---------------- */
function makeGear(r: number, slot: Slot = pick(SLOTS).id): Gear {
  const n = r >= 4 ? pick(LEGENDS[slot]) : `${pick(BASES[slot])} ${pick(THEMES)}`;
  const cands = SLOT_STATS[slot].filter((s) => s !== "hearts" || r >= 2).sort(() => Math.random() - 0.5);
  const count = r >= 4 ? 3 : r >= 2 ? 2 : 1;
  const st: Partial<Record<Stat, number>> = {};
  cands.slice(0, count).forEach((s) => { st[s] = VAL[s][r]; });
  return { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, n, slot, r, st, lvl: heroLevel().lvl, t: Date.now() };
}
/** Sorteia a raridade: quanto melhor o desempenho e a sorte, maior a chance de item raro. Garante um Raro a cada 8 baús. */
function rollRarity(quality: number, minTier = 0): number {
  const luck = bonuses().luck;
  const w = [60, 25, 10, 4, 1].map((x, t) => x * (t >= 1 ? 1 + quality * 0.3 : 1) * (t >= 2 ? 1 + quality * 0.8 + luck * 0.05 : 1));
  let roll = Math.random() * w.reduce((a, b) => a + b, 0);
  let r = 0;
  while (r < 4 && roll >= w[r]) { roll -= w[r]; r++; }
  if (R().sinceRare >= 7) r = Math.max(r, 2);
  if (R().luckNext > 0) { r = Math.min(4, r + 1); R().luckNext--; }
  r = Math.max(r, minTier);
  R().sinceRare = r >= 2 ? 0 : R().sinceRare + 1;
  return r;
}
function addGear(g: Gear) {
  R().inv.unshift(g);
  R().drops++;
  if (R().inv.length > 60) {
    const equipped = new Set(Object.values(R().eq));
    const old = [...R().inv].reverse().find((x) => x.r === 0 && !equipped.has(x.id));
    if (old) { R().inv = R().inv.filter((x) => x !== old); R().gold += SELL_PRICE[0]; }
  }
}
export function rollItem(quality: number, minTier = 0): Gear {
  const g = makeGear(rollRarity(quality, minTier));
  addGear(g);
  if (g.r >= 3) setTimeout(() => award("epic"), 1500);
  commit();
  return g;
}
export function pushPending(p: Pending) { R().pending.push(p); commit(); }
export function popPending() { R().pending.shift(); commit(); }

/* ---------------- equipamento ---------------- */
export function equip(id: string) {
  const g = R().inv.find((x) => x.id === id);
  if (!g) return;
  R().eq[g.slot] = g.id;
  commit();
}
export function unequip(slot: Slot) { delete R().eq[slot]; commit(); }
export function sellGear(id: string) {
  const g = R().inv.find((x) => x.id === id);
  if (!g) return 0;
  for (const s of SLOTS) if (R().eq[s.id] === id) delete R().eq[s.id];
  R().inv = R().inv.filter((x) => x.id !== id);
  R().gold += SELL_PRICE[g.r];
  commit();
  return SELL_PRICE[g.r];
}
export const equippedIn = (slot: Slot) => R().inv.find((x) => x.id === R().eq[slot]);
/** Valor simples de um item, para sugerir o melhor em cada parte do corpo. */
export const gearScore = (g?: Gear) => (g ? Object.entries(g.st).reduce((a, [k, v]) => a + (v || 0) * (k === "hearts" ? 10 : k === "luck" ? 3 : 1), 0) : 0);

/* ---------------- loja ---------------- */
export const SHOP: { id: string; n: string; d: string; price: number; icon: IconName }[] = [
  { id: "chest", n: "Baú de treino", d: "Um item aleatório", price: 60, icon: "chest" },
  { id: "chest_r", n: "Baú raro", d: "Item Raro ou melhor, garantido", price: 220, icon: "chest" },
  { id: "potion", n: "Poção de XP", d: "+50% de XP por 20 minutos", price: 90, icon: "potion" },
  { id: "elixir", n: "Elixir da sorte", d: "O próximo baú sobe uma raridade", price: 120, icon: "star" },
  { id: "shield", n: "Escudo de sequência", d: "Protege sua sequência se faltar um dia (máx. 2)", price: 150, icon: "shield" }
];
export function buy(id: string): boolean {
  const it = SHOP.find((x) => x.id === id);
  if (!it || R().gold < it.price) { toast("Ouro insuficiente. Treine mais um pouco!"); return false; }
  if (id === "shield" && S.shields >= 2) { toast("Você já tem 2 escudos."); return false; }
  R().gold -= it.price;
  if (id === "chest" || id === "chest_r") {
    const g = rollItem(0.6, id === "chest_r" ? 2 : 0);
    pushPending({ kind: "item", title: it.n, sub: "Comprado na loja", gold: 0, item: g });
  } else if (id === "potion") { R().xpBoostUntil = Math.max(Date.now(), R().xpBoostUntil) + 20 * 60000; toast("Poção ativa: +50% de XP por 20 minutos"); }
  else if (id === "elixir") { R().luckNext++; toast("Elixir tomado: o próximo baú vem melhor"); }
  else if (id === "shield") { S.shields++; toast("Escudo de sequência guardado"); }
  commit();
  return true;
}

/* ---------------- missões diárias ---------------- */
const QUESTS: { k: string; n: number[]; text: (n: number) => string; icon: IconName }[] = [
  { k: "correct", n: [15, 20, 30], text: (n) => `Acerte ${n} respostas`, icon: "check" },
  { k: "session", n: [1, 2], text: (n) => (n === 1 ? "Complete 1 treino" : `Complete ${n} treinos`), icon: "spark" },
  { k: "pron", n: [3, 5], text: (n) => `Fale com 80% de clareza ${n} vezes`, icon: "mic" },
  { k: "game", n: [1, 2], text: (n) => (n === 1 ? "Jogue Relâmpago ou Memória" : `Jogue ${n} partidas de Relâmpago ou Memória`), icon: "cards" },
  { k: "dialog", n: [1], text: () => "Complete um diálogo falado", icon: "chat" },
  { k: "warm", n: [1], text: () => "Faça o aquecimento de dicção", icon: "wave" },
  { k: "boss", n: [8, 12], text: (n) => `Acerte ${n} golpes em chefes`, icon: "sword" },
  { k: "story", n: [1], text: () => "Ouça uma história até o fim", icon: "book" }
];
export const questInfo = (q: Quest) => { const d = QUESTS.find((x) => x.k === q.k) || QUESTS[0]; return { text: d.text(q.n), icon: d.icon }; };
function seeded(seed: number) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function ensureQuests() {
  const d = today();
  if (R().questDay === d && R().quests.length) return;
  const rnd = seeded(d * 7919);
  const first = QUESTS[rnd() < 0.5 ? 0 : 1];
  const rest = QUESTS.filter((q) => q !== first && q.k !== (first.k === "correct" ? "session" : "correct")).sort(() => rnd() - 0.5).slice(0, 2);
  R().quests = [first, ...rest].map((q) => ({ k: q.k, n: q.n[Math.floor(rnd() * q.n.length)], prog: 0, claimed: false }));
  R().questDay = d;
  R().questBonus = false;
  commit();
}
export function questProgress(k: string, amt = 1) {
  ensureQuests();
  let changed = false;
  for (const q of R().quests) {
    if (q.k === k && q.prog < q.n) {
      q.prog = Math.min(q.n, q.prog + amt);
      changed = true;
      if (q.prog >= q.n) setTimeout(() => toast(`Missão cumprida: ${questInfo(q).text}. Resgate no Herói!`), 600);
    }
  }
  if (changed) commit();
}
export function claimQuest(i: number) {
  const q = R().quests[i];
  if (!q || q.claimed || q.prog < q.n) return;
  q.claimed = true;
  const gold = addGold(40);
  const g = rollItem(0.75);
  pushPending({ kind: "item", title: "Missão cumprida", sub: questInfo(q).text, gold, item: g });
  if (R().quests.every((x) => x.claimed) && !R().questBonus) {
    R().questBonus = true;
    const bonus = addGold(100);
    const g2 = rollItem(1, 2);
    pushPending({ kind: "item", title: "Todas as missões do dia!", sub: "Baú bônus garantido Raro ou melhor", gold: bonus, item: g2 });
  }
  commit();
}

/* ---------------- chefes ---------------- */
export interface Boss { id: string; lv: "A" | "B" | "C" | null; name: string; title: string; hp: number }
export const BOSSES: Boss[] = [
  { id: "A", lv: "A", name: "Golem do Verbo To Be", title: "Guardião da Vila do Iniciante", hp: 240 },
  { id: "B", lv: "B", name: "Dragão dos Phrasal Verbs", title: "Senhor da Cidade Intermediária", hp: 420 },
  { id: "C", lv: "C", name: "Lich dos Falsos Cognatos", title: "Rei da Cidadela Avançada", hp: 650 },
  { id: "daily", lv: null, name: "Sombra do Esquecimento", title: "Chefe diário: suas revisões e palavras difíceis", hp: 160 }
];
export const REGIONS: Record<"A" | "B" | "C", string> = { A: "Vila do Iniciante", B: "Cidade Intermediária", C: "Cidadela Avançada" };
export const bossMaxHp = (b: Boss) => Math.round(b.hp * (1 + 0.35 * (R().bosses[b.id]?.tier || 0)));
export function bossState(b: Boss) {
  const st = R().bosses[b.id];
  if (b.id === "daily" && st && st.day !== today()) { st.hp = bossMaxHp(b); st.day = today(); }
  if (!st) R().bosses[b.id] = { hp: bossMaxHp(b), tier: 0, wins: 0, day: today() };
  return R().bosses[b.id];
}
export const dailyBossDone = () => R().bosses.daily?.doneDay === today();
export function bossHit(b: Boss, dmg: number) {
  const st = bossState(b);
  st.hp = Math.max(0, st.hp - dmg);
  R().bossHits++;
  commit();
  questProgress("boss");
  return st.hp;
}
export function bossVictory(b: Boss): Pending {
  const st = bossState(b);
  const first = st.wins === 0;
  st.wins++;
  st.tier++;
  st.hp = bossMaxHp(b);
  if (b.id === "daily") st.doneDay = today();
  const gold = addGold(b.id === "daily" ? 80 : 120 + 60 * st.tier);
  const item = rollItem(1, b.id === "daily" ? 2 : first ? 3 : 2);
  const p: Pending = { kind: "victory", title: `${b.name} derrotado!`, sub: first && b.id !== "daily" ? "Primeira vitória: item Épico ou melhor garantido" : "O chefe vai voltar mais forte", gold, item };
  pushPending(p);
  return p;
}
export function heroHearts() { return 3 + bonuses().hearts; }

/* ---------------- recompensas automáticas ---------------- */
const SESSION_KINDS = new Set(["focus", "unit", "listen", "speak", "build", "flash", "gram", "review", "diction"]);
const DROP_KINDS = new Set([...SESSION_KINDS, "blitz", "memory", "story", "warm", "dialog", "chat"]);

onGameEvent((e) => {
  if (!R()) return;
  if (e.type === "correct") questProgress("correct");
  else if (e.type === "pron") { if (e.score >= 0.8) questProgress("pron"); }
  else if (e.type === "xp") {
    const { lvl } = heroLevel();
    if (R().lvlSeen === 0) { R().lvlSeen = lvl; commit(); return; }
    if (lvl > R().lvlSeen) {
      R().lvlSeen = lvl;
      const gold = addGold(20 * lvl);
      const item = rollItem(0.9, lvl % 5 === 0 ? 3 : 1);
      pushPending({ kind: "level", title: `Nível ${lvl}!`, sub: "Seu herói ficou mais forte", gold, item, lvl });
    }
  } else if (e.type === "activity") {
    const { m, o } = e;
    if (SESSION_KINDS.has(m)) questProgress("session");
    if (m === "blitz" || m === "memory") questProgress("game");
    if (m === "dialog") questProgress("dialog");
    if (m === "warm") questProgress("warm");
    if (m === "story") questProgress("story");
    if (m === "boss") return;
    const quality = o.sc != null ? o.sc / 100 : o.n ? (o.ok || 0) / o.n : 0.7;
    const gold = addGold(6 + Math.min(30, (o.ok || 0) * 1.5) + Math.min(10, ((o.dur || 0) / 60000) * 2), m);
    const dropTwister = m === "twister" && quality >= 0.85 && Math.random() < 0.4;
    if ((DROP_KINDS.has(m) && (o.n || 0) > 0) || dropTwister) {
      const item = rollItem(Math.max(0, Math.min(1, quality)));
      pushPending({ kind: "item", title: "Baú de recompensa", sub: MODES[m]?.t || "Treino", gold, item });
    } else if (gold > 0) toast(`+${gold} de ouro`);
  }
});
