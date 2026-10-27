import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, type IconName } from "./Icon";
import { say } from "../lib/speech";
import { useToast } from "../lib/state";

export function AppBar({ eyebrow, title, back, right }: { eyebrow?: string; title: ReactNode; back?: string | true; right?: ReactNode }) {
  const nav = useNavigate();
  return (
    <header className="appbar">
      {back && (
        <button className="icon-btn" aria-label="Voltar" onClick={() => (back === true ? nav(-1) : nav(back))}><Icon n="back" /></button>
      )}
      <div className="appbar-t">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="h1">{title}</h1>
      </div>
      {right}
    </header>
  );
}

export function SettingsButton() {
  const nav = useNavigate();
  return <button className="icon-btn" aria-label="Ajustes" onClick={() => nav("/settings")}><Icon n="gear" /></button>;
}

export function SpeakBtn({ text, slow, label, small }: { text: string; slow?: boolean; label?: string; small?: boolean }) {
  return (
    <button className={`spk${small ? " sm" : ""}`} aria-label={slow ? "Ouvir devagar" : "Ouvir"} onClick={(e) => { e.stopPropagation(); say(text, slow); }}>
      <Icon n="vol" />{label}
    </button>
  );
}

export function ListenRow({ text }: { text: string }) {
  return (
    <div className="listen-row">
      <button className="big-spk" aria-label="Ouvir" onClick={() => say(text)}><Icon n="vol" /></button>
      <button className="big-spk slow" aria-label="Ouvir devagar" onClick={() => say(text, true)}><Icon n="vol" /><span className="slowtag">lento</span></button>
    </div>
  );
}

export function Ring({ value, max, label, size = 72 }: { value: number; max: number; label: string; size?: number }) {
  const r = 30, c = 2 * Math.PI * r, f = Math.min(1, max ? value / max : 0);
  return (
    <svg className="ring" viewBox="0 0 72 72" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${Math.round(f * 100)}%`}>
      <circle className="tr" cx="36" cy="36" r={r} />
      <circle className="fg" cx="36" cy="36" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - f)} transform="rotate(-90 36 36)" />
      <text x="36" y="42" textAnchor="middle">{Math.round(f * 100)}%</text>
    </svg>
  );
}

export function Tile({ icon, title, sub, onClick, tone, wide }: { icon: IconName; title: string; sub: ReactNode; onClick: () => void; tone?: "y" | "g"; wide?: boolean }) {
  return (
    <button className={`tile${wide ? " wide" : ""}`} onClick={onClick}>
      <span className={`ti ${tone || ""}`}><Icon n={icon} /></span>
      <div><b>{title}</b><small>{sub}</small></div>
      {wide && <Icon n="arrow" />}
    </button>
  );
}

export function ListRow({ lead, title, sub, onClick, right, highlight, done, progress }: {
  lead: ReactNode; title: ReactNode; sub?: ReactNode; onClick?: () => void; right?: ReactNode; highlight?: boolean; done?: boolean; progress?: number;
}) {
  return (
    <button className={`row-item${highlight ? " next" : ""}${done ? " done" : ""}`} onClick={onClick}>
      <span className="n">{lead}</span>
      <div>
        <b>{title}</b>
        {sub && <small>{sub}</small>}
        {progress != null && <div className="pbar"><i style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} /></div>}
      </div>
      {right ?? <Icon n="arrow" />}
    </button>
  );
}

export function Highlight({ sentence, term }: { sentence: string; term: string }) {
  const i = sentence.toLowerCase().indexOf(term.toLowerCase());
  if (i < 0) return <>{sentence}</>;
  return <>{sentence.slice(0, i)}<mark>{sentence.slice(i, i + term.length)}</mark>{sentence.slice(i + term.length)}</>;
}

export function Toaster() {
  const msg = useToast();
  return msg ? <div className="toast" role="status">{msg}</div> : null;
}
