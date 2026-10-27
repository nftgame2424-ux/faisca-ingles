// Herói, chefes e itens desenhados em SVG, mais a janela de abrir baú.
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { CLASSES, RARITY, SLOTS, STAT_LABEL, equip, equippedIn, gearScore, popPending } from "../lib/rpg";
import type { Gear, HeroClass, Slot, Stat } from "../lib/rpgTypes";
import { useAppState } from "../lib/state";
import { confetti, sfx, vibrate } from "../lib/fx";

const rc = (r?: number) => (r == null ? "var(--muted)" : `var(--r${r})`);
const CLASS_COLOR: Record<HeroClass | "", string> = { warrior: "#C93542", mage: "#5B4BD6", bard: "#D9822B", rogue: "#2F7D5B", "": "#5D6680" };

export function Avatar({ size = 120 }: { size?: number }) {
  const s = useAppState();
  const eqR = (slot: Slot) => equippedIn(slot)?.r;
  const cls = s.rpg.cls;
  const cape = CLASS_COLOR[cls];
  const armor = eqR("armor"), head = eqR("head"), weapon = eqR("weapon"), boots = eqR("boots"), amulet = eqR("amulet");
  return (
    <svg viewBox="0 0 120 140" width={size} height={size * 140 / 120} className="avatar" role="img" aria-label={`Herói ${s.rpg.name || ""}`}>
      <ellipse cx="60" cy="132" rx="34" ry="6" className="shadow-e" />
      <path d="M34 62 L22 124 H98 L86 62 Z" fill={cape} opacity=".9" />
      <rect x="40" y="58" width="40" height="52" rx="12" fill={armor != null ? rc(armor) : "var(--surface2)"} stroke="var(--ink)" strokeWidth="2.5" />
      <path d="M40 80 H80" stroke="var(--ink)" strokeWidth="2" opacity=".35" />
      {amulet != null && <path d="M60 66 l6 7 -6 7 -6 -7z" fill={rc(amulet)} stroke="var(--ink)" strokeWidth="2" />}
      <rect x="44" y="106" width="13" height="18" rx="4" fill="var(--ink2)" />
      <rect x="63" y="106" width="13" height="18" rx="4" fill="var(--ink2)" />
      <rect x="41" y="118" width="17" height="9" rx="4" fill={boots != null ? rc(boots) : "var(--ink)"} stroke="var(--ink)" strokeWidth="2" />
      <rect x="62" y="118" width="17" height="9" rx="4" fill={boots != null ? rc(boots) : "var(--ink)"} stroke="var(--ink)" strokeWidth="2" />
      <circle cx="60" cy="38" r="20" fill="#F2C9A0" stroke="var(--ink)" strokeWidth="2.5" />
      <circle cx="53" cy="39" r="2.6" fill="#1B1B1B" /><circle cx="67" cy="39" r="2.6" fill="#1B1B1B" />
      <path d="M54 47 q6 5 12 0" stroke="#1B1B1B" strokeWidth="2" fill="none" strokeLinecap="round" />
      {head != null ? (
        cls === "mage" ? <path d="M36 26 L60 -2 L84 26 Z" fill={rc(head)} stroke="var(--ink)" strokeWidth="2.5" />
          : <path d="M39 32 a21 21 0 0 1 42 0 v3 H39z" fill={rc(head)} stroke="var(--ink)" strokeWidth="2.5" />
      ) : <path d="M41 30 a19 16 0 0 1 38 0 q-8 -6 -19 -4 q-11 -2 -19 4z" fill="#5A3A22" />}
      <g stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round">
        {cls === "mage" && <><line x1="94" y1="44" x2="94" y2="124" stroke={weapon != null ? rc(weapon) : "#8A6A4A"} strokeWidth="5" /><circle cx="94" cy="40" r="7" fill={weapon != null ? rc(weapon) : "var(--hi)"} /></>}
        {cls === "warrior" && <><line x1="92" y1="58" x2="92" y2="118" stroke={weapon != null ? rc(weapon) : "#AAB2C5"} strokeWidth="6" /><line x1="84" y1="104" x2="100" y2="104" strokeWidth="4" /></>}
        {cls === "bard" && <><rect x="86" y="64" width="12" height="30" rx="6" fill={weapon != null ? rc(weapon) : "var(--hi)"} /><line x1="92" y1="94" x2="92" y2="118" strokeWidth="4" /></>}
        {cls === "rogue" && <><line x1="90" y1="86" x2="102" y2="64" stroke={weapon != null ? rc(weapon) : "#AAB2C5"} strokeWidth="5" /><line x1="86" y1="90" x2="94" y2="82" strokeWidth="4" /></>}
      </g>
    </svg>
  );
}

