// Telas do RPG: mapa do mundo, herói (equipamento, inventário, missões), loja e batalha contra chefes.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { LV, UNITS, type Level } from "../data/content";
import { Icon } from "../components/Icon";
import { AppBar, SettingsButton, SpeakBtn } from "../components/ui";
import { Avatar, BossArt, ClassBadge, GearCard } from "../components/Hero";
import { Exercise } from "./Exercises";
import {
  BOSSES, CLASSES, REGIONS, RARITY, SELL_PRICE, SHOP, SLOTS, STAT_LABEL, addGold, bonuses, bossHit, bossMaxHp, bossState, bossVictory,
  buy, claimQuest, dailyBossDone, ensureQuests, equip, equippedIn, gearScore, heroHearts, heroLevel, potionActive, pushPending,
  questInfo, rollItem, sellGear, unequip
} from "../lib/rpg";
import type { HeroClass, Slot, Stat } from "../lib/rpgTypes";
import { ITEMS, dueItems, grade, hardItems, isKnown, poolFor, rnd, shuffle } from "../lib/srs";
import { mk, type Ex, type ExType } from "../lib/session";
import { S, addXP, award, commit, emitGame, logSession, toast, useAppState } from "../lib/state";
import { say, stopSpeaking } from "../lib/speech";
import { sfx, vibrate } from "../lib/fx";

/* ---------------- criação do herói ---------------- */
export function HeroCreate() {
  const s = useAppState();
  const nav = useNavigate();
  const [name, setName] = useState(s.rpg.name);
  const [cls, setCls] = useState<HeroClass | "">(s.rpg.cls);
  return (
    <>
      <AppBar back eyebrow="Novo herói" title="Crie seu herói" />
      <p className="muted">Cada treino vira aventura: você ganha ouro, abre baús, equipa itens e enfrenta chefes acertando inglês.</p>
      <label className="stack-s"><b>Nome do herói</b>
        <input id="hero-name" className="field" type="text" maxLength={18} placeholder="Ex.: Gabe, o Fluente" value={name} onChange={(e) => setName(e.target.value)} /></label>
      <b>Classe</b>
      <div className="stack">
        {(Object.keys(CLASSES) as HeroClass[]).map((c) => (
          <button key={c} className={`lvl${cls === c ? " on" : ""}`} onClick={() => setCls(c)}>
            <span className="row"><Icon n={CLASSES[c].icon} /><b>{CLASSES[c].n}</b></span><small>{CLASSES[c].d}</small>
          </button>
        ))}
      </div>
      <button className="btn primary wide" disabled={!name.trim() || !cls} onClick={() => {
        const first = !S.rpg.cls;
        S.rpg.name = name.trim(); S.rpg.cls = cls; commit();
        if (first) {
          const g = rollItem(0.5, 1);
          pushPending({ kind: "item", title: "Equipamento inicial", sub: `Boa sorte, ${S.rpg.name}!`, gold: 0, item: g });
        }
        nav("/hero", { replace: true });
      }}>Começar a aventura</button>
    </>
  );
}

