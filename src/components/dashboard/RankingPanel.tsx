"use client";

import { useMemo } from "react";
import type { ComputedZone, ViewKey } from "@/lib/types";
import { yieldColor, scoreColor, flipScoreColor, trendInfo } from "@/lib/calculations";

type Props = {
  zones: ComputedZone[];
  view: ViewKey;
  hovered: string | null;
  setHovered: (id: string | null) => void;
  selected: string | null;
  setSelected: (id: string | null) => void;
};

export function RankingPanel({ zones, view, hovered, setHovered, selected, setSelected }: Props) {
  const metric =
    view === "MAP_COC" || view === "INVENTORY" || view === "SCATTER" ? "coc" :
    view === "MAP_LT" ? "yieldLT" :
    view === "MAP_ST" ? "yieldST" :
    view === "MAP_FLIP" ? "flipScore" :
    view === "FLIP_CALC" ? "flipMargin" :
    "score10y";

  const ranked = useMemo(() => {
    if (metric === "flipMargin") {
      return [...zones].filter((z) => z.flip).sort((a, b) => b.flip.marginPct - a.flip.marginPct).slice(0, 10);
    }
    return [...zones]
      .filter((z) => {
        if (metric === "coc") return z.coc != null;
        return (z as Record<string, unknown>)[metric] != null;
      })
      .sort((a, b) => {
        if (metric === "coc") return (b.coc ?? 0) - (a.coc ?? 0);
        return ((b as Record<string, unknown>)[metric] as number) - ((a as Record<string, unknown>)[metric] as number);
      })
      .slice(0, 10);
  }, [zones, metric]);

  const isPercent = metric !== "score10y" && metric !== "flipScore";
  const labels: Record<string, string> = {
    coc: "Cash-on-Cash",
    yieldLT: "Yield LT",
    yieldST: "Yield ST",
    score10y: "Score 10y",
    flipScore: "Flip score",
    flipMargin: "Margine flip %",
  };

  return (
    <div className="rounded-xl bg-white border border-stone-200 p-5 shadow-sm">
      <div className="text-[10px] tracking-[0.25em] uppercase text-stone-400 mb-4 font-semibold">
        Top 10 · {labels[metric]}
      </div>
      {ranked.length === 0 ? (
        <div className="text-stone-400 text-sm">Nessun dato.</div>
      ) : (
        <div className="space-y-0">
          {ranked.map((z, i) => {
            let v: number;
            let color: string;
            if (metric === "flipMargin") {
              v = z.flip.marginPct;
              color = v > 15 ? "#16a34a" : v > 5 ? "#65a30d" : v > 0 ? "#d97706" : "#dc2626";
            } else if (metric === "score10y") {
              v = z.score10y;
              color = scoreColor(v);
            } else if (metric === "flipScore") {
              v = z.flipScore;
              color = flipScoreColor(v);
            } else if (metric === "coc") {
              v = z.coc ?? 0;
              color = yieldColor(v);
            } else {
              v = (z as Record<string, unknown>)[metric] as number;
              color = yieldColor(v);
            }
            const isActive = hovered === z.id || selected === z.id;
            const t = trendInfo(z.trend);
            return (
              <div
                key={z.id}
                onMouseEnter={() => setHovered(z.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(selected === z.id ? null : z.id)}
                className={`grid grid-cols-[22px_14px_1fr_60px] gap-2 items-center py-2.5 px-1 cursor-pointer transition-all duration-200 rounded-lg ${
                  isActive ? "bg-amber-50" : "hover:bg-stone-50"
                } ${i < 9 ? "border-b border-stone-100" : ""}`}
              >
                <span className={`text-sm font-semibold ${
                  i === 0 ? "text-amber-500" : i < 3 ? "text-amber-400" : "text-stone-300"
                }`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ color: t.color }} className="text-xs">{t.char}</span>
                <span className="text-sm text-stone-700 truncate font-medium">{z.name}</span>
                <span className="text-sm text-right font-bold tabular-nums" style={{ color }}>
                  {metric === "flipMargin"
                    ? `${v > 0 ? "+" : ""}${v.toFixed(1)}%`
                    : isPercent
                    ? `${v.toFixed(1)}%`
                    : v.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
