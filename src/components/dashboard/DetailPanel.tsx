"use client";

import type { ComputedZone, ViewKey } from "@/lib/types";
import { PROVINCES } from "@/lib/types";
import { yieldColor, scoreColor, flipScoreColor, trendInfo, marginColor } from "@/lib/calculations";
import { InfoTip } from "./InfoTip";

type Props = {
  zone: ComputedZone | null;
  view: ViewKey;
  ltv: number;
};

function Metric({ label, value, color, highlight, infoTerm }: {
  label: string; value: string; color?: string; highlight?: boolean; infoTerm?: string;
}) {
  return (
    <div className={`p-3 ${highlight ? "bg-amber-50/60" : "bg-white"}`}
      style={highlight && color ? { borderLeft: `2px solid ${color}` } : undefined}>
      <div className="text-[9px] tracking-[0.15em] uppercase text-stone-400 font-semibold flex items-center gap-0.5">
        {label}
        {infoTerm && <InfoTip term={infoTerm} />}
      </div>
      <div className="text-base font-semibold mt-1" style={{ color: color || "#292524" }}>
        {value}
      </div>
    </div>
  );
}

export function DetailPanel({ zone, view, ltv }: Props) {
  if (!zone) {
    return (
      <div className="rounded-xl bg-white border border-stone-200 p-6 min-h-[380px] flex items-center justify-center shadow-sm">
        <div className="text-center text-stone-400">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <div className="text-sm mb-4 font-medium">Seleziona una zona per i dettagli</div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-center gap-2">
              <span className="text-emerald-500">▲</span>
              <span>fondamentali in ascesa</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-amber-500">◆</span>
              <span>stabili</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-red-500">▼</span>
              <span>in declino</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isFlipView = view === "MAP_FLIP" || view === "FLIP_CALC";
  const t = trendInfo(zone.trend);
  const provColor = PROVINCES[zone.province].color;

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${
      isFlipView
        ? "bg-emerald-50/30 border-emerald-200/60"
        : "bg-white border-stone-200"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div className="text-[10px] tracking-[0.25em] uppercase text-stone-400 font-semibold">
          Provincia di {PROVINCES[zone.province].name}
        </div>
        <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: provColor }} />
      </div>
      <h2 className="text-xl font-bold text-stone-800 mb-1 flex items-center gap-2.5">
        <span style={{ color: t.color }} className="text-sm">{t.char}</span>
        {zone.name}
      </h2>
      <p className="text-[13px] text-stone-500 mb-4 leading-relaxed">
        {isFlipView ? zone.flipNote : zone.note}
      </p>

      {isFlipView ? (
        <>
          <div className="grid grid-cols-3 gap-px rounded-lg overflow-hidden mb-2 border border-emerald-200/60 bg-emerald-200/40">
            <Metric label="Flip score" value={`${zone.flipScore.toFixed(1)}/10`} color={flipScoreColor(zone.flipScore)} highlight infoTerm="Flip Score" />
            <Metric label="Premio energ." value={`+${zone.energyPremium}%`}
              color={zone.energyPremium >= 20 ? "#16a34a" : zone.energyPremium >= 12 ? "#d97706" : "#dc2626"}
              infoTerm="Premio energetico" />
            <Metric label="Stock F/G" value={`${zone.fgStock}%`}
              color={zone.fgStock >= 60 ? "#16a34a" : "#d97706"}
              infoTerm="Stock F/G" />
          </div>
          <div className="grid grid-cols-2 gap-px rounded-lg overflow-hidden mb-3 border border-emerald-200/60 bg-emerald-200/40">
            <Metric label="Sconto OMI" value={`–${zone.typicalDiscount}%`} color="#d97706" infoTerm="Sconto OMI" />
            <Metric label="DOM tipico" value={`${zone.dom} giorni`}
              color={zone.dom < 70 ? "#16a34a" : zone.dom < 100 ? "#d97706" : "#dc2626"}
              infoTerm="DOM" />
          </div>

          {zone.flip && (
            <div className={`rounded-lg p-4 mb-3 border ${
              zone.flip.marginPct > 5
                ? "bg-emerald-50 border-emerald-200"
                : zone.flip.marginPct > 0
                ? "bg-amber-50 border-amber-200"
                : "bg-red-50 border-red-200"
            }`}
              style={{ borderLeft: `3px solid ${marginColor(zone.flip.marginPct)}` }}>
              <div className="text-[10px] tracking-[0.2em] uppercase text-emerald-600 mb-2.5 font-semibold">P&L Flip stimato</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-stone-600">
                <div><span className="text-stone-400">Acquisto:</span> {Math.round(zone.flip.acquisitionPrice / 1000)}k</div>
                <div>
                  <span className="text-stone-400">All-in</span>
                  <InfoTip term="All-in" />
                  <span>: {Math.round(zone.flip.totalAllIn / 1000)}k</span>
                </div>
                <div><span className="text-stone-400">Vendita:</span> {Math.round(zone.flip.resalePrice / 1000)}k</div>
                <div>
                  <span className="text-stone-400">Margine:</span>
                  <span className="ml-1 font-bold" style={{ color: marginColor(zone.flip.marginPct) }}>
                    {zone.flip.margin > 0 ? "+" : ""}{Math.round(zone.flip.margin / 1000)}k ({zone.flip.marginPct > 0 ? "+" : ""}{zone.flip.marginPct.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className={`mt-2.5 text-lg font-semibold flex items-center gap-1 ${zone.flip.annualizedIRR > 0 ? "text-emerald-600" : "text-red-600"}`}>
                IRR annualizzato: {zone.flip.annualizedIRR > 0 ? "+" : ""}{zone.flip.annualizedIRR.toFixed(0)}%/anno
                <InfoTip term="IRR" />
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-px rounded-lg overflow-hidden mb-2 border border-stone-200 bg-stone-200">
            <Metric label="Yield LT" value={zone.yieldLT != null ? `${zone.yieldLT.toFixed(1)}%` : "—"}
              color={zone.yieldLT != null ? yieldColor(zone.yieldLT) : undefined}
              highlight={view === "MAP_LT"} infoTerm="Yield LT" />
            <Metric label="Yield ST" value={zone.yieldST != null ? `${zone.yieldST.toFixed(1)}%` : "—"}
              color={zone.yieldST != null ? yieldColor(zone.yieldST) : undefined}
              highlight={view === "MAP_ST"} infoTerm="Yield ST" />
            <Metric label="Score 10y" value={zone.score10y.toFixed(1)}
              color={scoreColor(zone.score10y)}
              highlight={view === "MAP_SCORE"} infoTerm="Score 10y" />
          </div>
          <div className="grid grid-cols-2 gap-px rounded-lg overflow-hidden mb-2 border border-stone-200 bg-stone-200">
            <Metric label={`CoC LTV ${ltv}%`}
              value={zone.coc != null ? `${zone.coc.toFixed(1)}%` : "—"}
              color={zone.coc != null ? yieldColor(zone.coc) : undefined}
              highlight={view === "MAP_COC"} infoTerm="CoC" />
            <Metric label="Apprez. annuo"
              value={`${zone.apprec > 0 ? "+" : ""}${zone.apprec.toFixed(1)}%`}
              color={zone.apprec > 2 ? "#16a34a" : zone.apprec < 0 ? "#dc2626" : "#d97706"}
              infoTerm="Apprez. annuo" />
          </div>
          <div className="grid grid-cols-2 gap-px rounded-lg overflow-hidden mb-3 border border-stone-200 bg-stone-200">
            <Metric label="Prezzo bilocale" value={`${Math.round(zone.stdPriceK)}k`} />
            <Metric label="Flip score" value={`${zone.flipScore.toFixed(1)}/10`}
              color={flipScoreColor(zone.flipScore)} infoTerm="Flip Score" />
          </div>
        </>
      )}

      {/* Drivers */}
      {zone.drivers.length > 0 && (
        <div className="mb-3">
          <div className="text-[9px] tracking-[0.15em] uppercase text-stone-400 mb-2 font-semibold flex items-center gap-0.5">
            Driver di domanda <InfoTip term="Driver di domanda" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {zone.drivers.map((d) => (
              <span key={d} className="text-[10px] text-emerald-700 border border-emerald-200 bg-emerald-50 rounded-md px-2 py-0.5 font-medium">
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Risks */}
      {zone.risks.length > 0 && (
        <div className="mb-3">
          <div className="text-[9px] tracking-[0.15em] uppercase text-red-500 mb-2 font-semibold">Rischi</div>
          <div className="flex flex-wrap gap-1.5">
            {zone.risks.map((r) => (
              <span key={r} className="text-[10px] text-red-600 border border-red-200 bg-red-50 rounded-md px-2 py-0.5 font-medium">
                {r}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {zone.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-stone-200">
          {zone.tags.map((tag) => (
            <span key={tag} className="text-[9px] bg-stone-100 text-stone-500 rounded-md px-2 py-0.5 font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