/* ---------------- tela do herói ---------------- */
export function HeroScreen() {
  const s = useAppState();
  const nav = useNavigate();
  const [slotSel, setSlotSel] = useState<Slot | null>(null);
  const [itemSel, setItemSel] = useState<string | null>(null);
  useEffect(() => { ensureQuests(); }, []);
  if (!s.rpg.cls) return <Navigate to="/hero/new" replace />;
  const lv = heroLevel();
  const b = bonuses();
  const inv = [...s.rpg.inv].sort((x, y) => y.r - x.r || gearScore(y) - gearScore(x));
  const equipped = new Set(Object.values(s.rpg.eq));
  const sel = s.rpg.inv.find((x) => x.id === itemSel);
  const daily = BOSSES[3];
  return (
    <>
      <AppBar eyebrow="Herói" title={s.rpg.name} right={<SettingsButton />} />
      <section className="card hero-card">
        <Avatar size={104} />
        <div className="grow stack-s">
          <ClassBadge cls={s.rpg.cls} />
          <b className="h2">Nível {lv.lvl}</b>
          <div className="pbar xp"><i style={{ width: `${(lv.into / lv.need) * 100}%` }} /></div>
          <span className="micro num">{lv.into} / {lv.need} XP para o nível {lv.lvl + 1}</span>
          <span className="gold-chip"><Icon n="coin" /> <b className="num">{s.rpg.gold}</b> ouro</span>
          {potionActive() && <span className="micro accent">Poção de XP ativa</span>}
        </div>
      </section>
      <div className="chips">
        {(["xp", "gold", "dmg", "luck"] as Stat[]).filter((k) => b[k] > 0).map((k) => <span key={k} className="stat-chip">{STAT_LABEL[k](b[k])}</span>)}
        <span className="stat-chip"><Icon n="heart" /> {heroHearts()} corações</span>
      </div>

      <div className="sec-h"><h2 className="h2">Missões de hoje</h2><span className="micro">renovam à meia-noite</span></div>
      <div className="stack">
        {s.rpg.quests.map((q, i) => {
          const info = questInfo(q);
          const done = q.prog >= q.n;
          return (
            <div key={i} className={`quest${q.claimed ? " claimed" : done ? " done" : ""}`}>
              <span className="ti"><Icon n={info.icon} /></span>
              <div className="grow"><b>{info.text}</b><div className="pbar"><i style={{ width: `${(q.prog / q.n) * 100}%` }} /></div><small className="num">{q.prog}/{q.n}</small></div>
              {q.claimed ? <Icon n="check" /> : <button className="btn hi sm" disabled={!done} onClick={() => claimQuest(i)}>Resgatar</button>}
            </div>
          );
        })}
      </div>
      <p className="micro">Cumpra as 3 para ganhar um baú bônus Raro ou melhor.</p>

      <button className="boss-card" onClick={() => nav("/boss/daily")}>
        <BossArt id="daily" />
        <div className="grow"><span className="eyebrow">Chefe diário</span><b>{daily.name}</b>
          <small>{dailyBossDone() ? "Derrotado hoje. Volta amanhã." : "Lute com suas revisões e palavras difíceis"}</small></div>
        <Icon n="sword" />
      </button>

      <h2 className="h2">Equipamento</h2>
      <div className="slots">
        {SLOTS.map((sl) => {
          const g = equippedIn(sl.id);
          return (
            <button key={sl.id} className={`slot${g ? ` r${g.r}` : ""}${slotSel === sl.id ? " sel" : ""}`} onClick={() => setSlotSel(slotSel === sl.id ? null : sl.id)}>
              <Icon n={sl.icon} /><span>{sl.n}</span><small>{g ? RARITY[g.r] : "vazio"}</small>
            </button>
          );
        })}
      </div>
      {slotSel && (
        <section className="card stack">
          <div className="sec-h"><b className="h3">{SLOTS.find((x) => x.id === slotSel)!.n}</b>
            {equippedIn(slotSel) && <button className="link" onClick={() => { unequip(slotSel); }}>Remover</button>}</div>
          {inv.filter((g) => g.slot === slotSel).length === 0 ? <p className="micro">Nenhum item desse tipo ainda. Treine para ganhar baús!</p> :
            inv.filter((g) => g.slot === slotSel).map((g) => <GearCard key={g.id} g={g} equipped={equipped.has(g.id)} onClick={() => { equip(g.id); sfx("tap"); }} />)}
        </section>
      )}

      <div className="sec-h"><h2 className="h2">Mochila</h2><span className="micro num">{s.rpg.inv.length}/60</span></div>
      {inv.length === 0 ? <p className="micro">Vazia. Termine um treino para ganhar o primeiro baú.</p> : (
        <div className="inv">
          {inv.map((g) => (
            <button key={g.id} className={`inv-it r${g.r}${equipped.has(g.id) ? " eq" : ""}${itemSel === g.id ? " sel" : ""}`} onClick={() => setItemSel(itemSel === g.id ? null : g.id)} aria-label={g.n}>
              <Icon n={SLOTS.find((x) => x.id === g.slot)!.icon} />
              {equipped.has(g.id) && <span className="eqdot" />}
            </button>
          ))}
        </div>
      )}
      {sel && (
        <section className="card stack">
          <GearCard g={sel} equipped={equipped.has(sel.id)} />
          <div className="dual">
            <button className="btn ghost" onClick={() => { const p = sellGear(sel.id); setItemSel(null); toast(`Vendido por ${p} de ouro`); }}>Vender · {SELL_PRICE[sel.r]} <Icon n="coin" /></button>
            <button className="btn primary" disabled={equipped.has(sel.id)} onClick={() => { equip(sel.id); sfx("tap"); }}>{equipped.has(sel.id) ? "Equipado" : "Equipar"}</button>
          </div>
        </section>
      )}

      <div className="tiles">
        <button className="tile" onClick={() => nav("/shop")}><span className="ti y"><Icon n="bag" /></span><div><b>Loja</b><small>Baús, poções e escudos</small></div></button>
        <button className="tile" onClick={() => nav("/history")}><span className="ti"><Icon n="chart" /></span><div><b>Diário</b><small>Seu histórico de estudo</small></div></button>
      </div>
      <button className="link self-start" onClick={() => nav("/hero/new")}>Mudar nome ou classe</button>
    </>
  );
}

