// Conversa livre com IA (opcional, com a chave da API da Anthropic do próprio usuário).
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FREE, LV, SCEN, type Level, type Scenario } from "../data/content";
import { Icon } from "../components/Icon";
import { AppBar, ListRow, SpeakBtn } from "../components/ui";
import { S, addXP, award, commit, logSession, useAppState } from "../lib/state";
import { listen, say, stopListening, useMic } from "../lib/speech";

interface Msg { role: "ai" | "me"; text: string; pt?: string; better?: string; why?: string; checked?: boolean; showPt?: boolean }
let active: { lv: Level; sc: Scenario } | null = null;

export function ChatList() {
  const s = useAppState();
  const nav = useNavigate();
  const open = (lv: Level, sc: Scenario) => { active = { lv, sc }; nav("/chat/room"); };
  return (
    <>
      <AppBar back="/speak" eyebrow="Conversa com IA" title={<>Fale com o <mark>Sam</mark></>} />
      {!s.settings.aiKey ? (
        <section className="card stack">
          <b className="h3">Precisa de uma chave da API</b>
          <p>A conversa livre usa o Claude, da Anthropic. Crie uma chave em <b>console.anthropic.com</b> e cole em Ajustes. O uso é cobrado pela Anthropic, em centavos por conversa.</p>
          <p className="micro">Sem chave, use os diálogos falados da aba Falar: são grátis.</p>
          <button className="btn primary wide" onClick={() => nav("/settings#ia")}><Icon n="key" /> Colocar minha chave</button>
        </section>
      ) : (
        <p className="muted">O Sam responde em inglês no seu nível, mostra a forma mais natural do que você disse e sugere respostas quando você travar. Toque no microfone para falar.</p>
      )}
      <h2 className="h2">{LV[s.level].name}</h2>
      <div className="stack">
        {SCEN[s.level].map((sc) => <ListRow key={sc.t} lead={<Icon n="chat" />} title={sc.t} sub={sc.d} onClick={() => open(s.level, sc)} />)}
        <ListRow lead={<Icon n="spark" />} title={FREE.t} sub={FREE.d} onClick={() => open(s.level, FREE)} />
      </div>
      <h2 className="h2">Outros níveis</h2>
      <div className="stack">
        {(["A", "B", "C"] as Level[]).filter((l) => l !== s.level).flatMap((l) =>
          SCEN[l].map((sc) => <ListRow key={l + sc.t} lead={<Icon n="chat" />} title={sc.t} sub={`${LV[l].name} · ${sc.d}`} onClick={() => open(l, sc)} />))}
      </div>
    </>
  );
}

