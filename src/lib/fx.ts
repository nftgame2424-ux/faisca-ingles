// Sons curtos de acerto/erro, vibração e confete.
import { S } from "./state";

let ctx: AudioContext | null = null;
export function sfx(kind: "ok" | "bad" | "win" | "tap") {
  if (!S.settings.sfx) return;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = ctx || new AC();
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.connect(g); g.connect(ctx.destination);
    if (kind === "ok") { o.frequency.setValueAtTime(660, t); o.frequency.setValueAtTime(990, t + 0.08); }
    else if (kind === "tap") { o.frequency.setValueAtTime(880, t); }
    else if (kind === "bad") { o.type = "triangle"; o.frequency.setValueAtTime(240, t); o.frequency.linearRampToValueAtTime(150, t + 0.2); }
    else { o.frequency.setValueAtTime(523, t); o.frequency.setValueAtTime(784, t + 0.12); o.frequency.setValueAtTime(1046, t + 0.24); }
    const len = kind === "win" ? 0.5 : kind === "tap" ? 0.06 : 0.26;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.14, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.start(t); o.stop(t + len + 0.05);
  } catch { /* áudio indisponível */ }
}
export function vibrate(p: number | number[]) {
  if (!S.settings.vib) return;
  try { navigator.vibrate?.(p); } catch { /* sem vibração */ }
}
export function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const layer = document.createElement("div");
  layer.className = "confetti";
  const cs = getComputedStyle(document.documentElement);
  const cols = ["--accent", "--hi", "--good", "--warm"].map((v) => cs.getPropertyValue(v));
  for (let i = 0; i < 36; i++) {
    const p = document.createElement("i");
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = cols[i % cols.length];
    p.style.setProperty("--dx", `${Math.random() * 160 - 80}px`);
    p.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
    p.style.animationDelay = `${Math.random() * 0.35}s`;
    layer.appendChild(p);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 2300);
}
