// Voz: leitura em inglês (speechSynthesis) e reconhecimento da sua fala (Web Speech API do Chrome).
import { useSyncExternalStore } from "react";
import { S, toast } from "./state";

/* ---------- Leitura em voz alta ---------- */
let voices: SpeechSynthesisVoice[] = [];
const voiceSubs = new Set<() => void>();
let voiceVer = 0;
function readVoices(): SpeechSynthesisVoice[] {
  try { return (window.speechSynthesis?.getVoices() || []).filter((v) => /^en([-_]|$)/i.test(v.lang)); }
  catch { return []; }
}
function loadVoices() {
  voices = readVoices();
  voiceVer++;
  voiceSubs.forEach((f) => f());
}
if (typeof window !== "undefined" && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}
export function useVoices(): SpeechSynthesisVoice[] {
  useSyncExternalStore((cb) => { voiceSubs.add(cb); return () => voiceSubs.delete(cb); }, () => voiceVer);
  return voices;
}
export function pickVoice(): SpeechSynthesisVoice | null {
  // Lê de novo sem avisar a interface: avisar aqui, durante a renderização, criaria um loop.
  if (!voices.length) voices = readVoices();
  if (S.settings.voice) { const v = voices.find((x) => x.name === S.settings.voice); if (v) return v; }
  const acc = S.settings.accent.toLowerCase();
  const same = voices.filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith(acc));
  const pref = same.find((v) => /natural|neural|premium|enhanced|google/i.test(v.name));
  return pref || same[0] || voices[0] || null;
}
export function say(text: string, slow = false): SpeechSynthesisUtterance | null {
  const ss = window.speechSynthesis;
  if (!ss) { toast("Este navegador não tem voz. Use o Chrome."); return null; }
  try {
    ss.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = S.settings.accent;
    u.rate = slow ? Math.max(0.5, S.settings.rate - 0.35) : S.settings.rate;
    ss.speak(u);
    return u;
  } catch { return null; }
}
export function stopSpeaking() { try { window.speechSynthesis?.cancel(); } catch { /* sem voz */ } }

/* ---------- Reconhecimento de fala ---------- */
export type MicState = "unknown" | "ok" | "blocked" | "none";
type SRCtor = new () => SpeechRecognitionLike;
interface SRAlt { transcript: string; confidence: number }
interface SRResult { isFinal: boolean; length: number; [i: number]: SRAlt }
interface SREvent { resultIndex: number; results: { length: number; [i: number]: SRResult } }
interface SpeechRecognitionLike {
  lang: string; interimResults: boolean; maxAlternatives: number; continuous: boolean;
  onresult: ((e: SREvent) => void) | null; onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
}
const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
const SR: SRCtor | undefined = w.SpeechRecognition || w.webkitSpeechRecognition;

let mic: MicState = SR ? "unknown" : "none";
const micSubs = new Set<() => void>();
function setMic(m: MicState) { if (mic !== m) { mic = m; micSubs.forEach((f) => f()); } }
export const micAvailable = () => mic === "unknown" || mic === "ok";
export function useMic(): MicState {
  return useSyncExternalStore((cb) => { micSubs.add(cb); return () => micSubs.delete(cb); }, () => mic);
}

export interface Heard { alts: { t: string; c: number }[] }
let current: SpeechRecognitionLike | null = null;
export const isListening = () => current !== null;
export function stopListening() { try { current?.stop(); } catch { /* já parou */ } }

/** Escuta uma fala em inglês. Rejeita com o código do erro ("no-speech", "not-allowed", ...). */
export function listen(onInterim?: (t: string) => void): Promise<Heard> {
  return new Promise((resolve, reject) => {
    if (!SR) { setMic("none"); reject("unsupported"); return; }
    stopSpeaking();
    let r: SpeechRecognitionLike;
    try { r = new SR(); } catch { setMic("blocked"); reject("blocked"); return; }
    r.lang = S.settings.accent;
    r.interimResults = true;
    r.maxAlternatives = 5;
    r.continuous = false;
    let finals: { t: string; c: number }[] | null = null;
    let interim = "";
    let failed = false;
    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) {
          finals = [];
          for (let k = 0; k < res.length; k++) finals.push({ t: res[k].transcript, c: res[k].confidence });
        } else interim = res[0].transcript;
      }
      onInterim?.(finals ? finals[0].t : interim);
    };
    r.onerror = (e) => {
      failed = true;
      if (["not-allowed", "service-not-allowed", "audio-capture"].includes(e.error)) setMic("blocked");
      reject(e.error);
    };
    r.onend = () => {
      current = null;
      if (failed) return;
      if (finals && finals.length) { setMic("ok"); resolve({ alts: finals }); }
      else if (interim) { setMic("ok"); resolve({ alts: [{ t: interim, c: 0 }] }); }
      else reject("no-speech");
    };
    try { r.start(); current = r; } catch { reject("start"); }
  });
}

/* ---------- Gravação da própria voz ---------- */
export const canRecord = () =>
  typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia && mic !== "blocked";
