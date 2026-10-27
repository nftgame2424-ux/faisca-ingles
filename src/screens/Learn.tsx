// Início, boas-vindas, trilha de unidades e menu de treinos.
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LV, TIPS, UNITS, type Level } from "../data/content";
import { Icon } from "../components/Icon";
import { AppBar, ListRow, Ring, SettingsButton, Tile } from "../components/ui";
import { Avatar, ClassBadge } from "../components/Hero";
import { BOSSES, dailyBossDone, ensureQuests, heroLevel, questInfo } from "../lib/rpg";
import { buildFocus, buildGram, buildMode, buildReview, planFocus } from "../lib/session";
import { ITEMS, hardItems, nextUnit } from "../lib/srs";
import { S, commit, liveStreak, today, useAppState } from "../lib/state";
import { say } from "../lib/speech";
import { startRun } from "./Run";

function greet() { const h = new Date().getHours(); return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite"; }
const DURATIONS = [2, 5, 10, 15];

export function Onboarding() {
  const s = useAppState();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [intent, setIntent] = useState(s.intention);
  const finish = (go: boolean) => {
    S.intention = intent.trim(); S.onboarded = true; commit();
    if (go) startRun(nav, buildFocus(S.settings.min)); else nav("/", { replace: true });
  };
  if (step === 1) return (
    <>
      <div className="eyebrow" style={{ paddingTop: 12 }}>Faísca Inglês</div>
      <h1 className="display-xl">Inglês em doses curtas, do jeito que o seu cérebro <mark>gosta</mark>.</h1>
      <ul className="bul">
        <li><Icon n="timer" /><span>Sessões de 2 a 15 minutos. Parar no meio não perde nada.</span></li>
        <li><Icon n="mic" /><span>Você fala, o app escuta e dá nota para a sua pronúncia. Tem treino de dicção.</span></li>
        <li><Icon n="chart" /><span>Histórico completo: tempo estudado, palavras aprendidas e evolução da pronúncia.</span></li>
      </ul>
      <h2 className="h2">Qual é o seu nível?</h2>
      <div className="stack">
        {(["A", "B", "C"] as Level[]).map((l) => (
          <button key={l} className={`lvl${s.level === l ? " on" : ""}`} onClick={() => { S.level = l; commit(); }}>
            <span className="cefr">{LV[l].cefr}</span><b>{LV[l].name}</b><small>{LV[l].desc}</small>
          </button>
        ))}
      </div>
      <p className="micro">Na dúvida, comece um nível abaixo. Palavras que você já sabe dá para pular com um toque.</p>
      <button className="btn primary wide" onClick={() => setStep(2)}>Continuar <Icon n="arrow" /></button>
    </>
  );
  const presets = ["Depois do café da manhã", "No ônibus ou metrô", "Na hora do almoço", "Antes de dormir"];
  return (
    <>
      <button className="link self-start" onClick={() => setStep(1)}><Icon n="back" /> Voltar</button>
      <h1 className="h1">Combine com você mesmo</h1>
      <section className="card stack">
        <b className="h3">Duração de cada sessão</b>
        <div className="chips">{DURATIONS.map((m) => <button key={m} className={`chip${s.settings.min === m ? " on" : ""}`} onClick={() => { S.settings.min = m; commit(); }}>{m} min</button>)}</div>
        <p className="micro">Dá para mudar a cada sessão, na tela inicial.</p>
      </section>
      <section className="card stack">
        <b className="h3">Meta diária</b>
        <div className="chips">{[30, 50, 100, 150].map((m) => <button key={m} className={`chip${s.settings.goal === m ? " on" : ""}`} onClick={() => { S.settings.goal = m; commit(); }}>{m} XP</button>)}</div>
        <p className="micro">Uma sessão de 5 minutos rende uns 80 a 140 XP.</p>
      </section>
      <section className="card stack">
        <b className="h3">Quando você vai treinar?</b>
        <p className="micro">Ligar o treino a algo que você já faz todo dia ajuda muito.</p>
        <div className="chips">{presets.map((x) => <button key={x} className={`chip${intent === x ? " on" : ""}`} onClick={() => setIntent(x)}>{x}</button>)}</div>
        <input id="intention" className="field" type="text" placeholder="Ex.: Depois do café" value={intent} onChange={(e) => setIntent(e.target.value)} />
      </section>
      <button className="btn primary wide" onClick={() => finish(true)}>Começar minha primeira sessão</button>
      <button className="btn ghost wide" onClick={() => finish(false)}>Ir para o início</button>
    </>
  );
}

function HeroStrip() {
  const s = useAppState();
  const nav = useNavigate();
  useEffect(() => { ensureQuests(); }, []);
  if (!s.rpg.cls) return (
    <button className="hero-strip new" onClick={() => nav("/hero/new")}>
      <span className="ti y"><Icon n="sword" /></span>
      <div className="grow"><b>Crie seu herói</b><small>Cada treino vira ouro, baús com itens e batalhas contra chefes.</small></div>
      <Icon n="arrow" />
    </button>
  );
  const lv = heroLevel();
  const done = s.rpg.quests.filter((q) => q.prog >= q.n).length;
  const claimable = s.rpg.quests.some((q) => q.prog >= q.n && !q.claimed);
  return (
    <div className="stack-s">
      <button className="hero-strip" onClick={() => nav("/hero")}>
        <Avatar size={58} />
        <div className="grow stack-s">
          <div className="row between"><b>{s.rpg.name} · Nv {lv.lvl}</b><span className="gold-chip"><Icon n="coin" /><b className="num">{s.rpg.gold}</b></span></div>
          <div className="pbar xp"><i style={{ width: `${(lv.into / lv.need) * 100}%` }} /></div>
          <div className="row between"><ClassBadge cls={s.rpg.cls} /><span className="micro num">{lv.need - lv.into} XP para subir</span></div>
        </div>
      </button>
      <button className={`quest-strip${claimable ? " ready" : ""}`} onClick={() => nav("/hero")}>
        <Icon n="target" />
        <span className="grow">{claimable ? "Missão cumprida! Toque para resgatar o baú"
          : s.rpg.quests[0] ? `Missões de hoje: ${done} de ${s.rpg.quests.length} · ${questInfo(s.rpg.quests.find((q) => q.prog < q.n) || s.rpg.quests[0]).text}` : "Missões de hoje"}</span>
        <Icon n="arrow" />
      </button>
      {!dailyBossDone() && <button className="quest-strip boss" onClick={() => nav("/boss/daily")}><Icon n="sword" /><span className="grow">Chefe diário: {BOSSES[3].name}</span><Icon n="arrow" /></button>}
    </div>
  );
}

export function Home() {
  const s = useAppState();
  const nav = useNavigate();
  const t = today();
  const xpToday = s.days[t] || 0;
  const min = s.settings.min;
  const { newN, revN } = planFocus(min, s.level);
  const nu = nextUnit(s.level);
  const tip = TIPS[(t + s.sessions) % TIPS.length];
  const streak = liveStreak();
  return (
    <>
      <AppBar eyebrow={greet()} title={<>Bora treinar <mark>inglês</mark>?</>} right={
        <div className="row">
          <div className="streak" aria-label={`Sequência de ${streak} dias`}><Icon n="flame" /><span className="num">{streak}</span>
            {s.shields > 0 && <span className="shield" aria-label={`${s.shields} escudos`}><Icon n="shield" />{s.shields}</span>}</div>
          <SettingsButton />
        </div>
      } />
      <HeroStrip />
      <section className="card goal">
        <Ring value={xpToday} max={s.settings.goal} label="Meta do dia" />
        <div>
          <b className="h3">Meta de hoje</b>
          <p className="num">{xpToday} de {s.settings.goal} XP</p>
          <p className="micro">{xpToday >= s.settings.goal ? "Meta batida. Tudo que vier agora é bônus." : xpToday > 0 ? "Falta pouco. Uma sessão curta resolve." : `Uma sessão de ${min} min já faz diferença.`}</p>
        </div>
      </section>
      <button className="cta" onClick={() => startRun(nav, buildFocus(min))}>
        <span><b>Começar · {min} min</b><small>{revN ? `${revN} revisões` : "Sem revisões pendentes"}{newN ? ` + ${newN} itens novos` : ""}</small></span>
        <span className="go"><Icon n="play" /></span>
      </button>
      <div>
        <div className="chips">{DURATIONS.map((m) => <button key={m} className={`chip${m === min ? " on" : ""}`} onClick={() => { S.settings.min = m; commit(); }}>{m} min</button>)}</div>
        <p className="micro mt8">Dia difícil? 2 minutos também contam.</p>
      </div>
      {s.intention && <p className="micro">Seu plano: <b className="ink">{s.intention}</b>, eu treino {min} minutos.</p>}

      <div className="sec-h"><h2 className="h2">Treino rápido</h2><button className="link" onClick={() => nav("/train")}>Todos</button></div>
      <div className="tiles">
        <Tile icon="wave" title="Dicção · 1 min" sub="Aquecimento para soltar a língua" tone="y" onClick={() => nav("/warmup")} />
        <Tile icon="cards" title="Jogo da memória" sub={`Recorde: ${s.memBest["6"] ? s.memBest["6"] + " jogadas" : "nenhum"}`} onClick={() => nav("/memory")} />
        <Tile icon="bolt" title="Relâmpago" sub={`60 s · recorde ${s.best.blitz}`} tone="y" onClick={() => nav("/blitz")} />
        <Tile icon="chat" title="Diálogo falado" sub="Responda falando em inglês" onClick={() => nav("/speak")} />
      </div>

      <div className="sec-h"><h2 className="h2">Próxima unidade</h2><button className="link" onClick={() => nav("/path")}>Ver mapa</button></div>
      {nu >= 0 ? (() => {
        const its = ITEMS.filter((it) => it.lv === s.level && it.u === nu);
        const seen = its.filter((it) => s.cards[it.id]).length;
        return <ListRow highlight lead={nu + 1} title={UNITS[s.level][nu].t} sub={`${LV[s.level].name} · ${seen} de ${its.length} vistos`} progress={(seen / its.length) * 100} onClick={() => nav(`/unit/${s.level}/${nu}`)} />;
      })() : <div className="card"><b className="h3">Nível {LV[s.level].name} completo.</b><p className="micro">Continue revisando ou suba de nível na Trilha.</p></div>}

      <div className="tip"><Icon n="brain" /><p>{tip}</p></div>
    </>
  );
}

export function UnitScreen() {
  const s = useAppState();
  const nav = useNavigate();
  const { lv: lvP, u: uP } = useParams();
  const lv = (lvP as Level) || "A";
  const ui = Number(uP) || 0;
  const u = UNITS[lv][ui];
  const its = ITEMS.filter((it) => it.lv === lv && it.u === ui);
  const dot = (id: string) => { const c = s.cards[id]; return !c ? "" : c.b >= 4 ? "l3" : c.b >= 2 ? "l2" : "l1"; };
  return (
    <>
      <AppBar back={`/path/${lv}`} eyebrow={`${LV[lv].name} · Unidade ${ui + 1}`} title={u.t} />
      <button className="cta" onClick={() => startRun(nav, buildFocus(s.settings.min, { lv, u: ui }))}>
        <span><b>Praticar esta unidade</b><small>Itens novos e revisões, {s.settings.min} min</small></span><span className="go"><Icon n="play" /></span>
      </button>
      <section className="gbox">
        <div className="eyebrow">Gramática em 1 minuto</div>
        <h2 className="h2">{u.g.t}</h2>
        <div className="gtext" dangerouslySetInnerHTML={{ __html: u.g.b }} />
        <div className="wlist">
          {u.g.ex.map((e, i) => (
            <button key={i} className="witem" onClick={() => say(e[0])}><Icon n="vol" /><div><b>{e[0]}</b><small>{e[1]}</small></div></button>
          ))}
        </div>
        <button className="btn ghost wide" onClick={() => startRun(nav, buildGram(lv, ui))}><Icon n="pen" /> Quiz de gramática (3)</button>
      </section>
      <div className="sec-h"><h2 className="h2">Palavras e frases</h2><span className="micro">toque para ouvir</span></div>
      <div className="wlist">
        {its.map((it) => (
          <button key={it.id} className="witem" onClick={() => say(it.en)}>
            <span className={`dot ${dot(it.id)}`} /><div><b>{it.en}</b><small>{it.pt}</small></div><Icon n="vol" />
          </button>
        ))}
      </div>
      <p className="micro">Bolinha: amarela = aprendendo · azul = conhecida · verde = dominada.</p>
    </>
  );
}

export function Train() {
  const s = useAppState();
  const nav = useNavigate();
  const hard = hardItems(8);
  return (
    <>
      <AppBar eyebrow={`Treinar · ${LV[s.level].name}`} title="Escolha o jeito de hoje" />
      <p className="muted">Cada modo treina uma parte diferente. Variar mantém a atenção acesa.</p>
      <div className="tiles">
        <Tile wide icon="spark" title="Sessão de foco" sub={`Mistura tudo na medida certa · ${s.settings.min} min`} onClick={() => startRun(nav, buildFocus(s.settings.min))} />
        <Tile icon="cards" title="Jogo da memória" sub="Ache os pares inglês e português" tone="y" onClick={() => nav("/memory")} />
        <Tile icon="bolt" title="Relâmpago" sub={`60 s de velocidade · recorde ${s.best.blitz}`} tone="y" onClick={() => nav("/blitz")} />
        <Tile icon="head" title="Ditado" sub="Ouça e escreva" onClick={() => startRun(nav, buildMode("listen"))} />
        <Tile icon="mic" title="Repetir frases" sub="Fale e receba nota" onClick={() => startRun(nav, buildMode("speak"))} />
        <Tile icon="puzzle" title="Montar frases" sub="Monte a frase em inglês" onClick={() => startRun(nav, buildMode("build"))} />
        <Tile icon="cards" title="Flashcards" sub="Lembre antes de virar" onClick={() => startRun(nav, buildMode("flash"))} />
        <Tile icon="pen" title="Gramática" sub="Quiz rápido do seu nível" onClick={() => startRun(nav, buildGram(s.level))} />
        <Tile icon="book" title="Histórias" sub="Escute contos curtos" onClick={() => nav("/stories")} />
        {hard.length >= 3 && <Tile wide icon="target" title="Palavras difíceis" sub={`As ${hard.length} que você mais erra`} tone="g" onClick={() => startRun(nav, buildReview(hard))} />}
      </div>
    </>
  );
}