/* ---------------- loja ---------------- */
export function Shop() {
  const s = useAppState();
  return (
    <>
      <AppBar back="/hero" eyebrow="Loja" title="Gaste seu ouro" right={<span className="gold-chip big"><Icon n="coin" /><b className="num">{s.rpg.gold}</b></span>} />
      <div className="stack">
        {SHOP.map((it) => (
          <div key={it.id} className="shop-it">
            <span className="ti y"><Icon n={it.icon} /></span>
            <div className="grow"><b>{it.n}</b><small>{it.d}</small></div>
            <button className="btn hi sm" disabled={s.rpg.gold < it.price} onClick={() => { if (buy(it.id)) sfx("ok"); }}><Icon n="coin" /> {it.price}</button>
          </div>
        ))}
      </div>
      <p className="micro">Você ganha ouro acertando respostas, terminando treinos, cumprindo missões e vencendo chefes. Itens repetidos dá para vender na mochila.</p>
    </>
  );
}

/* ---------------- mapa do mundo (trilha) ---------------- */
const XS = [50, 26, 50, 74];
export function World() {
  const s = useAppState();
  const nav = useNavigate();
  const params = useParams();
  const lv = (params.lv as Level) || s.level;
  const units = UNITS[lv];
  const boss = BOSSES.find((x) => x.lv === lv)!;
  const bst = bossState(boss);
  const nodes = units.map((u, i) => {
    const its = ITEMS.filter((it) => it.lv === lv && it.u === i);
    const k = its.filter(isKnown).length;
    const seen = its.filter((it) => s.cards[it.id]).length;
    const stars = k === its.length ? 3 : k >= its.length * 0.5 ? 2 : seen > 0 ? 1 : 0;
    return { u, i, stars, seen, total: its.length };
  });
  const nextI = nodes.findIndex((n) => n.seen < n.total);
  const ROW = 112;
  const pts = [...nodes.map((_, i) => ({ x: XS[i % 4], y: 56 + i * ROW })), { x: 50, y: 56 + nodes.length * ROW + 30 }];
  const height = pts[pts.length - 1].y + 120;
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
  return (
    <>
      <AppBar eyebrow="Mundo" title={REGIONS[lv]} />
      <div className="seg" role="tablist">
        {(["A", "B", "C"] as Level[]).map((l) => (
          <button key={l} role="tab" aria-selected={l === lv} className={l === lv ? "on" : ""} onClick={() => nav(`/path/${l}`, { replace: true })}>
            {LV[l].name}<small>{LV[l].cefr}</small>
          </button>
        ))}
      </div>
      <div className="row between">
        <p className="micro">{nodes.reduce((a, n) => a + n.stars, 0)} de {nodes.length * 3} estrelas</p>
        {s.level === lv ? <span className="micro accent">Sua região atual</span>
          : <button className="link" onClick={() => { S.level = lv; commit(); toast(`Nível atual: ${LV[lv].name}`); }}>Viajar para cá</button>}
      </div>
      <div className="map" style={{ height }}>
        <svg className="map-path" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
          <path d={path} vectorEffect="non-scaling-stroke" />
        </svg>
        {nodes.map((n, idx) => (
          <button key={n.i} className={`node${n.stars === 3 ? " done" : ""}${idx === nextI ? " next" : ""}`} style={{ left: `${pts[idx].x}%`, top: pts[idx].y }}
            onClick={() => nav(`/unit/${lv}/${n.i}`)} aria-label={`Unidade ${n.i + 1}: ${n.u.t}`}>
            <span className="node-c">{n.stars === 3 ? <Icon n="check" /> : n.i + 1}</span>
            <span className="node-stars">{[0, 1, 2].map((k) => <Icon key={k} n="star" size={13} />).map((el, k) => <span key={k} className={k < n.stars ? "on" : ""}>{el}</span>)}</span>
            <span className="node-t">{n.u.t}</span>
          </button>
        ))}
        <button className="node boss" style={{ left: "50%", top: pts[pts.length - 1].y }} onClick={() => nav(`/boss/${boss.id}`)} aria-label={`Chefe: ${boss.name}`}>
          <BossArt id={boss.id} />
          <span className="node-t"><b>{boss.name}</b></span>
          <span className="hpbar sm"><i style={{ width: `${(bst.hp / bossMaxHp(boss)) * 100}%` }} /></span>
          <span className="micro">{bst.wins ? `Vencido ${bst.wins}x · nível ${bst.tier + 1}` : "Ainda não vencido"}</span>
        </button>
      </div>
    </>
  );
}

