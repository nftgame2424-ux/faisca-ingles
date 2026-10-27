// Aba Falar: pronúncia, dicção, trava-línguas, aquecimento e diálogos falados.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LV } from "../data/content";
import { DIALOGUES, SOUNDS, TWISTERS, WARMUP } from "../data/diction";
import { Icon } from "../components/Icon";
import { AppBar, ListenRow, ListRow, SpeakBtn } from "../components/ui";
import { PronResult, Recorder, SpeakBox } from "../components/SpeakBox";
import { buildMode, buildSound } from "../lib/session";
import { S, addXP, award, commit, logSession, recordPron, useAppState } from "../lib/state";
import { say, stopSpeaking, useMic } from "../lib/speech";
import { scoreAlts, type SpeechScore } from "../lib/scoring";
import { confetti, sfx, vibrate } from "../lib/fx";
import { startRun } from "./Run";

const avg = (a: number[] | undefined, n = 5) => (a && a.length ? Math.round(a.slice(-n).reduce((x, y) => x + y, 0) / Math.min(n, a.length)) : null);

function MicBanner() {
  const mic = useMic();
  if (mic === "ok") return <div className="banner good"><Icon n="mic" /><span>Microfone funcionando. O app escuta e dá nota para a sua fala.</span></div>;
  if (mic === "unknown") return <div className="banner"><Icon n="mic" /><span>Na primeira fala o Chrome pede permissão para usar o microfone. Toque em <b>Permitir</b>.</span></div>;
  return (
    <div className="banner warn"><Icon n="info" />
      <span>{mic === "blocked" ? "O microfone está bloqueado." : "Este navegador não reconhece fala."} Você ainda pode falar pelo microfone do teclado. <Link to="/michelp">Como resolver</Link></span>
    </div>
  );
}

export function SpeakHub() {
  const s = useAppState();
  const nav = useNavigate();
  const dlg = DIALOGUES.filter((d) => d.lv === s.level).concat(DIALOGUES.filter((d) => d.lv !== s.level));
  return (
    <>
      <AppBar eyebrow="Falar" title="Pronúncia e dicção" />
      <MicBanner />
      <button className="cta" onClick={() => nav("/warmup")}>
        <span><b>Aquecimento de dicção</b><small>1 minuto para soltar boca e língua antes de falar</small></span>
        <span className="go"><Icon n="play" /></span>
      </button>

      <div className="sec-h"><h2 className="h2">Sons difíceis para brasileiros</h2></div>
      <p className="micro">Cada som tem dica de como posicionar a boca, escuta com pares mínimos e fala com nota.</p>
      <div className="stack">
        {SOUNDS.map((x) => {
          const a = avg(s.pron[x.id]);
          return <ListRow key={x.id} lead={<span className="ipa">{x.ipa.split(" ")[0]}</span>} title={x.t}
            sub={a == null ? "Ainda não treinado" : `Média recente: ${a}% · ${s.pron[x.id].length} tentativas`}
            right={a == null ? <Icon n="arrow" /> : <span className={`pill ${a >= 85 ? "good" : a >= 70 ? "ok" : "low"}`}>{a}%</span>}
            onClick={() => nav(`/sound/${x.id}`)} />;
        })}
      </div>

      <div className="sec-h"><h2 className="h2">Treinos de fala</h2></div>
      <div className="tiles">
        <button className="tile" onClick={() => nav("/twisters")}><span className="ti y"><Icon n="wave" /></span><div><b>Trava-línguas</b><small>{TWISTERS.length} desafios com nota</small></div></button>
        <button className="tile" onClick={() => startRun(nav, buildMode("speak"))}><span className="ti"><Icon n="mic" /></span><div><b>Repetir frases</b><small>Frases do seu nível</small></div></button>
      </div>

      <div className="sec-h"><h2 className="h2">Diálogos falados</h2></div>
      <p className="micro">Uma pessoa fala com você e você responde falando. Grátis e funciona sem conta.</p>
      <div className="stack">
        {dlg.map((d) => <ListRow key={d.id} lead={<Icon n="chat" />} title={d.t} sub={`${LV[d.lv].name} · ${d.d}`} onClick={() => nav(`/dialogue/${d.id}`)} />)}
      </div>

      <div className="sec-h"><h2 className="h2">Conversa livre com IA</h2></div>
      <ListRow lead={<Icon n="spark" />} title="Conversar com o Sam" sub={s.settings.aiKey ? "Role-play com correção das suas frases" : "Opcional: precisa de uma chave da API da Anthropic"} onClick={() => nav("/chat")} />
    </>
  );
}

