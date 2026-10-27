// Cada tipo de exercício da sessão. Todos chamam onAnswer(acertou, detalhe) uma única vez.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { UNITS } from "../data/content";
import { Icon } from "../components/Icon";
import { Highlight, ListenRow, SpeakBtn } from "../components/ui";
import { PronResult, SpeakBox } from "../components/SpeakBox";
import type { Ex } from "../lib/session";
import { distract, sentenceOf, sentencePtOf, setCard, shuffle } from "../lib/srs";
import { say } from "../lib/speech";
import { norm, sim, type SpeechScore } from "../lib/scoring";
import { recordPron } from "../lib/state";
import { sfx, vibrate } from "../lib/fx";

export interface ExProps {
  ex: Ex;
  locked: boolean;
  onAnswer: (ok: boolean, detail?: ReactNode, target?: string) => void;
  onIntro: (known: boolean) => void;
}

export function Exercise(p: ExProps) {
  switch (p.ex.t) {
    case "intro": return <Intro {...p} />;
    case "mcqEnPt": return <Mcq {...p} from="en" to="pt" label="O que significa?" />;
    case "mcqPtEn": return <Mcq {...p} from="pt" to="en" label="Como se diz em inglês?" />;
    case "mcqAudio": return <Mcq {...p} from="audio" to="pt" label="Escuta · o que você ouviu?" />;
    case "flash": return <Flash {...p} />;
    case "listen": return <Dictation {...p} />;
    case "build": return <Build {...p} />;
    case "speak": return <SayIt {...p} />;
    case "gram": return <Gram {...p} />;
    case "pairHear": return <PairHear {...p} />;
    case "pairSay": case "sayWord": case "saySent": return <SayIt {...p} />;
  }
}

function useSayOnMount(text: string | undefined) {
  useEffect(() => { if (text) say(text); }, [text]);
}

function Intro({ ex, onIntro }: ExProps) {
  const it = ex.it!;
  useSayOnMount(it.en);
  return (
    <>
      <div className="kicker">{it.k === "w" ? "Palavra nova" : "Frase pronta"} · {UNITS[it.lv][it.u].t}</div>
      <div className="term"><mark>{it.en}</mark></div>
      <div className="term-actions"><SpeakBtn text={it.en} label="Ouvir" /><SpeakBtn text={it.en} slow label="Devagar" /></div>
      <div className="mean">{it.pt}</div>
      {it.k === "w" && (
        <button className="example" onClick={() => say(it.ex)}>
          <span className="play"><Icon n="vol" /> toque para ouvir</span>
          <span className="en"><Highlight sentence={it.ex} term={it.en} /></span>
          <span className="ptx">{it.exPt}</span>
        </button>
      )}
      <p className="micro">Repita em voz alta uma vez. Já conhece? Pule com “Já sei essa”.</p>
      <div className="dual">
        <button className="btn ghost" onClick={() => { setCard(it, 3); onIntro(true); }}>Já sei essa</button>
        <button className="btn primary" onClick={() => { setCard(it, 0); onIntro(false); }}>Entendi</button>
      </div>
    </>
  );
}

function Mcq({ ex, locked, onAnswer, from, to, label }: ExProps & { from: "en" | "pt" | "audio"; to: "en" | "pt"; label: string }) {
  const it = ex.it!;
  const opts = useMemo(() => shuffle([it[to], ...distract(it, to, 3)]), [it, to]);
  const correct = opts.indexOf(it[to]);
  const [picked, setPicked] = useState<number | null>(null);
  useSayOnMount(from !== "pt" ? it.en : undefined);
  return (
    <>
      <div className="kicker">{label}</div>
      {from === "audio" ? <ListenRow text={it.en} />
        : from === "en" ? <><div className="term"><mark>{it.en}</mark></div><div className="term-actions"><SpeakBtn text={it.en} label="Ouvir" /></div></>
        : <div className="term pt">{it.pt}</div>}
      <div className="opts">
        {opts.map((o, i) => (
          <button key={i} disabled={locked}
            className={`opt${picked != null && i === correct ? " right" : ""}${picked === i && i !== correct ? " wrong" : ""}`}
            onClick={() => { setPicked(i); onAnswer(i === correct, i === correct ? undefined : <div className="fb-d">Resposta certa: <b>{it[to]}</b></div>); }}>
            {o}
          </button>
        ))}
      </div>
    </>
  );
}

