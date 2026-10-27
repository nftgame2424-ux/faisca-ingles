import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Icon } from "../components/Icon";
import { Ring, SpeakBtn } from "../components/ui";
import { Exercise } from "./Exercises";
import { buildFocus, getSummary, mk, setPendingRun, setSummary, takePendingRun, type RunSpec } from "../lib/session";
import { checkBadges, grade, rnd } from "../lib/srs";
import { S, addXP, commit, emitGame, fmtClock, logSession, today, useAppState, liveStreak } from "../lib/state";
import { say, stopSpeaking } from "../lib/speech";
import { addGold } from "../lib/rpg";
import { confetti, sfx, vibrate } from "../lib/fx";

export function startRun(nav: (p: string) => void, spec: RunSpec) {
  if (!spec.seq.length) return;
  setPendingRun(spec);
  nav("/run");
}

const PRAISE = ["Boa!", "Isso!", "Mandou bem!", "Perfeito!", "Acertou!", "Show!", "Arrasou!"];
const NO_AUTO = new Set(["speak", "build", "pairSay", "sayWord", "saySent"]);
const SAY_ON_OK = new Set(["mcqPtEn", "build", "listen", "gram"]);

export default function Run() {
  const nav = useNavigate();
  const spec = useMemo(() => takePendingRun(), []);
  const seq = useRef(spec ? spec.seq.slice() : []);
  const requeued = useRef(new Set<string>());
  const stats = useRef({ xp: 0, ok: 0, bad: 0, combo: 0, max: 0, nw: 0, gold: 0 });
  const start = useRef(Date.now());
  const auto = useRef<number | undefined>(undefined);
  const [i, setI] = useState(0);
  const [, force] = useState(0);
  const [fb, setFb] = useState<null | { ok: boolean; detail?: ReactNode; target?: string; praise: string }>(null);

  useEffect(() => { const t = setInterval(() => force((x) => x + 1), 1000); return () => { clearInterval(t); clearTimeout(auto.current); stopSpeaking(); }; }, []);
  if (!spec) return <Navigate to="/" replace />;
  const ex = seq.current[i];
  const st = stats.current;

  function finish(early: boolean) {
    clearTimeout(auto.current);
    const tot = st.ok + st.bad;
    const dur = Date.now() - start.current;
    if (tot > 0) {
      S.sessions++;
      commit();
      logSession(spec!.kind, { xp: st.xp, ok: st.ok, n: tot, dur, nw: st.nw });
    }
    checkBadges();
    setSummary({ xp: st.xp, acc: tot ? Math.round((st.ok / tot) * 100) : 0, combo: st.max, time: dur, early, chest: false, kind: spec!.kind, title: spec!.title });
    nav(tot > 0 ? "/summary" : "/", { replace: true });
  }
  function next() {
    clearTimeout(auto.current);
    setFb(null);
    if (i + 1 >= seq.current.length) finish(false);
    else { setI(i + 1); window.scrollTo(0, 0); }
  }
  function onIntro(known: boolean) {
    st.xp += addXP(2);
    if (known) seq.current = seq.current.filter((e, k) => k <= i || !(e.isNew && e.it === ex.it));
    else st.nw++;
    next();
  }
  function onAnswer(ok: boolean, detail?: ReactNode, target?: string) {
    if (fb) return;
    if (ex.it) grade(ex.it, ok);
    if (ok) {
      st.ok++; st.combo++; st.max = Math.max(st.max, st.combo);
      const gain = 10 + (st.combo >= 6 ? 10 : st.combo >= 3 ? 5 : 0);
      st.xp += addXP(gain); st.gold += addGold(st.combo >= 5 ? 3 : 2, spec!.kind); emitGame({ type: "correct" }); sfx("ok"); vibrate(18);
    } else {
      st.bad++; st.combo = 0; sfx("bad"); vibrate([30, 40, 30]);
      const key = ex.it?.id || ex.w;
      if (key && !requeued.current.has(key)) {
        requeued.current.add(key);
        const t = ex.t === "flash" || ex.t === "intro" ? "mcqEnPt" : ex.t;
        seq.current.splice(Math.min(seq.current.length, i + 3), 0, mk({ ...ex, t }));
      }
    }
    const tgt = target || ex.it?.en || ex.w;
    if (tgt && (!ok || SAY_ON_OK.has(ex.t))) say(tgt);
    setFb({ ok, detail, target: tgt, praise: PRAISE[rnd(PRAISE.length)] });
    if (ok && !NO_AUTO.has(ex.t)) auto.current = window.setTimeout(next, 1500);
  }

  const pct = (i / seq.current.length) * 100;
  return (
    <>
      <div className="runtop">
        <button className="icon-btn" aria-label="Sair da sessão" onClick={() => finish(true)}><Icon n="x" /></button>
        <div className="pbar"><i style={{ width: `${pct}%` }} /></div>
        <div className={`combo${st.combo >= 3 ? " hot" : ""}`}>{st.combo >= 3 && <><Icon n="bolt" /><span className="num">x{st.combo}</span></>}</div>
      </div>
      <div className="runmeta"><span>{spec.title} · {i + 1}/{seq.current.length}</span><span>{fmtClock(Date.now() - start.current)}</span><span>+{st.xp} XP · +{st.gold} ouro</span></div>
      <div className="ex" key={ex.key}>
        <Exercise ex={ex} locked={!!fb} onAnswer={onAnswer} onIntro={onIntro} />
      </div>
      {fb && (
        <div className={`fb ${fb.ok ? "ok" : "no"}`} role="status">
          <div className="in">
            <div className="fb-h"><Icon n={fb.ok ? "check" : "x"} /> {fb.ok ? fb.praise : "Ainda não. Olha só:"}{fb.ok && st.combo >= 3 && <span className="num fb-combo">combo x{st.combo}</span>}</div>
            {fb.detail}
            {ex.it && fb.target && (
              <div className="fb-ans"><SpeakBtn text={fb.target} small /><span><b>{fb.target}</b>{fb.target === ex.it.en ? ` = ${ex.it.pt}` : ""}</span></div>
            )}
            <button className={`btn ${fb.ok ? "good" : "bad"} wide`} onClick={next}>Continuar</button>
          </div>
        </div>
      )}
    </>
  );
}

