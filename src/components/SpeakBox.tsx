// Caixa de fala: escuta pelo microfone (ou, sem microfone, pelo ditado do teclado) e dá a nota.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "./Icon";
import { SpeakBtn } from "./ui";
import { canRecord, listen, stopListening, useMic } from "../lib/speech";
import { pairScore, scoreAlts, tipsFor, type SpeechScore } from "../lib/scoring";

export function SpeakBox({ target, pair, onResult, allowSelf = true, label = "Toque e fale" }: {
  target: string; pair?: string; onResult: (r: SpeechScore) => void; allowSelf?: boolean; label?: string;
}) {
  const mic = useMic();
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [status, setStatus] = useState("");
  const [typed, setTyped] = useState("");
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; stopListening(); }, []);

  const evaluate = (alts: { t: string; c: number }[]) => onResult(pair ? pairScore(alts, target, pair) : scoreAlts(alts, target));

  async function tap() {
    if (listening) { stopListening(); return; }
    setListening(true); setInterim(""); setStatus("Ouvindo… fale agora");
    try {
      const h = await listen((t) => alive.current && setInterim(t));
      if (!alive.current) return;
      setListening(false); setStatus("");
      evaluate(h.alts);
    } catch (err) {
      if (!alive.current) return;
      setListening(false);
      const e = String(err);
      setStatus(
        e === "no-speech" ? "Não ouvi nada. Toque e fale mais perto do celular." :
        e === "network" ? "O reconhecimento de voz precisa de internet." :
        e === "aborted" ? "" :
        ["not-allowed", "service-not-allowed", "blocked", "audio-capture"].includes(e) ? "" :
        "Não deu certo. Toque e tente de novo."
      );
    }
  }

  const micReady = mic === "unknown" || mic === "ok";
  return (
    <div className="speak">
      {micReady ? (
        <>
          <button className={`mic-btn${listening ? " on" : ""}`} onClick={tap} aria-label={listening ? "Parar de ouvir" : "Falar"}>
            <Icon n={listening ? "stop" : "mic"} />
          </button>
          <div className="mic-status" aria-live="polite">{status || (listening ? "Ouvindo…" : label)}</div>
          {interim && <div className="heard">“{interim}”</div>}
        </>
      ) : (
        <>
          <div className="kb-note">
            <Icon n="info" />
            <span>
              {mic === "blocked" ? "O microfone está bloqueado para este site. " : "Este navegador não reconhece fala. "}
              Toque na caixa e use o microfone do teclado. <Link to="/michelp">Como liberar o microfone</Link>
            </span>
          </div>
          <textarea className="field" rows={2} value={typed} onChange={(e) => setTyped(e.target.value)}
            placeholder="Fale com o microfone do teclado" id="kb-speech" />
          <button className="btn primary wide" disabled={!typed.trim()} onClick={() => evaluate([{ t: typed, c: 0 }])}>Verificar fala</button>
        </>
      )}
      {allowSelf && (
        <button className="link" onClick={() => onResult({ score: 1, words: [], heard: "", conf: 0, self: true })}>
          Estou em lugar público: só falei baixinho
        </button>
      )}
    </div>
  );
}

export function PronResult({ r, target, retry }: { r: SpeechScore; target: string; retry?: boolean }) {
  if (r.self) return <div className="fb-d">Shadowing feito. Falar em voz alta treina a boca e o ouvido juntos.</div>;
  const pct = Math.round(r.score * 100);
  const band = r.score >= 0.85 ? "good" : r.score >= 0.7 ? "ok" : "low";
  const msg = r.wrongPair ? `Saiu parecido com “${r.wrongPair}”.`
    : r.score >= 0.85 ? "Excelente, ficou bem claro."
    : r.score >= 0.7 ? "Boa, deu para entender."
    : r.score >= 0.4 ? "Quase. Foque nas palavras marcadas."
    : "Não entendi bem. Ouça devagar e tente de novo.";
  const tips = tipsFor(r.words);
  return (
    <div className="pron">
      <div className="pron-top">
        <div className={`pscore ${band}`}><b className="num">{pct}%</b><span>clareza</span></div>
        <div className="pron-body">
          <b>{msg}</b>
          {r.words.length > 0 && (
            <div className="diff">{r.words.map((w, i) => <span key={i} className={w.hit ? (w.near ? "near" : "hit") : "miss"}>{w.w}</span>)}</div>
          )}
          {r.heard && <div className="micro">O app ouviu: “{r.heard}”</div>}
        </div>
      </div>
      {tips.length > 0 && <ul className="tips">{tips.map((t) => <li key={t.id}><Icon n="wave" />{t.text}</li>)}</ul>}
      {retry && <div className="row"><span className="micro">Mais uma tentativa. Ouça devagar e fale de novo.</span><SpeakBtn text={target} slow small label="Devagar" /></div>}
    </div>
  );
}

/** Grava até 6 segundos da sua voz para você comparar com o modelo. */
export function Recorder({ model }: { model: string }) {
  const [state, setState] = useState<"idle" | "rec" | "done" | "off">(canRecord() ? "idle" : "off");
  const [url, setUrl] = useState("");
  const mr = useRef<MediaRecorder | null>(null);
  useEffect(() => () => { if (mr.current?.state === "recording") mr.current.stop(); if (url) URL.revokeObjectURL(url); }, [url]);
  if (state === "off") return null;

  async function start() {
    if (mr.current?.state === "recording") { mr.current.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const rec = new MediaRecorder(stream);
      mr.current = rec;
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const u = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
        setUrl(u); setState("done");
        new Audio(u).play().catch(() => undefined);
      };
      rec.start();
      setState("rec");
      setTimeout(() => { if (rec.state === "recording") rec.stop(); }, 6000);
    } catch {
      setState("off");
    }
  }
  return (
    <div className="rec">
      <div className="row wrap">
        <button className={`btn ghost${state === "rec" ? " recording" : ""}`} onClick={start}>
          <Icon n={state === "rec" ? "stop" : "rec"} />{state === "rec" ? "Parar gravação" : state === "done" ? "Gravar de novo" : "Gravar minha voz"}
        </button>
        <SpeakBtn text={model} label="Modelo" />
      </div>
      {url && <audio controls src={url} />}
      <p className="micro">Grave, escute a sua voz e compare com o modelo. Ouvir a si mesmo ajuda a perceber onde a dicção embola.</p>
    </div>
  );
}
