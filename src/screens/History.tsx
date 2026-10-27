// Histórico do aprendizado: constância, tempo, palavras aprendidas, pronúncia e linha do tempo.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LV, type Level } from "../data/content";
import { SOUNDS } from "../data/diction";
import { BADGES, MODES } from "../data/meta";
import { Icon } from "../components/Icon";
import { AppBar, ListRow, SettingsButton, SpeakBtn } from "../components/ui";
import { Heatmap, ModeBars, PronLine, XpBars } from "../components/Charts";
import { ITEMS, hardItems, knownCount } from "../lib/srs";
import { buildReview } from "../lib/session";
import { dayLabel, fmtDuration, liveStreak, useAppState, type LogEntry } from "../lib/state";
import { startRun } from "./Run";

function entryLine(e: LogEntry): string {
  const parts = [fmtDuration(e.dur), `+${e.xp} XP`];
  if (e.m === "memory") parts.push(`${e.ok} pares em ${e.n} jogadas`);
  else if (e.m === "twister" || e.m === "dialog") { if (e.sc != null) parts.push(`clareza ${e.sc}%`); }
  else if (e.m === "blitz") parts.push(`${e.ok} pontos`);
  else if (e.n && e.m !== "warm" && e.m !== "story") parts.push(`${Math.round((e.ok / e.n) * 100)}% de acertos`);
  if (e.nw) parts.push(`${e.nw} novos`);
  return parts.join(" · ");
}