function Flash({ ex, locked, onAnswer }: ExProps) {
  const it = ex.it!;
  const [flipped, setFlipped] = useState(false);
  useSayOnMount(it.en);
  return (
    <>
      <div className="kicker">Flashcard · tente lembrar antes de virar</div>
      <button className={`flash${flipped ? " flipped" : ""}`} onClick={() => setFlipped(true)}>
        <span className="front"><mark>{it.en}</mark></span>
        <span className="back">{it.pt}<small>{it.ex}</small></span>
        <span className="tap">toque para virar</span>
      </button>
      <div className="term-actions"><SpeakBtn text={it.en} label="Ouvir" /><SpeakBtn text={it.en} slow label="Devagar" /></div>
      {flipped && (
        <div className="dual">
          <button className="btn bad" disabled={locked} onClick={() => onAnswer(false)}>Não lembrei</button>
          <button className="btn good" disabled={locked} onClick={() => onAnswer(true)}>Lembrei</button>
        </div>
      )}
    </>
  );
}

function Dictation({ ex, locked, onAnswer }: ExProps) {
  const target = ex.it!.en;
  const [v, setV] = useState("");
  const [hint, setHint] = useState("");
  useSayOnMount(target);
  const check = () => {
    if (!v.trim()) return;
    const s = sim(norm(v), norm(target));
    const ok = s >= 0.84;
    onAnswer(ok, ok ? (s < 1 ? <div className="fb-d">Quase perfeito. Confira a escrita.</div> : undefined) : <div className="fb-d">Você escreveu: <s>{v}</s></div>);
  };
  return (
    <>
      <div className="kicker">Ditado · ouça e escreva em inglês</div>
      <ListenRow text={target} />
      <div className="hintbox">{hint}</div>
      <input id="dictation" className="field" type="text" autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false}
        placeholder="Escreva o que ouviu" value={v} disabled={locked} onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); check(); } }} />
      <div className="dual">
        <button className="btn ghost" disabled={locked} onClick={() => setHint(target.split(" ").map((w) => w[0] + "_".repeat(Math.max(0, w.length - 1))).join("  "))}>Dica</button>
        <button className="btn primary" disabled={locked || !v.trim()} onClick={check}>Verificar</button>
      </div>
      <button className="link" disabled={locked} onClick={() => onAnswer(false)}>Não sei</button>
    </>
  );
}

function Build({ ex, locked, onAnswer }: ExProps) {
  const it = ex.it!;
  const sent = sentenceOf(it);
  const tokens = useMemo(() => sent.split(/\s+/), [sent]);
  const bank = useMemo(() => { let b = shuffle(tokens.map((_, i) => i)); if (b.length > 1 && b.every((x, i) => x === i)) b = b.reverse(); return b; }, [tokens]);
  const [pick, setPick] = useState<number[]>([]);
  return (
    <>
      <div className="kicker">Montar frase · traduza para o inglês</div>
      <div className="sentence">{sentencePtOf(it)}</div>
      <div className="ans-area" aria-label="Sua frase">
        {pick.map((ti, k) => <button key={k} className="tok" disabled={locked} onClick={() => setPick(pick.filter((_, j) => j !== k))}>{tokens[ti]}</button>)}
      </div>
      <div className="bank">
        {bank.map((ti) => (
          <button key={ti} className={`tok${pick.includes(ti) ? " used" : ""}`} disabled={locked}
            onClick={() => { if (!pick.includes(ti)) { setPick([...pick, ti]); sfx("tap"); } }}>{tokens[ti]}</button>
        ))}
      </div>
      <div className="dual">
        <button className="btn ghost" disabled={locked} onClick={() => setPick([])}>Limpar</button>
        <button className="btn primary" disabled={locked || pick.length !== tokens.length} onClick={() => {
          const got = pick.map((i) => tokens[i]).join(" ");
          const ok = norm(got) === norm(sent);
          onAnswer(ok, ok ? undefined : <div className="fb-d">Você montou: <s>{got}</s></div>, sent);
        }}>Verificar</button>
      </div>
    </>
  );
}