/* ---------------- batalha contra chefe ---------------- */
function bossPool(id: string, lv: Level | null) {
  if (id === "daily") {
    const due = dueItems();
    const pool = shuffle([...due, ...hardItems(10)]).filter((x, i, a) => a.indexOf(x) === i);
    return pool.length >= 6 ? pool : pool.concat(poolFor(S.level, 12 - pool.length));
  }
  return poolFor(lv!, 24);
}
export function BossBattle() {
  const nav = useNavigate();
  const { id } = useParams();
  const boss = BOSSES.find((x) => x.id === id) || BOSSES[0];
  const s = useAppState();
  const seq = useMemo(() => {
    const items = bossPool(boss.id, boss.lv);
    const types: ExType[] = ["mcqEnPt", "mcqPtEn", "mcqAudio", "listen", "speak", "mcqEnPt"];
    const out: Ex[] = [];
    for (let k = 0; k < 60; k++) {
      const it = items[k % items.length];
      let t = types[rnd(types.length)];
      if (t === "mcqAudio" && it.k === "p") t = "mcqPtEn";
      out.push(mk({ t, it }));
    }
    return out;
  }, [boss.id, boss.lv]);
  const maxHearts = useMemo(() => heroHearts(), []);
  const [hearts, setHearts] = useState(maxHearts);
  const [hp, setHp] = useState(() => bossState(boss).hp);
  const [i, setI] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hit, setHit] = useState(0);
  const [hurt, setHurt] = useState(0);
  const [floats, setFloats] = useState<{ k: number; v: number; crit: boolean }[]>([]);
  const [fb, setFb] = useState<null | { ok: boolean; detail?: ReactNode; target?: string }>(null);
  const [result, setResult] = useState<null | "win" | "retreat">(null);
  const dealt = useRef(0);
  const hits = useRef(0);
  const start = useRef(Date.now());
  const auto = useRef<number | undefined>(undefined);
  useEffect(() => () => { clearTimeout(auto.current); stopSpeaking(); }, []);
  if (!s.rpg.cls) return <Navigate to="/hero/new" replace />;
  const max = bossMaxHp(boss);
  const ex = seq[i % seq.length];

  function end(kind: "win" | "retreat") {
    clearTimeout(auto.current);
    setFb(null);
    setResult(kind);
    logSession("boss", { xp: 0, ok: hits.current, n: hits.current + (maxHearts - hearts), dur: Date.now() - start.current });
    if (kind === "win") { bossVictory(boss); award("boss"); }
  }
  function next() { clearTimeout(auto.current); setFb(null); setI(i + 1); window.scrollTo(0, 0); }
  function onAnswer(ok: boolean, detail?: ReactNode, target?: string) {
    if (fb || result) return;
    if (ex.it) grade(ex.it, ok);
    if (ok) {
      const bn = bonuses();
      const speakCrit = ex.t === "speak";
      const luckyCrit = Math.random() < 0.06 + bn.luck * 0.01;
      const crit = speakCrit || luckyCrit;
      const mult = crit ? (speakCrit && S.rpg.cls === "bard" ? 2 : 1.6) : 1;
      const dmg = Math.round(18 * (1 + bn.dmg / 100) * (1 + Math.min(combo, 5) * 0.1) * mult);
      const left = bossHit(boss, dmg);
      dealt.current += dmg; hits.current++;
      setHp(left); setCombo(combo + 1); setHit((h) => h + 1);
      setFloats((f) => [...f.slice(-3), { k: Date.now(), v: dmg, crit }]);
      addXP(8); addGold(2, "boss"); emitGame({ type: "correct" });
      sfx("ok"); vibrate(crit ? [20, 30, 40] : 20);
      if (left <= 0) { setTimeout(() => end("win"), 500); return; }
    } else {
      setCombo(0); setHurt((h) => h + 1); sfx("bad"); vibrate([40, 30, 40]);
      const h = hearts - 1;
      setHearts(h);
      if (h <= 0) { setTimeout(() => end("retreat"), 700); return; }
    }
    const tgt = target || ex.it?.en;
    if (!ok && tgt) say(tgt);
    setFb({ ok, detail, target: tgt });
    if (ok && ex.t !== "speak") auto.current = window.setTimeout(next, 900);
  }

  if (result) return (
    <>
      <div className="hero-done">
        <BossArt id={boss.id} />
        <div className="eyebrow">{boss.title}</div>
        <div className="h1">{result === "win" ? "Vitória!" : "Você recuou"}</div>
        <p className="muted">{result === "win" ? `Você derrubou ${boss.name}. Abra o baú!` : `${boss.name} ficou com ${bossState(boss).hp} de ${max} de vida. O dano fica salvo: volte quando quiser.`}</p>
        <p className="micro num">{hits.current} golpes · {dealt.current} de dano</p>
      </div>
      <button className="btn primary wide" onClick={() => { setResult(null); setHearts(heroHearts()); setHp(bossState(boss).hp); setI(i + 1); dealt.current = 0; hits.current = 0; start.current = Date.now(); }}>Lutar de novo</button>
      <button className="btn ghost wide" onClick={() => nav(boss.lv ? `/path/${boss.lv}` : "/hero")}>Voltar</button>
    </>
  );
  return (
    <>
      <div className="runtop">
        <button className="icon-btn" aria-label="Fugir" onClick={() => { if (hits.current) end("retreat"); else nav(-1); }}><Icon n="x" /></button>
        <div className="grow">
          <div className="row between"><b className="boss-name">{boss.name}</b><span className="micro num">{hp}/{max}</span></div>
          <div className="hpbar"><i style={{ width: `${(hp / max) * 100}%` }} /></div>
        </div>
      </div>
      <div className={`arena${hurt ? " hurt" : ""}`} key={`a${hurt}`}>
        <div className="boss-wrap" key={`b${hit}`}>
          <BossArt id={boss.id} hit={hit > 0} />
          {floats.map((f) => <span key={f.k} className={`dmg${f.crit ? " crit" : ""}`}>{f.crit ? "CRÍTICO " : ""}-{f.v}</span>)}
        </div>
        <div className="hearts" aria-label={`${hearts} de ${maxHearts} corações`}>
          {Array.from({ length: maxHearts }, (_, k) => <span key={k} className={k < hearts ? "on" : ""}><Icon n="heart" /></span>)}
          {combo >= 2 && <span className="combo hot"><Icon n="bolt" />x{combo}</span>}
        </div>
      </div>
      <p className="micro center">Acerte para atacar. Fale certo para dar golpe crítico!</p>
      <div className="ex" key={ex.key + "-" + i}>
        <Exercise ex={ex} locked={!!fb} onAnswer={onAnswer} onIntro={() => next()} />
      </div>
      {fb && (
        <div className={`fb ${fb.ok ? "ok" : "no"}`} role="status">
          <div className="in">
            <div className="fb-h"><Icon n={fb.ok ? "sword" : "heart"} /> {fb.ok ? "Golpe certeiro!" : "O chefe te acertou!"}</div>
            {fb.detail}
            {ex.it && fb.target && <div className="fb-ans"><SpeakBtn text={fb.target} small /><span><b>{fb.target}</b>{fb.target === ex.it.en ? ` = ${ex.it.pt}` : ""}</span></div>}
            <button className={`btn ${fb.ok ? "good" : "bad"} wide`} onClick={next}>Continuar</button>
          </div>
        </div>
      )}
    </>
  );
}
