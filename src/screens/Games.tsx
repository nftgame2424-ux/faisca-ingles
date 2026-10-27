// Jogos: Relâmpago (60 s), Jogo da memória e histórias com áudio.
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LV, STORIES, type Level } from "../data/content";
import { Icon } from "../components/Icon";
import { AppBar, ListRow } from "../components/ui";
import { ITEMS, type Item, checkBadges, distract, poolFor, rnd, shuffle } from "../lib/srs";
import { S, addXP, award, commit, fmtClock, logSession, useAppState } from "../lib/state";
import { say, stopSpeaking } from "../lib/speech";
import { confetti, sfx, vibrate } from "../lib/fx";

/* ---------------- Relâmpago ---------------- */
export function Blitz() {
  const nav = useNavigate();
  const pool = useMemo(() => poolFor(S.level, 30), []);
  const [round, setRound] = useState(0);
  const [end, setEnd] = useState(() => Date.now() + 60000);
  const [now, setNow] = useState(Date.now());
  const [score, setScore] = useState(0);
  const [miss, setMiss] = useState(0);
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState<"" | "ok" | "no">("");
  const [over, setOver] = useState(false);
  const [newBest, setNewBest] = useState(false);
  const cur = useMemo(() => {
    const it = pool[rnd(pool.length)];
    const truth = Math.random() < 0.5;
    const shown = truth ? it.pt : distract(it, "pt", 1)[0] || it.pt;
    return { it, truth: shown === it.pt, shown };
  }, [pool, round, end]);

  useEffect(() => {
    if (over) return;
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [over, end]);
  useEffect(() => {
    if (!over && now >= end) {
      setOver(true);
      const best = score > S.best.blitz;
      if (best) { S.best.blitz = score; commit(); }
      setNewBest(best);
      addXP(score * 2);
      logSession("blitz", { xp: score * 2, ok: score, n: score + miss, dur: 60000 });
      checkBadges(); sfx("win"); if (score > 0) confetti();
    }
  }, [now, end, over, score, miss]);

  function answer(yes: boolean) {
    if (over) return;
    const ok = yes === cur.truth;
    if (ok) { setScore(score + 1); setCombo(combo + 1); sfx("ok"); vibrate(10); }
    else { setMiss(miss + 1); setCombo(0); sfx("bad"); vibrate([25, 30, 25]); }
    setFlash(ok ? "ok" : "no");
    setRound(round + 1);
  }
  if (over) return (
    <>
      <div className="hero-done">
        <div className="eyebrow">Relâmpago</div>
        <div className="big num">{score}</div>
        <div className="h2">{newBest ? "Novo recorde!" : "pontos"}</div>
        <p className="muted">Recorde: {S.best.blitz} · +{score * 2} XP · {miss} erros</p>
      </div>
      <button className="btn hi wide" onClick={() => { setScore(0); setMiss(0); setCombo(0); setOver(false); setEnd(Date.now() + 60000); setNow(Date.now()); }}><Icon n="bolt" /> Jogar de novo</button>
      <button className="btn ghost wide" onClick={() => nav("/")}>Voltar ao início</button>
    </>
  );
  const left = Math.max(0, end - now);
  return (
    <>
      <div className="runtop">
        <button className="icon-btn" aria-label="Sair" onClick={() => nav(-1)}><Icon n="x" /></button>
        <div className="blitz-time"><i style={{ width: `${left / 600}%` }} /></div>
        <span className="num mono">{Math.ceil(left / 1000)}s</span>
      </div>
      <div className="row between">
        <div><div className="eyebrow">Pontos</div><div className="score num">{score}</div></div>
        <div className="right"><div className="eyebrow">Recorde</div><div className="score num muted">{S.best.blitz}</div></div>
      </div>
      <div className={`blitz-card ${flash}`} key={round} onAnimationEnd={() => setFlash("")}>
        <div className="term">{cur.it.en}</div>
        <div className="eq">significa</div>
        <div className="mean">{cur.shown}</div>
        <div className="combo hot center">{combo >= 3 ? `combo x${combo}` : ""}</div>
      </div>
      <p className="micro center">A tradução está certa? Responda rápido, sem pensar demais.</p>
      <div className="blitz-btns">
        <button className="btn bad" onClick={() => answer(false)}><Icon n="x" /> Errado</button>
        <button className="btn good" onClick={() => answer(true)}><Icon n="check" /> Certo</button>
      </div>
    </>
  );
}

/* ---------------- Jogo da memória ---------------- */
interface MemCard { idx: number; it: Item; side: "en" | "pt" }
const SIZES: { n: number; t: string }[] = [{ n: 4, t: "Fácil" }, { n: 6, t: "Médio" }, { n: 8, t: "Difícil" }];

export function Memory() {
  const s = useAppState();
  const nav = useNavigate();
  const [size, setSize] = useState<number | null>(null);
  const [game, setGame] = useState(0);
  const cards = useMemo<MemCard[]>(() => {
    if (!size) return [];
    const words = poolFor(s.level, 30).filter((it) => it.k === "w" && it.pt.length <= 20);
    const pick = (words.length >= size ? words : ITEMS.filter((it) => it.lv === s.level && it.k === "w")).slice(0, size);
    return shuffle(pick.flatMap((it) => [{ it, side: "en" as const }, { it, side: "pt" as const }])).map((c, idx) => ({ ...c, idx }));
  }, [size, game]); // eslint-disable-line react-hooks/exhaustive-deps
  const [open, setOpen] = useState<number[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [miss, setMiss] = useState<number[]>([]);
  const start = useRef(Date.now());
  const [finished, setFinished] = useState<null | { xp: number; best: boolean; time: number }>(null);

  function begin(n: number) { setSize(n); setGame(game + 1); setOpen([]); setDone(new Set()); setMoves(0); setMiss([]); setFinished(null); start.current = Date.now(); }

  function tap(c: MemCard) {
    if (miss.length || open.includes(c.idx) || done.has(c.it.id) || open.length >= 2) return;
    sfx("tap");
    if (c.side === "en") say(c.it.en);
    const nextOpen = [...open, c.idx];
    if (nextOpen.length < 2) { setOpen(nextOpen); return; }
    const [a, b] = nextOpen.map((i) => cards[i]);
    setMoves(moves + 1);
    if (a.it.id === b.it.id) {
      const nd = new Set(done); nd.add(a.it.id);
      setDone(nd); setOpen([]); sfx("ok"); vibrate(15); say(a.it.en);
      if (nd.size === size) finish(moves + 1);
    } else {
      setOpen(nextOpen); setMiss(nextOpen); vibrate(20);
      setTimeout(() => { setOpen([]); setMiss([]); }, 950);
    }
  }
  function finish(totalMoves: number) {
    const n = size!;
    const time = Date.now() - start.current;
    const xp = n * 4 + (totalMoves <= Math.round(n * 1.6) ? 10 : 0);
    const key = String(n);
    const best = !S.memBest[key] || totalMoves < S.memBest[key];
    if (best) S.memBest[key] = totalMoves;
    commit(); addXP(xp);
    logSession("memory", { xp, ok: n, n: totalMoves, dur: time });
    award("mem"); checkBadges();
    setTimeout(() => { confetti(); sfx("win"); setFinished({ xp, best, time }); }, 500);
  }

  if (!size) return (
    <>
      <AppBar back eyebrow="Jogo de cartas" title="Jogo da memória" />
      <p className="muted">Vire duas cartas por vez e ache o par: a palavra em inglês e a tradução. Cada carta em inglês fala a palavra quando vira.</p>
      <div className="stack">
        {SIZES.map((x) => (
          <ListRow key={x.n} lead={<Icon n="cards" />} title={`${x.t} · ${x.n} pares`} sub={s.memBest[x.n] ? `Recorde: ${s.memBest[x.n]} jogadas` : "Sem recorde ainda"} onClick={() => begin(x.n)} />
        ))}
      </div>
      <p className="micro">Puxar da memória onde estava cada carta treina a lembrança ativa das palavras. Usa palavras do seu nível, começando pelas que você ainda está aprendendo.</p>
    </>
  );
  if (finished) return (
    <>
      <div className="hero-done">
        <div className="eyebrow">Jogo da memória</div>
        <div className="big num">{moves}</div>
        <div className="h2">{finished.best ? "jogadas · novo recorde!" : "jogadas"}</div>
        <p className="muted">{size} pares em {fmtClock(finished.time)} · +{finished.xp} XP</p>
      </div>
      <button className="btn primary wide" onClick={() => begin(size)}>Jogar de novo</button>
      <button className="btn ghost wide" onClick={() => setSize(null)}>Mudar dificuldade</button>
      <button className="btn ghost wide" onClick={() => nav("/")}>Voltar ao início</button>
    </>
  );
  return (
    <>
      <div className="runtop">
        <button className="icon-btn" aria-label="Sair" onClick={() => setSize(null)}><Icon n="x" /></button>
        <div className="pbar"><i style={{ width: `${(done.size / size) * 100}%` }} /></div>
        <span className="num mono">{moves} jog.</span>
      </div>
      <div className={`mem-grid c${size === 4 ? 2 : size === 6 ? 3 : 4}`}>
        {cards.map((c) => {
          const up = open.includes(c.idx) || done.has(c.it.id);
          return (
            <button key={c.idx} className={`mcard${up ? " up" : ""}${done.has(c.it.id) ? " done" : ""}${miss.includes(c.idx) ? " miss" : ""}`}
              onClick={() => tap(c)} aria-label={up ? (c.side === "en" ? c.it.en : c.it.pt) : "Carta virada"}>
              <span className="mface">
                <span className="mtag">{c.side === "en" ? "EN" : "PT"}</span>
                <span className={c.side === "en" ? "men" : "mpt"}>{c.side === "en" ? c.it.en : c.it.pt}</span>
              </span>
              <span className="mback"><Icon n="bolt" /></span>
            </button>
          );
        })}
      </div>
      <p className="micro center">{done.size} de {size} pares</p>
    </>
  );
}

/* ---------------- Histórias ---------------- */
export function Stories() {
  const s = useAppState();
  const nav = useNavigate();
  return (
    <>
      <AppBar back="/train" eyebrow="Escuta" title="Histórias com áudio" />
      <p className="muted">Ouça a história inteira, depois toque em cada frase para ver a tradução.</p>
      <div className="stack">
        {(["A", "B", "C"] as Level[]).map((l) => (
          <ListRow key={l} highlight={l === s.level} lead={<Icon n="book" />} title={STORIES[l].t} sub={`${LV[l].name} · ${STORIES[l].lines.length} frases`} onClick={() => nav(`/story/${l}`)} />
        ))}
      </div>
    </>
  );
}

export function StoryScreen() {
  const { lv: lvP } = useParams();
  const lv = (lvP as Level) || "A";
  const st = STORIES[lv];
  const [playing, setPlaying] = useState(false);
  const [now, setNow] = useState(-1);
  const [slow, setSlow] = useState(false);
  const [shown, setShown] = useState<Set<number>>(new Set());
  const [ans, setAns] = useState<Record<number, number>>({});
  const playRef = useRef(false);
  const started = useRef(0);
  useEffect(() => () => { playRef.current = false; stopSpeaking(); }, []);

  function stop() { playRef.current = false; setPlaying(false); setNow(-1); stopSpeaking(); }
  function playFrom(i: number) {
    if (!playRef.current) return;
    if (i >= st.lines.length) {
      stop(); award("story" as string);
      addXP(5); logSession("story", { xp: 5, n: 1, ok: 1, dur: Date.now() - started.current });
      return;
    }
    setNow(i);
    document.querySelectorAll(".line")[i]?.scrollIntoView({ block: "center", behavior: "smooth" });
    const u = say(st.lines[i][0], slow);
    if (!u) { stop(); return; }
    u.onend = () => setTimeout(() => playFrom(i + 1), 350);
    u.onerror = () => stop();
  }
  return (
    <>
      <AppBar back="/stories" eyebrow={LV[lv].name} title={st.t} />
      <div className="row">
        <button className="btn primary grow" onClick={() => { if (playing) return stop(); playRef.current = true; setPlaying(true); started.current = Date.now(); playFrom(0); }}>
          <Icon n={playing ? "stop" : "play"} /> {playing ? "Parar" : "Ouvir tudo"}
        </button>
        <button className={`chip${slow ? " on" : ""}`} onClick={() => setSlow(!slow)}>Devagar</button>
      </div>
      <div className="lines">
        {st.lines.map((l, i) => (
          <button key={i} className={`line${shown.has(i) ? " show" : ""}${now === i ? " now" : ""}`}
            onClick={() => { stop(); const n = new Set(shown); n.has(i) ? n.delete(i) : n.add(i); setShown(n); say(l[0], slow); }}>
            <span className="en">{l[0]}</span><span className="ptx">{l[1]}</span>
          </button>
        ))}
      </div>
      <h2 className="h2">Entendeu?</h2>
      {st.q.map((q, qi) => (
        <section key={qi} className="gbox">
          <b className="ink">{q[0]}</b>
          <div className="opts">
            {q[1].map((o, oi) => {
              const a = ans[qi];
              const cls = a == null ? "" : oi === q[2] ? " right" : oi === a ? " wrong" : "";
              return <button key={oi} className={`opt${cls}`} onClick={() => {
                if (a != null) return;
                setAns({ ...ans, [qi]: oi });
                if (oi === q[2]) { addXP(10); sfx("ok"); } else sfx("bad");
              }}>{o}</button>;
            })}
          </div>
        </section>
      ))}
    </>
  );
}