export function SoundScreen() {
  const s = useAppState();
  const nav = useNavigate();
  const { id } = useParams();
  const snd = SOUNDS.find((x) => x.id === id) || SOUNDS[0];
  const a = avg(s.pron[snd.id]);
  return (
    <>
      <AppBar back="/speak" eyebrow={`Dicção · ${snd.ipa}`} title={snd.t} />
      <section className="gbox">
        <div className="eyebrow">Como fazer</div>
        <p className="lead">{snd.tip}</p>
        <div className="chips">{snd.words.map((w) => <button key={w} className="chip" onClick={() => say(w)}><Icon n="vol" /> {w}</button>)}</div>
      </section>
      {snd.pairs.length > 0 && (
        <section className="card stack">
          <b className="h3">Pares mínimos</b>
          <p className="micro">Palavras que mudam por um único som. Toque para comparar.</p>
          <div className="pairs">{snd.pairs.map(([x, y]) => (
            <div key={x} className="pair"><button className="spk" onClick={() => say(x)}><Icon n="vol" />{x}</button><span className="vs">x</span><button className="spk" onClick={() => say(y)}><Icon n="vol" />{y}</button></div>
          ))}</div>
        </section>
      )}
      <div className="stack">
        {snd.pairs.length > 0 && <ListRow lead="1" title="Escuta" sub="Qual das duas palavras você ouviu? 6 rodadas" onClick={() => startRun(nav, buildSound(snd, "hear"))} />}
        <ListRow lead={snd.pairs.length ? "2" : "1"} title="Fale as palavras" sub="O app escuta e diz se ficou claro" onClick={() => startRun(nav, buildSound(snd, "say"))} />
        <ListRow lead={snd.pairs.length ? "3" : "2"} title="Fale as frases" sub={snd.sentences.join(" · ")} onClick={() => startRun(nav, buildSound(snd, "sent"))} />
      </div>
      <section className="card stack">
        <b className="h3">Grave e compare</b>
        <div className="sentence sm">{snd.sentences[0]}</div>
        <Recorder model={snd.sentences[0]} />
      </section>
      {a != null && <p className="micro">Sua média recente neste som: <b className="ink">{a}%</b>.</p>}
    </>
  );
}

export function Twisters() {
  const s = useAppState();
  const nav = useNavigate();
  return (
    <>
      <AppBar back="/speak" eyebrow="Dicção" title="Trava-línguas" />
      <p className="muted">Comece devagar, articulando cada som. Quando passar de 85%, tente na velocidade normal.</p>
      <div className="stack">
        {TWISTERS.map((t, i) => {
          const b = s.twBest[i];
          return <ListRow key={i} lead={LV[t.lv].name[0]} title={t.t} sub={`Foco: ${t.focus}`}
            right={b == null ? <Icon n="arrow" /> : <span className={`pill ${b >= 85 ? "good" : b >= 70 ? "ok" : "low"}`}>{b}%</span>}
            onClick={() => nav(`/twister/${i}`)} />;
        })}
      </div>
    </>
  );
}

export function TwisterScreen() {
  const nav = useNavigate();
  const s = useAppState();
  const { i: iP } = useParams();
  const i = Math.min(TWISTERS.length - 1, Number(iP) || 0);
  const tw = TWISTERS[i];
  const [res, setRes] = useState<SpeechScore | null>(null);
  const [round, setRound] = useState(0);
  const since = useRef(Date.now());
  useEffect(() => { setRes(null); since.current = Date.now(); }, [i]);
  function onResult(r: SpeechScore) {
    setRes(r); setRound(round + 1);
    if (r.self) return;
    recordPron("trava", `tw${i}`, r.score, tw.t);
    const pct = Math.round(r.score * 100);
    const best = s.twBest[i] == null || pct > s.twBest[i];
    if (best) { S.twBest[i] = pct; commit(); }
    const xp = 5 + (r.score >= 0.9 ? 10 : 0);
    addXP(xp);
    logSession("twister", { xp, ok: r.score >= 0.7 ? 1 : 0, n: 1, dur: Date.now() - since.current, sc: pct });
    since.current = Date.now();
    if (r.score >= 0.9) { award("tw90"); confetti(); sfx("win"); } else if (r.score >= 0.7) sfx("ok"); else { sfx("bad"); vibrate(30); }
  }
  return (
    <>
      <AppBar back="/twisters" eyebrow={`Trava-língua · foco: ${tw.focus}`} title="Fale sem travar" />
      <div className="sentence">{tw.t}</div>
      <div className="ptx">{tw.pt}</div>
      <ListenRow text={tw.t} />
      {res && <PronResult r={res} target={tw.t} />}
      <SpeakBox key={round} target={tw.t} onResult={onResult} allowSelf={false} label={res ? "Toque e tente de novo" : "Toque e fale"} />
      <p className="micro">Recorde: <b className="ink">{s.twBest[i] != null ? `${s.twBest[i]}%` : "nenhum"}</b></p>
      <section className="card stack"><b className="h3">Grave e compare</b><Recorder model={tw.t} /></section>
      <div className="dual">
        <button className="btn ghost" disabled={i === 0} onClick={() => nav(`/twister/${i - 1}`, { replace: true })}><Icon n="back" /> Anterior</button>
        <button className="btn ghost" disabled={i === TWISTERS.length - 1} onClick={() => nav(`/twister/${i + 1}`, { replace: true })}>Próximo <Icon n="arrow" /></button>
      </div>
    </>
  );
}

