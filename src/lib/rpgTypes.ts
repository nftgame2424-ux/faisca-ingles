export type Slot = "head" | "weapon" | "armor" | "amulet" | "boots";
export type Stat = "xp" | "gold" | "dmg" | "luck" | "hearts";
export type HeroClass = "warrior" | "mage" | "bard" | "rogue";

export interface Gear { id: string; n: string; slot: Slot; r: number; st: Partial<Record<Stat, number>>; lvl: number; t: number }
export interface Quest { k: string; n: number; prog: number; claimed: boolean }
export interface Pending { kind: "item" | "level" | "victory"; title: string; sub: string; gold: number; item?: Gear; lvl?: number }
export interface BossState { hp: number; tier: number; wins: number; day?: number; doneDay?: number }

export interface RpgState {
  name: string; cls: HeroClass | ""; gold: number; goldTotal: number;
  inv: Gear[]; eq: Partial<Record<Slot, string>>;
  sinceRare: number; drops: number; lvlSeen: number; xpBoostUntil: number; luckNext: number;
  questDay: number; quests: Quest[]; questBonus: boolean;
  bosses: Record<string, BossState>; pending: Pending[]; bossHits: number;
}

export function freshRpg(): RpgState {
  return {
    name: "", cls: "", gold: 0, goldTotal: 0, inv: [], eq: {}, sinceRare: 0, drops: 0, lvlSeen: 0, xpBoostUntil: 0, luckNext: 0,
    questDay: -1, quests: [], questBonus: false, bosses: {}, pending: [], bossHits: 0
  };
}
