"use client";

import { useMemo } from "react";
import type { ComputedZone } from "@/lib/types";
import { PROVINCES } from "@/lib/types";
import { yieldColor, trendInfo } from "@/lib/calculations";
import { InfoTip } from "./InfoTip";

type Props = {
  zones: ComputedZone[];
  budgetMin: number;
  budgetMax: number;
  ltv: number;
  hovered: string | null;
  setHovered: (id: string | null) => void;
  selected: string | null;
  setSelected: (id: string | null) => void;
};

export function InventoryView({ zones, budgetMin, budgetMax, ltv, hovered, setHovered, selected, setSelected }: Props) {
  const sorted = useMemo(() =>
    [...zones].sort((a, b) => (b.coc ?? 0) - (a.coc ?? 0)),
    [zones]
  );

  const totalListings = zones.reduce((sum, z) => sum + Math.round((z.invMin + z.invMax) / 2), 0);

  return (
    <div className="pt-14 px-6 pb-6 h-full overflow-y-auto max-h-[640px]">
      {/* Stats header */}
      <div className="grid grid-cols-3 gap-px rounded-xl overflow-hidden mb-5 border border-stone-200 bg-stone-200">
        <div className="bg-white p-4">
          <div className="text-[10px] tracking-[0.2em] uppercase text-stone-400 font-semibold">Zone in budget</div>
          <div className="text-2xl font-semibold text-stone-800 mt-1">{zones.length}</div>
        </div>
        <div className="bg-white p-4">
          <div className="text-[10px] tracking-[0.2em] uppercase text-stone-400 font-semibold">Annunci attivi stimati</div>
          <div className="text-2xl font-semibold text-stone-800 mt-1">~{totalListings.toLocaleString("it-IT")}</div>
        </div>
        <div className="bg-white p-4">
          <div className="text-[10px] tracking-[0.2em] uppercase text-stone-400 font-semibold flex items-center gap-0.5">
            Equity richiesta
            <InfoTip term="Equity" />
            <span className="ml-1 text-stone-300">(LTV {ltv}%)</span>
          </div>
          <div className="text-2xl font-semibold text-stone-800 mt-1">
            {Math.round(budgetMin * (1 - ltv / 100))}k — {Math.round(budgetMax * (1 - ltv / 100))}k
          </div>
        </div>
      </div>

      <div className="text-[10px] tracking-[0.25em] uppercase text-stone-400 mb-3 font-semibold flex items-center gap-1">
        Zone ordinate per Cash-on-Cash
        <InfoTip term="CoC" />
        <span className="text-stone-300">· Bilocale 50 m² in {budgetMin}k–{budgetMax}k</span>
      </div>

      {sorted.length === 0 ? (
        <div className="text-stone-400 text-sm text-center py-12 border border-stone-200 rounded-xl bg-white">
          Nessuna zona nel range di budget. Aggiusta i parametri.
        </div>
      ) : (
        <div className="flex flex-col rounded-xl overflow-hidden border border-stone-200">
          {sorted.map((z, i) => {
            const avgInv = Math.round((z.invMin + z.invMax) / 2);
            const isActive = hovered === z.id || selected === z.id;
            const t = trendInfo(z.trend);
            const provColor = PROVINCES[z.province].color;
            return (
              <div
                key={z.id}
                onMouseEnter={() => setHovered(z.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(selected === z.id ? null : z.id)}
                className={`grid grid-cols-[14px_1.4fr_0.7fr_0.7fr_0.7fr_0.9fr] gap-3 items-center px-4 py-3 cursor-pointer transition-all duration-200 ${
                  isActive ? "bg-amber-50/80" : "bg-white hover:bg-stone-50"
                } ${i < sorted.length - 1 ? "border-b border-stone-100" : ""}`}
                style={isActive ? { borderLeft: `3px solid ${provColor}` } : { borderLeft: "3px solid transparent" }}
              >
                <span style={{ color: t.color }} className="text-xs">{t.char}</span>
                <div>
                  <div className="text-sm text-stone-800 font-medium">{z.name}</div>
                  <div className="text-[10px] text-stone-400 tracking-wider mt-0.5">{PROVINCES[z.province].name}</div>
                </div>
                <div>
                  <div className="text-[9px] tracking-[0.15em] text-stone-400 font-semibold">PREZZO</div>
                  <div className="text-sm text-stone-600">{Math.round(z.stdPriceK)}k</div>
                </div>
                <div>
                  <div className="text-[9px] tracking-[0.15em] text-stone-400 font-semibold">EQUITY</div>
                  <div className="text-sm text-stone-600">{Math.round(z.stdPriceK * (1 - ltv / 100))}k</div>
                </div>
                <div>
                  <div className="text-[9px] tracking-[0.15em] text-stone-400 font-semibold">ANNUNCI</div>
                  <div className="text-sm text-stone-600">~{avgInv}</div>
                </div>
                <div>
                  <div className="text-[9px] tracking-[0.15em] text-stone-400 font-semibold">CoC</div>
                  <div className="text-lg font-bold" style={{ color: z.coc != null ? yieldColor(z.coc) : "#a8a29e" }}>
                    {z.coc != null ? `${z.coc.toFixed(1)}%` : "—"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