function Gram({ ex, locked, onAnswer }: ExProps) {
  const [s, options, a] = ex.q!;
  const opts = useMemo(() => shuffle(options.map((o, i) => ({ o, ok: i === a }))), [options, a]);
  const [picked, setPicked] = useState<number | null>(null);
  const full = s.includes("___") ? s.replace("___", options[a]).replace(/\s*\([^)]*\)\s*$/, "") : "";
  const parts = s.split("___");
  return (
    <>
      <div className="kicker">Gramática · {ex.u!.g.t}</div>
      <div className="sentence">{parts.length > 1 ? <>{parts[0]}<mark className="blank">&nbsp;?&nbsp;</mark>{parts[1]}</> : s}</div>
      <div className="opts">
        {opts.map((o, i) => (
          <button key={i} disabled={locked} className={`opt${picked != null && o.ok ? " right" : ""}${picked === i && !o.ok ? " wrong" : ""}`}
            onClick={() => {
              setPicked(i);
              onAnswer(o.ok, <>
                {full ? <div className="fb-ans"><SpeakBtn text={full} small /><b>{full}</b></div> : <div className="fb-d">Resposta: <b>{options[a]}</b></div>}
                <div className="fb-d muted">{ex.u!.g.t}</div>
              </>, full || undefined);
            }}>{o.o}</button>
        ))}
      </div>
    </>
  );
}

function PairHear({ ex, locked, onAnswer }: ExProps) {
  const w = ex.w!, o = ex.o!;
  const opts = useMemo(() => shuffle([w, o]), [w, o]);
  const [picked, setPicked] = useState<string | null>(null);
  useSayOnMount(w);
  return (
    <>
      <div className="kicker">Pares mínimos · qual palavra você ouviu?</div>
      <ListenRow text={w} />
      <p className="micro">As duas palavras mudam por um único som. Ouça quantas vezes quiser.</p>
      <div className="dual">
        {opts.map((x) => (
          <button key={x} disabled={locked} className={`opt big${picked && x === w ? " right" : ""}${picked === x && x !== w ? " wrong" : ""}`}
            onClick={() => { setPicked(x); onAnswer(x === w, <div className="fb-ans"><SpeakBtn text={w} small label={w} /><SpeakBtn text={o} small label={o} /></div>, w); }}>
            {x}
          </button>
        ))}
      </div>
    </>
  );
}

/** Fala: frase da sessão, palavra ou frase de dicção, par mínimo. Duas tentativas antes de contar como erro. */
function SayIt({ ex, locked, onAnswer }: ExProps) {
  const target = ex.it ? sentenceOf(ex.it) : ex.w!;
  const pt = ex.it ? sentencePtOf(ex.it) : "";
  const [tries, setTries] = useState(0);
  const [last, setLast] = useState<SpeechScore | null>(null);
  useSayOnMount(target);
  const kind = ex.t === "speak" ? "frase" : "som";
  const id = ex.it ? ex.it.id : ex.sid!;
  function result(r: SpeechScore) {
    if (locked) return;
    if (!r.self) recordPron(kind, id, r.score, target);
    const ok = !!r.self || r.score >= 0.7;
    if (!ok && tries < 1) {
      setTries(tries + 1); setLast(r); sfx("bad"); vibrate(30);
      return;
    }
    onAnswer(ok, <PronResult r={r} target={target} />, target);
  }
  const kicker = ex.t === "pairSay" ? "Pares mínimos · fale a palavra" : ex.t === "sayWord" ? "Dicção · fale a palavra" : ex.t === "saySent" ? "Dicção · fale a frase" : "Fala · repita a frase";
  return (
    <>
      <div className="kicker">{kicker}</div>
      <div className={ex.t === "pairSay" || ex.t === "sayWord" ? "term" : "sentence"}>{target}</div>
      {ex.t === "pairSay" && <p className="micro">Cuidado para não sair <s>{ex.o}</s>.</p>}
      {pt && <div className="ptx">{pt}</div>}
      <ListenRow text={target} />
      {last && <PronResult r={last} target={target} retry />}
      {!locked && <SpeakBox key={tries} target={target} pair={ex.t === "pairSay" ? ex.o : undefined} onResult={result} />}
    </>
  );
}
