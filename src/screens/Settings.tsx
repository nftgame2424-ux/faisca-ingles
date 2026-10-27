import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LV, type Level } from "../data/content";
import { SCIENCE } from "../data/meta";
import { Icon } from "../components/Icon";
import { AppBar } from "../components/ui";
import { AI_MODELS } from "../lib/aiModels";
import { S, commit, freshState, mergeState, replaceState, toast, useAppState } from "../lib/state";
import { listen, pickVoice, say, useMic, useVoices } from "../lib/speech";

export function Settings() {
  const s = useAppState();
  const nav = useNavigate();
  const voices = useVoices();
  const mic = useMic();
  const [key, setKey] = useState(s.settings.aiKey);
  const [backup, setBackup] = useState("");
  const [armReset, setArmReset] = useState(false);
  const [armImport, setArmImport] = useState(false);
  const [micTest, setMicTest] = useState("");
  useEffect(() => { if (location.hash.includes("ia")) document.getElementById("ia")?.scrollIntoView(); }, []);
  const set = <K extends keyof typeof s.settings>(k: K, v: (typeof s.settings)[K]) => { S.settings[k] = v; commit(); };
  const accVoices = voices.filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith(s.settings.accent.toLowerCase()));
  const cur = pickVoice();

  async function testMic() {
    setMicTest("Fale “Hello, how are you?”…");
    try { const h = await listen((t) => setMicTest(`Ouvindo: “${t}”`)); setMicTest(`O app ouviu: “${h.alts[0].t}”`); }
    catch (e) { setMicTest(String(e) === "no-speech" ? "Não ouvi nada. Tente de novo mais perto do celular." : "O microfone não respondeu. Veja a ajuda abaixo."); }
  }
  async function copyBackup() {
    const txt = JSON.stringify(S);
    try { await navigator.clipboard.writeText(txt); toast("Progresso copiado. Guarde num lugar seguro."); }
    catch { setBackup(txt); toast("Selecione o texto abaixo e copie."); }
  }
  function importBackup() {
    if (!armImport) { setArmImport(true); return; }
    try {
      const o = JSON.parse(backup);
      if (!o || typeof o !== "object" || !("cards" in o)) throw new Error("formato");
      replaceState(mergeState(o));
      toast("Progresso restaurado"); setBackup(""); setArmImport(false);
    } catch { toast("Esse texto não é um backup válido do Faísca."); setArmImport(false); }
  }

  return (
    <>
      <AppBar back eyebrow="Ajustes" title="Do seu jeito" />
      <h2 className="h2">Voz</h2>
      <section className="card set">
        <label><span>Sotaque</span>
          <select value={s.settings.accent} onChange={(e) => { set("accent", e.target.value); set("voice", ""); say("Hello! This is how I sound."); }}>
            <option value="en-US">Americano</option><option value="en-GB">Britânico</option><option value="en-AU">Australiano</option>
          </select></label>
        <label><span>Voz</span>
          <select value={s.settings.voice} onChange={(e) => { set("voice", e.target.value); say("Hello! This is how I sound."); }}>
            <option value="">Automática{cur ? ` (${cur.name.slice(0, 22)})` : ""}</option>
            {accVoices.map((v) => <option key={v.name} value={v.name}>{v.name}</option>)}
          </select></label>
        <label><span>Velocidade <b className="num">{s.settings.rate.toFixed(2)}x</b></span>
          <input type="range" min={0.6} max={1.2} step={0.05} value={s.settings.rate} onChange={(e) => set("rate", Number(e.target.value))} onPointerUp={() => say("I like to learn English every day.")} /></label>
        <div className="srow"><span className="micro">{voices.length ? `${voices.length} vozes em inglês neste aparelho` : "Nenhuma voz em inglês encontrada. Instale em Configurações › Texto para fala (Android)."}</span>
          <button className="spk" onClick={() => say("Hi! I'm your English voice. Let's practice together.")}><Icon n="vol" />Testar</button></div>
      </section>

      <h2 className="h2">Microfone</h2>
      <section className="card stack">
        <div className="row between"><span>Situação</span><span className={`pill ${mic === "ok" ? "good" : mic === "unknown" ? "ok" : "low"}`}>{mic === "ok" ? "funcionando" : mic === "unknown" ? "não testado" : mic === "blocked" ? "bloqueado" : "sem suporte"}</span></div>
        {(mic === "ok" || mic === "unknown") && <button className="btn ghost wide" onClick={testMic}><Icon n="mic" /> Testar microfone</button>}
        {micTest && <p className="micro">{micTest}</p>}
        <button className="link self-start" onClick={() => nav("/michelp")}>Ajuda com o microfone</button>
      </section>

      <h2 className="h2">Estudo</h2>
      <section className="card set">
        <label><span>Nível atual</span><select value={s.level} onChange={(e) => { S.level = e.target.value as Level; commit(); }}>
          {(["A", "B", "C"] as Level[]).map((l) => <option key={l} value={l}>{LV[l].name}</option>)}</select></label>
        <label><span>Duração da sessão</span><select value={s.settings.min} onChange={(e) => set("min", Number(e.target.value))}>
          {[2, 5, 10, 15].map((m) => <option key={m} value={m}>{m} min</option>)}</select></label>
        <label><span>Meta diária</span><select value={s.settings.goal} onChange={(e) => set("goal", Number(e.target.value))}>
          {[30, 50, 100, 150, 200].map((m) => <option key={m} value={m}>{m} XP</option>)}</select></label>
        <label><span>Sons</span><input type="checkbox" className="switch" checked={s.settings.sfx} onChange={(e) => set("sfx", e.target.checked)} /></label>
        <label><span>Vibração</span><input type="checkbox" className="switch" checked={s.settings.vib} onChange={(e) => set("vib", e.target.checked)} /></label>
        <label className="col"><span>Meu plano (quando vou treinar)</span>
          <input type="text" id="intention-set" value={s.intention} placeholder="Ex.: Depois do café" onChange={(e) => { S.intention = e.target.value; commit(); }} /></label>
      </section>

      <h2 className="h2" id="ia">Conversa com IA (opcional)</h2>
      <section className="card stack">
        <p className="micro">A conversa livre com o Sam usa o Claude. Crie uma chave em console.anthropic.com › API Keys. A chave fica só neste aparelho e o uso é cobrado na sua conta da Anthropic.</p>
        <input type="password" className="field" id="ai-key" autoComplete="off" placeholder="sk-ant-…" value={key} onChange={(e) => setKey(e.target.value)} />
        <div className="dual">
          <button className="btn ghost" onClick={() => { setKey(""); set("aiKey", ""); toast("Chave removida"); }}>Remover</button>
          <button className="btn primary" disabled={!key.trim()} onClick={() => { set("aiKey", key.trim()); toast("Chave salva"); }}>Salvar chave</button>
        </div>
        <label className="set-inline"><span>Modelo</span>
          <select value={s.settings.aiModel} onChange={(e) => set("aiModel", e.target.value)}>{AI_MODELS.map((m) => <option key={m.id} value={m.id}>{m.t}</option>)}</select></label>
      </section>

      <h2 className="h2">Backup do progresso</h2>
      <section className="card stack">
        <p className="micro">Seu progresso fica salvo neste aparelho. Para levar para outro celular, copie o backup e cole lá.</p>
        <button className="btn ghost wide" onClick={copyBackup}><Icon n="copy" /> Copiar meu progresso</button>
        <textarea className="field mono-sm" id="backup" rows={3} value={backup} placeholder="Cole aqui um backup para restaurar" onChange={(e) => { setBackup(e.target.value); setArmImport(false); }} />
        <button className={`btn wide ${armImport ? "bad" : "ghost"}`} disabled={!backup.trim()} onClick={importBackup}>{armImport ? "Toque de novo: isso substitui o progresso atual" : "Restaurar este backup"}</button>
      </section>

      <h2 className="h2">Por que este método funciona</h2>
      <div>{SCIENCE.map(([t, b, c]) => <details key={t} className="sci"><summary>{t}</summary><p>{b}</p><cite>{c}</cite></details>)}</div>

      <button className={`btn wide ${armReset ? "bad" : "ghost"}`} onClick={() => {
        if (!armReset) { setArmReset(true); setTimeout(() => setArmReset(false), 4000); return; }
        replaceState(freshState()); nav("/onboard", { replace: true });
      }}>{armReset ? "Toque de novo para apagar tudo" : "Apagar progresso"}</button>
    </>
  );
}