export function History() {
  const s = useAppState();
  const nav = useNavigate();
  const [daysShown, setDaysShown] = useState(7);
  const totalMs = s.log.reduce((a, e) => a + e.dur, 0);
  const learnedByDay: Record<number, number> = {};
  Object.values(s.cards).forEach((c) => { learnedByDay[c.f] = (learnedByDay[c.f] || 0) + 1; });
  const pron = s.pronLog.slice(-24);
  const pronAll = s.pronLog.slice(-20);
  const pronAvg = pronAll.length ? Math.round(pronAll.reduce((a, b) => a + b.s, 0) / pronAll.length) : null;

  const byMode: Record<string, { ms: number; count: number }> = {};
  s.log.forEach((e) => { const k = MODES[e.m]?.t || e.m; byMode[k] = byMode[k] || { ms: 0, count: 0 }; byMode[k].ms += e.dur; byMode[k].count++; });
  const modeRows = Object.entries(byMode).map(([label, v]) => ({ label, ...v })).sort((a, b) => b.ms - a.ms).slice(0, 8);

  const groups: { d: number; items: LogEntry[] }[] = [];
  s.log.slice(-300).reverse().forEach((e) => {
    const g = groups[groups.length - 1];
    if (g && g.d === e.d) g.items.push(e); else groups.push({ d: e.d, items: [e] });
  });
  const hard = hardItems(8);
  const sounds = SOUNDS.filter((x) => s.pron[x.id]?.length).map((x) => {
    const a = s.pron[x.id];
    const recent = a.slice(-5), first = a.slice(0, 5);
    const avg = (z: number[]) => Math.round(z.reduce((p, q) => p + q, 0) / z.length);
    return { x, now: avg(recent), then: avg(first), n: a.length };
  });

  return (
    <>
      <AppBar eyebrow="Histórico" title="Seu aprendizado" right={<SettingsButton />} />
      <div className="stats">
        <div className="stat"><b className="num">{fmtDuration(totalMs)}</b><span>tempo de treino</span></div>
        <div className="stat"><b className="num">{knownCount()}</b><span>palavras e frases conhecidas</span></div>
        <div className="stat"><b className="num">{liveStreak()}</b><span>dias seguidos · recorde {s.bestStreak}</span></div>
        <div className="stat"><b className="num">{pronAvg == null ? "–" : `${pronAvg}%`}</b><span>clareza média da fala</span></div>
      </div>

      <section className="card"><div className="sec-h"><b className="h3">Constância</b><span className="micro">{s.xp} XP no total</span></div><Heatmap days={s.days} goal={s.settings.goal} /></section>
      <section className="card"><div className="sec-h"><b className="h3">XP por dia</b><span className="micro">últimos 30 dias</span></div><XpBars days={s.days} goal={s.settings.goal} /></section>
      <section className="card"><div className="sec-h"><b className="h3">Pronúncia</b><span className="micro">últimas falas avaliadas</span></div><PronLine points={pron} /></section>

      {sounds.length > 0 && (
        <section className="card stack">
          <b className="h3">Evolução por som</b>
          {sounds.map(({ x, now, then, n }) => (
            <button key={x.id} className="sound-row" onClick={() => nav(`/sound/${x.id}`)}>
              <span className="ipa">{x.ipa.split(" ")[0]}</span>
              <span className="grow"><b>{x.t.split(" (")[0]}</b><small>{n} tentativas · começou em {then}%</small></span>
              <span className={`pill ${now >= 85 ? "good" : now >= 70 ? "ok" : "low"}`}>{now}%</span>
            </button>
          ))}
        </section>
      )}

      <section className="card stack">
        <b className="h3">Por nível</b>
        {(["A", "B", "C"] as Level[]).map((l) => {
          const tot = ITEMS.filter((i) => i.lv === l).length, k = knownCount(l);
          return (
            <div key={l}>
              <div className="row between"><span>{LV[l].name} <span className="micro">{LV[l].cefr}</span></span><span className="num micro">{k}/{tot}</span></div>
              <div className="pbar mt6"><i style={{ width: `${(k / tot) * 100}%` }} /></div>
            </div>
          );
        })}
      </section>

      <section className="card stack"><b className="h3">Tempo por modo</b><ModeBars rows={modeRows} /></section>

      {hard.length > 0 && (
        <section className="card stack">
          <div className="sec-h"><b className="h3">Palavras que você mais erra</b></div>
          <div className="wlist">
            {hard.map((it) => (
              <div key={it.id} className="witem static"><div><b>{it.en}</b><small>{it.pt} · errou {s.cards[it.id].w}x</small></div><SpeakBtn text={it.en} small /></div>
            ))}
          </div>
          <button className="btn primary wide" onClick={() => startRun(nav, buildReview(hard))}><Icon n="target" /> Treinar essas palavras</button>
        </section>
      )}

      <h2 className="h2">Linha do tempo</h2>
      {groups.length === 0 ? <p className="micro">Seus treinos aparecem aqui, dia a dia.</p> : (
        <div className="timeline">
          {groups.slice(0, daysShown).map((g) => (
            <div key={g.d} className="tl-day">
              <div className="tl-h"><b>{dayLabel(g.d)}</b><span className="micro">{g.items.reduce((a, e) => a + e.xp, 0)} XP{learnedByDay[g.d] ? ` · ${learnedByDay[g.d]} itens novos` : ""}</span></div>
              {g.items.map((e) => (
                <div key={e.t} className="tl-item">
                  <span className="ti sm"><Icon n={MODES[e.m]?.icon || "spark"} /></span>
                  <div><b>{MODES[e.m]?.t || e.m}</b><small>{entryLine(e)}</small></div>
                  <span className="micro num">{new Date(e.t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              ))}
            </div>
          ))}
          {groups.length > daysShown && <button className="btn ghost wide" onClick={() => setDaysShown(daysShown + 14)}>Ver mais dias</button>}
        </div>
      )}

      <h2 className="h2">Conquistas</h2>
      <div className="badges">
        {BADGES.map((b) => (
          <div key={b.id} className={`badge${s.badges.includes(b.id) ? " got" : ""}`}><Icon n={b.icon} /><b>{b.t}</b><span className="muted">{b.d}</span></div>
        ))}
      </div>
      <ListRow lead={<Icon n="gear" />} title="Ajustes e backup" sub="Voz, metas, microfone, copiar ou restaurar o progresso" onClick={() => nav("/settings")} />
    </>
  );
}