export function BossArt({ id, hit }: { id: string; hit?: boolean }) {
  return (
    <svg viewBox="0 0 160 160" className={`boss-art${hit ? " hit" : ""}`} role="img" aria-label="Chefe">
      <ellipse cx="80" cy="150" rx="52" ry="7" className="shadow-e" />
      {id === "A" && (<g stroke="#2A2F3A" strokeWidth="3">
        <rect x="44" y="60" width="72" height="62" rx="10" fill="#8C93A3" />
        <rect x="54" y="22" width="52" height="42" rx="10" fill="#A3AAB8" />
        <rect x="20" y="66" width="26" height="46" rx="9" fill="#7B8292" /><rect x="114" y="66" width="26" height="46" rx="9" fill="#7B8292" />
        <rect x="52" y="120" width="22" height="26" rx="6" fill="#6E7585" /><rect x="86" y="120" width="22" height="26" rx="6" fill="#6E7585" />
        <circle cx="70" cy="42" r="5" fill="#FFD84D" stroke="none" /><circle cx="90" cy="42" r="5" fill="#FFD84D" stroke="none" />
        <path d="M62 84 l10 8 M98 80 l-12 10 M70 104 h20" strokeWidth="3" opacity=".6" />
      </g>)}
      {id === "B" && (<g stroke="#123B35" strokeWidth="3" strokeLinejoin="round">
        <path d="M40 70 L6 40 L22 86 Z" fill="#2E9E85" /><path d="M120 70 L154 40 L138 86 Z" fill="#2E9E85" />
        <ellipse cx="80" cy="100" rx="42" ry="40" fill="#3BB89A" />
        <ellipse cx="80" cy="110" rx="24" ry="24" fill="#BDEBD9" />
        <path d="M52 42 Q80 10 108 42 L104 74 Q80 88 56 74 Z" fill="#3BB89A" />
        <path d="M58 30 L50 12 L66 26 M102 30 L110 12 L94 26" fill="#F5B24A" />
        <circle cx="68" cy="50" r="5" fill="#FF5A3C" stroke="none" /><circle cx="92" cy="50" r="5" fill="#FF5A3C" stroke="none" />
        <path d="M68 68 q12 8 24 0" fill="none" /><path d="M72 70 l3 5 3-5 M84 70 l3 5 3-5" fill="#fff" strokeWidth="1.5" />
      </g>)}
      {id === "C" && (<g stroke="#241A3B" strokeWidth="3">
        <path d="M40 150 L52 84 H108 L120 150 Z" fill="#5B3FA8" />
        <circle cx="80" cy="62" r="34" fill="#EDE6F7" />
        <path d="M50 34 L58 14 L70 30 L80 8 L90 30 L102 14 L110 34 Z" fill="#E8B83A" />
        <ellipse cx="68" cy="62" rx="8" ry="10" fill="#241A3B" /><ellipse cx="92" cy="62" rx="8" ry="10" fill="#241A3B" />
        <circle cx="68" cy="62" r="3" fill="#9CF0FF" stroke="none" /><circle cx="92" cy="62" r="3" fill="#9CF0FF" stroke="none" />
        <path d="M74 80 h12 M70 88 l4 6 4-6 4 6 4-6 4 6" fill="none" />
        <line x1="128" y1="40" x2="128" y2="146" strokeWidth="5" /><circle cx="128" cy="36" r="9" fill="#9CF0FF" />
      </g>)}
      {id === "daily" && (<g stroke="#0A0F1F" strokeWidth="3">
        <path d="M30 140 Q20 70 80 30 Q140 70 130 140 Q118 128 106 140 Q94 128 80 140 Q66 128 54 140 Q42 128 30 140 Z" fill="#3A3F5C" />
        <ellipse cx="64" cy="78" rx="10" ry="7" fill="#FFD84D" stroke="none" /><ellipse cx="96" cy="78" rx="10" ry="7" fill="#FFD84D" stroke="none" />
        <circle cx="64" cy="78" r="3" fill="#0A0F1F" stroke="none" /><circle cx="96" cy="78" r="3" fill="#0A0F1F" stroke="none" />
        <path d="M62 102 q18 -10 36 0" fill="none" stroke="#FFD84D" />
      </g>)}
    </svg>
  );
}