export function Warmup() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [left, setLeft] = useState(WARMUP[0].s);
  const [done, setDone] = useState(false);
  const start = useRef(Date.now());
  const cur = WARMUP[step];
  useEffect(() => {
    if (done) return;
    setLeft(cur.s);
    if (cur.say) say(cur.say, cur.slow);
    const t = setInterval(() => setLeft((x) => x - 1), 1000);
    return () => { clearInterval(t); stopSpeaking(); };
  }, [step, done]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (left <= 0 && !done) advance(); }, [left]); // eslint-disable-line react-hooks/exhaustive-deps
  function advance() {
    sfx("tap");
    if (step + 1 >= WARMUP.length) {
      setDone(true); addXP(15); award("warm");
      logSession("warm", { xp: 15, ok: 1, n: 1, dur: Date.now() - start.current });
      confetti(); sfx("win");
    } else setStep(step + 1);
  }
  if (done) return (
    <>
      <div className="hero-done"><div className="eyebrow">Aquecimento</div><div className="big num">+15</div><div className="h2">Boca aquecida</div>
        <p className="muted">Agora é a melhor hora para treinar um som difícil ou um trava-língua.</p></div>
      <button className="btn primary wide" onClick={() => nav("/twisters", { replace: true })}>Ir para os trava-línguas</button>
      <button className="btn ghost wide" onClick={() => nav("/speak", { replace: true })}>Voltar para Falar</button>
    </>
  );
  const r = 44, c = 2 * Math.PI * r;
  return (
    <>
      <div className="runtop">
        <button className="icon-btn" aria-label="Sair" onClick={() => nav(-1)}><Icon n="x" /></button>
        <div className="pbar"><i style={{ width: `${(step / WARMUP.length) * 100}%` }} /></div>
        <span className="num mono">{step + 1}/{WARMUP.length}</span>
      </div>
      <div className="warm">
        <svg viewBox="0 0 100 100" className="warm-ring" role="img" aria-label={`${left} segundos`}>
          <circle cx="50" cy="50" r={r} className="tr" />
          <circle cx="50" cy="50" r={r} className="fg" strokeDasharray={c} strokeDashoffset={c * (1 - left / cur.s)} transform="rotate(-90 50 50)" />
          <text x="50" y="58" textAnchor="middle">{Math.max(0, left)}</text>
        </svg>
        <h2 className="h1 center">{cur.t}</h2>
        <p className="lead center">{cur.d}</p>
        {cur.say && <SpeakBtn text={cur.say} slow={cur.slow} label="Ouvir de novo" />}
      </div>
      <button className="btn primary wide" onClick={advance}>{step + 1 >= WARMUP.length ? "Concluir" : "Próximo"}</button>
    </>
  );
}

