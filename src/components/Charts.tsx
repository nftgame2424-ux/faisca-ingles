// Gráficos do histórico, desenhados à mão em HTML/SVG. Toque numa marca para ver o valor.
import { useState } from "react";
import { dayLabel, fmtDuration, today, weekdayShort } from "../lib/state";

function Readout({ text, idle }: { text: string; idle: string }) {
  return <div className={`readout${text ? "" : " idle"}`} aria-live="polite">{text || idle}</div>;
}

/** Calendário das últimas semanas: cada quadrado é um dia, mais escuro = mais XP. */
export function Heatmap({ days, goal, weeks = 15 }: { days: Record<string, number>; goal: number; weeks?: number }) {
  const [sel, setSel] = useState("");
  const t = today();
  const dow = new Date().getDay();
  const startDay = t - (weeks - 1) * 7 - dow;
  const cells = Array.from({ length: weeks * 7 }, (_, k) => startDay + k);
  const level = (v: number) => (v <= 0 ? 0 : v < goal / 2 ? 1 : v < goal ? 2 : v < goal * 2 ? 3 : 4);
  const active = cells.filter((d) => d <= t && (days[d] || 0) > 0).length;
  return (
    <div>
      <Readout text={sel} idle={`${active} dias com treino nas últimas ${weeks} semanas`} />
      <div className="heat-wrap">
        <div className="heat-days" aria-hidden="true"><span /><span>seg</span><span /><span>qua</span><span /><span>sex</span><span /></div>
        <div className="heat" role="grid" aria-label="Dias com treino">
          {cells.map((d) => {
            const v = days[d] || 0;
            const future = d > t;
            return (
              <button key={d} className={`q${future ? " fut" : level(v)}${d === t ? " now" : ""}`} disabled={future}
                aria-label={`${dayLabel(d)}: ${v} XP`} onClick={() => setSel(`${dayLabel(d)} · ${v} XP${v >= goal ? " · meta batida" : ""}`)} />
            );
          })}
        </div>
      </div>
      <div className="legend"><span>menos</span>{[0, 1, 2, 3, 4].map((q) => <i key={q} className={`q${q}`} />)}<span>mais</span></div>
    </div>
  );
}

/** XP por dia, com a linha da meta. */
export function XpBars({ days, goal, n = 30 }: { days: Record<string, number>; goal: number; n?: number }) {
  const [sel, setSel] = useState<number | null>(null);
  const t = today();
  const list = Array.from({ length: n }, (_, k) => t - n + 1 + k);
  const vals = list.map((d) => days[d] || 0);
  const top = Math.max(goal * 1.25, ...vals, 1);
  const total = vals.reduce((a, b) => a + b, 0);
  const met = vals.filter((v) => v >= goal).length;
  return (
    <div>
      <Readout text={sel != null ? `${dayLabel(list[sel])} · ${vals[sel]} XP` : ""} idle={`${total} XP em ${n} dias · meta batida em ${met} dias`} />
      <div className="bars" role="list">
        {list.map((d, k) => (
          <button key={d} role="listitem" className={`b${vals[k] >= goal ? " met" : ""}${sel === k ? " sel" : ""}`} aria-label={`${dayLabel(d)}: ${vals[k]} XP`} onClick={() => setSel(k)}>
            <i style={{ height: `${Math.max(vals[k] ? 4 : 1.5, (vals[k] / top) * 100)}%` }} />
          </button>
        ))}
        <div className="gl" style={{ bottom: `${(goal / top) * 100}%` }} />
      </div>
      <div className="axis"><span>{weekdayShort(list[0])} {dayLabel(list[0]).split(", ")[1] || ""}</span><span>tracejado = meta de {goal} XP</span><span>hoje</span></div>
    </div>
  );
}

/** Nota de pronúncia nas últimas tentativas. */
export function PronLine({ points }: { points: { s: number; x: string; t: number }[] }) {
  const [sel, setSel] = useState<number | null>(null);
  if (points.length < 2) return <p className="micro">Faça alguns treinos de fala para ver sua evolução aqui.</p>;
  const W = 320, H = 120, L = 30, R = 10, T = 10, B = 18;
  const x = (i: number) => L + (i * (W - L - R)) / (points.length - 1);
  const y = (v: number) => T + ((100 - v) * (H - T - B)) / 100;
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.s).toFixed(1)}`).join(" ");
  const area = `${d} L${x(points.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;
  const avg = Math.round(points.reduce((a, b) => a + b.s, 0) / points.length);
  const lastI = points.length - 1;
  return (
    <div>
      <Readout text={sel != null ? `${points[sel].s}% · “${points[sel].x}”` : ""} idle={`Média das últimas ${points.length} falas: ${avg}% · acima de 70% a fala é bem compreensível`} />
      <svg viewBox={`0 0 ${W} ${H}`} className="line-chart" role="img" aria-label={`Nota de pronúncia, média ${avg}%`}>
        {[0, 70, 100].map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className={v === 70 ? "ref" : "grid"} />
            <text x={L - 6} y={y(v) + 4} textAnchor="end" className="tick">{v}%</text>
          </g>
        ))}
        <path d={area} className="area" />
        <path d={d} className="stroke" />
        <circle cx={x(lastI)} cy={y(points[lastI].s)} r={4.5} className="end" />
        {sel != null && <circle cx={x(sel)} cy={y(points[sel].s)} r={4.5} className="selpt" />}
        {points.map((p, i) => (
          <rect key={p.t} x={x(i) - (W - L - R) / points.length / 2} y={T} width={(W - L - R) / points.length} height={H - T - B}
            className="hit" onClick={() => setSel(i)} />
        ))}
      </svg>
      <div className="axis"><span>mais antiga</span><span>agora</span></div>
    </div>
  );
}

/** Tempo por modo de treino, do maior para o menor. */
export function ModeBars({ rows }: { rows: { label: string; ms: number; count: number }[] }) {
  if (!rows.length) return <p className="micro">Seu tempo por modo aparece aqui depois do primeiro treino.</p>;
  const top = Math.max(...rows.map((r) => r.ms), 1);
  return (
    <div className="hbars">
      {rows.map((r) => (
        <div key={r.label} className="hbar">
          <span className="hl">{r.label}</span>
          <span className="ht"><i style={{ width: `${Math.max(2, (r.ms / top) * 100)}%` }} /></span>
          <span className="hv num">{fmtDuration(r.ms)} · {r.count}x</span>
        </div>
      ))}
    </div>
  );
}