export function GearCard({ g, compact, onClick, equipped }: { g: Gear; compact?: boolean; onClick?: () => void; equipped?: boolean }) {
  const slot = SLOTS.find((x) => x.id === g.slot)!;
  return (
    <button className={`gear r${g.r}${compact ? " compact" : ""}${equipped ? " eq" : ""}`} onClick={onClick} disabled={!onClick}>
      <span className="gear-ic"><Icon n={slot.icon} /></span>
      <span className="gear-body">
        <span className="gear-rar">{RARITY[g.r]} · {slot.n}{equipped ? " · equipado" : ""}</span>
        <b>{g.n}</b>
        {!compact && <span className="gear-st">{Object.entries(g.st).map(([k, v]) => <i key={k}>{STAT_LABEL[k as Stat](v || 0)}</i>)}</span>}
      </span>
    </button>
  );
}

export function ClassBadge({ cls }: { cls: HeroClass | "" }) {
  if (!cls) return null;
  return <span className="class-badge"><Icon n={CLASSES[cls].icon} />{CLASSES[cls].n}</span>;
}

/** Janela global: abre os baús e mostra os prêmios que estão na fila. */
export function LootOverlay() {
  const s = useAppState();
  const p = s.rpg.pending[0];
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [p]);
  useEffect(() => {
    if (open && p) {
      sfx("win"); vibrate([20, 50, 30]);
      if ((p.item?.r ?? 0) >= 2 || p.kind !== "item") confetti();
    }
  }, [open, p]);
  if (!p) return null;
  const cur = p.item ? equippedIn(p.item.slot) : undefined;
  const better = p.item && gearScore(p.item) > gearScore(cur);
  return (
    <div className="loot-layer" role="dialog" aria-modal="true" aria-label={p.title}>
      <div className={`loot ${p.item ? `r${p.item.r}` : ""}${open ? " open" : ""}`}>
        <div className="eyebrow">{p.sub}</div>
        <h2 className="h1 center">{p.title}</h2>
        {!open ? (
          <>
            <button className="chest-big" onClick={() => setOpen(true)} aria-label="Abrir baú"><Icon n={p.kind === "level" ? "star" : "chest"} /></button>
            <button className="btn hi wide" onClick={() => setOpen(true)}>Abrir</button>
          </>
        ) : (
          <>
            {p.kind === "level" && <div className="lvl-big num">{p.lvl}</div>}
            {p.gold > 0 && <div className="gold-line"><Icon n="coin" /> +{p.gold} de ouro</div>}
            {p.item && <div className="rar-label">{RARITY[p.item.r]}</div>}
            {p.item && <GearCard g={p.item} />}
            {p.item && cur && <p className="micro center">Equipado agora: {cur.n}</p>}
            <div className="dual">
              <button className="btn ghost" onClick={popPending}>Guardar</button>
              {p.item ? (
                <button className={`btn ${better ? "primary" : "ghost"}`} onClick={() => { equip(p.item!.id); popPending(); }}>
                  {better ? "Equipar (melhor)" : "Equipar"}
                </button>
              ) : <button className="btn primary" onClick={popPending}>Continuar</button>}
            </div>
            {s.rpg.pending.length > 1 && <p className="micro center">Mais {s.rpg.pending.length - 1} {s.rpg.pending.length - 1 === 1 ? "prêmio" : "prêmios"} esperando</p>}
          </>
        )}
      </div>
    </div>
  );
}