export function ChatRoom() {
  const nav = useNavigate();
  const s = useAppState();
  const mic = useMic();
  const ctx = active;
  const [msgs, setMsgs] = useState<Msg[]>(() => (ctx ? [{ role: "ai", text: ctx.sc.o[0], pt: ctx.sc.o[1] }] : []));
  const [sugg, setSugg] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const sent = useRef(0);
  const start = useRef(Date.now());
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (ctx && S.settings.autoVoice) say(ctx.sc.o[0]); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => {
    stopListening();
    if (sent.current > 0) logSession("chat", { xp: sent.current * 5, ok: sent.current, n: sent.current, dur: Date.now() - start.current });
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy, err]);
  if (!ctx) { setTimeout(() => nav("/chat", { replace: true })); return null; }

  async function ask(history: Msg[], onlyHelp = false) {
    if (!S.settings.aiKey) { setErr("Coloque sua chave da API em Ajustes para conversar com o Sam."); return; }
    setBusy(true); setErr("");
    try {
      const { askTutor } = await import("../lib/ai");
      const r = await askTutor({
        apiKey: S.settings.aiKey, model: S.settings.aiModel, level: ctx!.lv, scenario: ctx!.sc, onlyHelp,
        history: history.map((m) => ({ role: m.role, text: m.text }))
      });
      const next = history.slice();
      const last = next[next.length - 1];
      if (!onlyHelp && last?.role === "me") {
        next[next.length - 1] = { ...last, checked: true, better: r.better.trim() || undefined, why: r.why_pt.trim() || undefined };
      }
      if (!onlyHelp && r.reply.trim()) {
        next.push({ role: "ai", text: r.reply.trim(), pt: r.reply_pt.trim() });
        if (S.settings.autoVoice) say(r.reply.trim());
      }
      setMsgs(next);
      setSugg(r.suggestions.filter((x) => x.trim()).slice(0, 3));
    } catch (e) {
      setErr(e instanceof Error && e.name !== "TypeError" ? e.message : "Não deu para falar com o Sam agora.");
    } finally { setBusy(false); }
  }
  function send(v = text) {
    const t = v.trim();
    if (!t || busy) return;
    const h = [...msgs, { role: "me" as const, text: t }];
    setMsgs(h); setText(""); setSugg([]);
    sent.current++; addXP(5); award("talk");
    ask(h);
  }
  async function talk() {
    if (listening) { stopListening(); return; }
    setListening(true);
    try { const h = await listen((t) => setText(t)); setText(h.alts[0].t); }
    catch { /* sem fala detectada */ }
    finally { setListening(false); }
  }
  return (
    <>
      <div className="roomtop">
        <button className="icon-btn" aria-label="Voltar" onClick={() => nav("/chat")}><Icon n="back" /></button>
        <div><b>{ctx.sc.t}</b><small>{LV[ctx.lv].name} · com o Sam</small></div>
        <button className={`chip${s.settings.autoVoice ? " on" : ""}`} onClick={() => { S.settings.autoVoice = !S.settings.autoVoice; commit(); }}>Voz {s.settings.autoVoice ? "ligada" : "desligada"}</button>
      </div>
      <div className="msgs">
        {msgs.map((m, i) => m.role === "ai" ? (
          <div key={i} className="bub ai">
            <span>{m.text}</span>
            {m.showPt && m.pt && <span className="tr">{m.pt}</span>}
            <span className="tools">
              <SpeakBtn text={m.text} small label="Ouvir" /><SpeakBtn text={m.text} small slow label="Devagar" />
              {m.pt && <button className="spk sm" onClick={() => setMsgs(msgs.map((x, k) => k === i ? { ...x, showPt: !x.showPt } : x))}>{m.showPt ? "Ocultar" : "Traduzir"}</button>}
            </span>
          </div>
        ) : (
          <div key={i} className="stack-s end">
            <div className="bub me">{m.text}</div>
            {m.better ? (
              <div className="fix"><span className="eyebrow">Mais natural</span><b>{m.better}</b>{m.why && <span>{m.why}</span>}<span className="tools"><SpeakBtn text={m.better} small label="Ouvir" /></span></div>
            ) : m.checked ? <div className="okmark"><Icon n="check" /> Frase natural</div> : null}
          </div>
        ))}
        {busy && <div className="typing">Sam está escrevendo…</div>}
        {err && <div className="fix wide"><span>{err}</span></div>}
        <div ref={endRef} />
      </div>
      <div className="composer">
        <div className="in">
          {sugg.length > 0 && <div className="sugg">{sugg.map((x) => <button key={x} onClick={() => setText(x)}>{x}</button>)}</div>}
          <div className="row">
            {(mic === "unknown" || mic === "ok") ? (
              <button className={`icon-btn mic-mini${listening ? " on" : ""}`} aria-label="Falar" onClick={talk}><Icon n={listening ? "stop" : "mic"} /></button>
            ) : (
              <button className="icon-btn" aria-label="Sugestões" onClick={() => ask(msgs, true)}><Icon n="spark" /></button>
            )}
            <textarea id="chat-msg" className="field" rows={1} value={text} placeholder={listening ? "Ouvindo…" : "Fale ou escreva em inglês"} enterKeyHint="send"
              onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
            <button className="send" aria-label="Enviar" disabled={busy || !text.trim()} onClick={() => send()}><Icon n="send" /></button>
          </div>
          {!sugg.length && !busy && <button className="link small" onClick={() => ask(msgs, true)}>Travou? Ver sugestões de resposta</button>}
        </div>
      </div>
    </>
  );
}
