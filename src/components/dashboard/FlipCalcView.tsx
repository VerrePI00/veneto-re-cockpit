"use client";

import { useMemo } from "react";
import type { ComputedZone } from "@/lib/types";
import { PROVINCES } from "@/lib/types";
import { marginColor, trendInfo } from "@/lib/calculations";
import { InfoTip } from "./InfoTip";

type Props = {
  zones: ComputedZone[];
  flipSqm: number;
  flipCapex: number;
  flipDiscount: number;
  flipMonths: number;
  flipPremium: number;
  hovered: string | null;
  setHovered: (id: string | null) => void;
  selected: string | null;
  setSelected: (id: string | null) => void;
};

export function FlipCalcView({ zones, flipSqm, flipCapex, flipDiscount, flipMonths, hovered, setHovered, selected, setSelected }: Props) {
  const sorted = useMemo(() =>
    [...zones]
      .filter((z) => z.flipScore >= 3)
      .sort((a, b) => b.flip.marginPct - a.flip.marginPct)
      .slice(0, 25),
    [zones]
  );

  const positiveCount = zones.filter((z) => z.flip.marginPct > 0).length;
  const avgMargin = zones.length > 0 ? zones.reduce((s, z) => s + z.flip.marginPct, 0) / zones.length : 0;

  return (
    <div className="pt-14 px-6 pb-6 h-full overflow-y-auto max-h-[640px]">
      {/* Stats header */}
      <div className="grid grid-cols-4 gap-px rounded-xl overflow-hidden mb-5 border border-emerald-200 bg-emerald-200">
        <div className="bg-emerald-50/60 p-3.5">
          <div className="text-[9px] tracking-[0.2em] uppercase text-emerald-600 font-semibold">Zone profittevoli</div>
          <div className="text-xl font-semibold text-stone-800 mt-1">{positiveCount}/{zones.length}</div>
        </div>
        <div className="bg-emerald-50/60 p-3.5">
          <div className="text-[9px] tracking-[0.2em] uppercase text-emerald-600 font-semibold flex items-center gap-0.5">
            Margine medio <InfoTip term="Margine" />
          </div>
          <div className={`text-xl font-semibold mt-1 ${avgMargin > 0 ? "text-emerald-600" : "text-red-600"}`}>
            {avgMargin > 0 ? "+" : ""}{avgMargin.toFixed(1)}%
          </div>
        </div>
        <div className="bg-emerald-50/60 p-3.5">
          <div className="text-[9px] tracking-[0.2em] uppercase text-emerald-600 font-semibold flex items-center gap-0.5">
            Capex per asset <InfoTip term="Capex" />
          </div>
          <div className="text-xl font-semibold text-stone-800 mt-1">{((flipCapex * flipSqm) / 1000).toFixed(0)}k</div>
        </div>
        <div className="bg-emerald-50/60 p-3.5">
          <div className="text-[9px] tracking-[0.2em] uppercase text-emerald-600 font-semibold flex items-center gap-0.5">
            IRR target <InfoTip term="IRR" />
          </div>
          <div className="text-xl font-semibold text-stone-800 mt-1">20%+/anno</div>
        </div>
      </div>

      <div className="text-[10px] tracking-[0.25em] uppercase text-emerald-600/70 mb-3 font-semibold">
        Top zone per margine flip · {flipSqm}m² · {flipCapex}/m² reno · –{flipDiscount}% OMI · {flipMonths} mesi
      </div>

      <div className="flex flex-col rounded-xl overflow-hidden border border-stone-200">
        {sorted.map((z, i) => {
          const isActive = hovered === z.id || selected === z.id;
          const mc = marginColor(z.flip.marginPct);
          const t = trendInfo(z.trend);
          return (
            <div
              key={z.id}
              onMouseEnter={() => setHovered(z.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelected(selected === z.id ? null : z.id)}
              className={`grid grid-cols-[14px_1.3fr_0.7fr_0.7fr_0.7fr_0.7fr_0.9fr] gap-2.5 items-center px-4 py-3 cursor-pointer transition-all duration-200 ${
                isActive ? "bg-emerald-50/60" : "bg-white hover:bg-stone-50"
              } ${i < sorted.length - 1 ? "border-b border-stone-100" : ""}`}
              style={{ borderLeft: `3px solid ${mc}` }}
            >
              <span style={{ color: t.color }} className="text-xs">{t.char}</span>
              <div>
                <div className="text-xs text-stone-800 font-medium">{z.name}</div>
                <div className="text-[9px] text-stone-400 tracking-wider mt-0.5">
                  {PROVINCES[z.province].name} · Flip {z.flipScore.toFixed(1)}/10
                </div>
              </div>
              <div>
                <div className="text-[8px] tracking-[0.15em] text-stone-400 font-semibold">ACQUISTO</div>
                <div className="text-[11px] text-stone-600">{Math.round(z.flip.acquisitionPrice / 1000)}k</div>
              </div>
              <div>
                <div className="text-[8px] tracking-[0.15em] text-stone-400 font-semibold">ALL-IN</div>
                <div className="text-[11px] text-stone-600">{Math.round(z.flip.totalAllIn / 1000)}k</div>
              </div>
              <div>
                <div className="text-[8px] tracking-[0.15em] text-stone-400 font-semibold">VENDITA</div>
                <div className="text-[11px] text-stone-600">{Math.round(z.flip.resalePrice / 1000)}k</div>
              </div>
              <div>
                <div className="text-[8px] tracking-[0.15em] text-stone-400 font-semibold">IRR</div>
                <div className={`text-[11px] font-semibold ${z.flip.annualizedIRR > 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {z.flip.annualizedIRR > 0 ? "+" : ""}{z.flip.annualizedIRR.toFixed(0)}%
                </div>
              </div>
              <div>
                <div className="text-[8px] tracking-[0.15em] text-stone-400 font-semibold">MARGINE</div>
                <div className="text-base font-bold" style={{ color: mc }}>
                  {z.flip.margin > 0 ? "+" : ""}{Math.round(z.flip.margin / 1000)}k
                </div>
                <div className="text-[9px] font-semibold" style={{ color: mc }}>
                  {z.flip.marginPct > 0 ? "+" : ""}{z.flip.marginPct.toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