export function Summary() {
  const nav = useNavigate();
  const s = useAppState();
  const sum = useMemo(() => getSummary(), []);
  useEffect(() => { if (sum && sum.xp > 0) { confetti(); sfx("win"); vibrate([20, 60, 20]); } }, [sum]);
  if (!sum) return <Navigate to="/" replace />;
  const xpToday = s.days[today()] || 0;
  return (
    <>
      <div className="hero-done">
        <div className="eyebrow">{sum.early ? "Sessão salva" : "Sessão completa"} · {sum.title}</div>
        <div className="big num">+{sum.xp}</div>
        <div className="h2">XP ganho</div>
        <p className="muted">{sum.acc >= 85 ? "Muito bem. Seu cérebro guardou bastante coisa hoje." : sum.acc >= 60 ? "Bom treino. O que você errou volta amanhã para fixar." : "Errar faz parte. Cada erro vira revisão no momento certo."}</p>
      </div>
      <div className="stats">
        <div className="stat"><b className="num">{sum.acc}%</b><span>acertos</span></div>
        <div className="stat"><b className="num">x{sum.combo}</b><span>maior combo</span></div>
        <div className="stat"><b className="num">{fmtClock(sum.time)}</b><span>tempo</span></div>
        <div className="stat"><b className="num">{liveStreak()}</b><span>dias seguidos</span></div>
      </div>
      <div className="card goal">
        <Ring value={xpToday} max={s.settings.goal} label="Meta do dia" />
        <div><b className="h3">{xpToday >= s.settings.goal ? "Meta do dia batida" : "Meta do dia"}</b><p className="num">{xpToday} de {s.settings.goal} XP</p></div>
      </div>
      <button className="btn primary wide" onClick={() => startRun(nav, buildFocus(2))}>Mais 2 minutos</button>
      <button className="btn ghost wide" onClick={() => nav("/", { replace: true })}>Voltar ao início</button>
      <p className="micro center">Parar agora também é ótimo. Tudo já está salvo no histórico.</p>
    </>
  );
}