export function DialogueScreen() {
  const nav = useNavigate();
  const { id } = useParams();
  const d = DIALOGUES.find((x) => x.id === id) || DIALOGUES[0];
  const [turn, setTurn] = useState(0);
  const [said, setSaid] = useState<{ text: string; score: number | null }[]>([]);
  const [showPt, setShowPt] = useState(false);
  const [last, setLast] = useState<SpeechScore | null>(null);
  const [tries, setTries] = useState(0);
  const [lastTarget, setLastTarget] = useState("");
  const start = useRef(Date.now());
  const t = d.turns[turn];
  const finished = turn >= d.turns.length;
  useEffect(() => { if (t) say(t.npc[0]); }, [turn]); // eslint-disable-line react-hooks/exhaustive-deps

  const targets = t ? t.opts.map((o) => o[0]) : [];
  function onResult(r: SpeechScore) {
    // Você pode responder qualquer uma das opções: vale a que ficou mais parecida com o que o app ouviu.
    let best = r, bestTarget = targets[0];
    if (!r.self && r.heard) {
      best = { ...r, score: -1 };
      for (const tg of targets) {
        const s2 = scoreAlts([{ t: r.heard, c: r.conf }], tg);
        if (s2.score > best.score) { best = s2; bestTarget = tg; }
      }
    }
    setLastTarget(bestTarget);
    if (!r.self) recordPron("dialogo", d.id, best.score, bestTarget);
    const ok = !!r.self || best.score >= 0.6;
    if (!ok && tries < 1) { setLast(best); setTries(tries + 1); sfx("bad"); return; }
    sfx(ok ? "ok" : "bad");
    if (ok) addXP(8);
    setSaid([...said, { text: r.self ? bestTarget : r.heard || bestTarget, score: r.self ? null : Math.round(best.score * 100) }]);
    setLast(null); setTries(0);
    const nt = turn + 1;
    setTurn(nt);
    if (nt >= d.turns.length) {
      award("dialog");
      const scores = said.map((x) => x.score).filter((x): x is number => x != null);
      logSession("dialog", { xp: 8 * d.turns.length, ok: d.turns.length, n: d.turns.length, dur: Date.now() - start.current, sc: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : undefined });
      confetti(); sfx("win");
    }
  }
  return (
    <>
      <div className="roomtop">
        <button className="icon-btn" aria-label="Voltar" onClick={() => nav("/speak")}><Icon n="back" /></button>
        <div><b>{d.t}</b><small>{LV[d.lv].name} · diálogo falado</small></div>
        <button className={`chip${showPt ? " on" : ""}`} onClick={() => setShowPt(!showPt)}>Tradução</button>
      </div>
      <div className="msgs plain">
        {d.turns.slice(0, Math.min(turn + 1, d.turns.length)).map((tt, k) => (
          <div key={k} className="stack-s">
            <div className="bub ai"><span>{tt.npc[0]}</span>{showPt && <span className="tr">{tt.npc[1]}</span>}<span className="tools"><SpeakBtn text={tt.npc[0]} small label="Ouvir" /><SpeakBtn text={tt.npc[0]} small slow label="Devagar" /></span></div>
            {said[k] && <><div className="bub me">{said[k].text}</div>{said[k].score != null && <div className={`okmark ${said[k].score! >= 70 ? "" : "low"}`}><Icon n="wave" /> clareza {said[k].score}%</div>}</>}
          </div>
        ))}
      </div>
      {finished ? (
        <section className="card stack center">
          <b className="h2">Diálogo completo</b>
          <p className="muted">Você respondeu {d.turns.length} vezes falando em inglês.</p>
          <button className="btn primary wide" onClick={() => { setTurn(0); setSaid([]); start.current = Date.now(); }}>Fazer de novo</button>
          <button className="btn ghost wide" onClick={() => nav("/speak")}>Outros diálogos</button>
        </section>
      ) : (
        <section className="card stack">
          <b className="h3">Responda falando uma destas:</b>
          <div className="stack-s">
            {t.opts.map((o) => (
              <button key={o[0]} className="choice" onClick={() => say(o[0])}>
                <Icon n="vol" /><span><b>{o[0]}</b>{showPt && <small>{o[1]}</small>}</span>
              </button>
            ))}
          </div>
          {last && <PronResult r={last} target={lastTarget} retry />}
          <SpeakBox key={`${turn}-${tries}`} target={targets[0]} onResult={onResult} label="Toque e responda" />
        </section>
      )}
    </>
  );
}

export function MicHelp() {
  return (
    <>
      <AppBar back eyebrow="Ajuda" title="Liberar o microfone" />
      <section className="card stack">
        <b className="h3">No Android (Chrome)</b>
        <ol className="steps">
          <li>Abra o app pelo Chrome (ou pelo ícone na tela inicial).</li>
          <li>Toque no cadeado ao lado do endereço, depois em <b>Permissões</b> › <b>Microfone</b> › <b>Permitir</b>.</li>
          <li>Se não aparecer: Configurações do Android › Apps › Chrome › Permissões › Microfone › Permitir.</li>
          <li>Volte ao app e toque no botão do microfone de novo.</li>
        </ol>
      </section>
      <section className="card stack">
        <b className="h3">Por que precisa de internet</b>
        <p>O reconhecimento de fala do Chrome usa o serviço do Google. Sem internet, use o microfone do teclado ou o modo “só falei baixinho”.</p>
      </section>
      <section className="card stack">
        <b className="h3">Se nada funcionar</b>
        <p>Toque na caixa de texto e use o microfone do teclado do celular (Gboard). Ele transcreve sua fala e o app dá a nota do mesmo jeito.</p>
      </section>
    </>
  );
}
