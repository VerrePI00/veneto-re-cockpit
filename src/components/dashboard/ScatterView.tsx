"use client";

import type { ComputedZone } from "@/lib/types";
import { PROVINCES } from "@/lib/types";

type Props = {
  zones: ComputedZone[];
  hovered: string | null;
  setHovered: (id: string | null) => void;
  selected: string | null;
  setSelected: (id: string | null) => void;
};

export function ScatterView({ zones, hovered, setHovered, selected, setSelected }: Props) {
  const yieldExtent = [3, 13];
  const scoreExtent = [2, 10];
  const W = 900, H = 650;
  const padding = { top: 60, right: 40, bottom: 80, left: 80 };

  const xScale = (v: number) =>
    padding.left + ((v - yieldExtent[0]) / (yieldExtent[1] - yieldExtent[0])) * (W - padding.left - padding.right);
  const yScale = (v: number) =>
    padding.top + ((scoreExtent[1] - v) / (scoreExtent[1] - scoreExtent[0])) * (H - padding.top - padding.bottom);

  const midX = xScale(7);
  const midY = yScale(6);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
      <defs>
        <filter id="scatterDotShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.12" />
        </filter>
      </defs>

      <rect width={W} height={H} fill="#fafaf9" />

      {/* Quadrant fills */}
      <rect x={midX} y={padding.top} width={W - padding.right - midX} height={midY - padding.top}
        fill="#dcfce7" opacity="0.5" rx="4" />
      <rect x={padding.left} y={padding.top} width={midX - padding.left} height={midY - padding.top}
        fill="#fef3c7" opacity="0.5" rx="4" />
      <rect x={midX} y={midY} width={W - padding.right - midX} height={H - padding.bottom - midY}
        fill="#fee2e2" opacity="0.4" rx="4" />
      <rect x={padding.left} y={midY} width={midX - padding.left} height={H - padding.bottom - midY}
        fill="#f5f5f4" opacity="0.6" rx="4" />

      {/* Quadrant labels */}
      <text x={midX + (W - padding.right - midX) / 2} y={padding.top + 25} fontSize="12" fill="#16a34a"
        textAnchor="middle" fontWeight="600" letterSpacing="0.15em" opacity="0.8">SWEET SPOT</text>
      <text x={midX + (W - padding.right - midX) / 2} y={padding.top + 42} fontSize="9" fill="#16a34a"
        textAnchor="middle" opacity="0.5">alto yield + alta sostenibilità</text>

      <text x={padding.left + (midX - padding.left) / 2} y={padding.top + 25} fontSize="12" fill="#d97706"
        textAnchor="middle" fontWeight="600" letterSpacing="0.15em" opacity="0.8">ASSET PATRIMONIALE</text>
      <text x={padding.left + (midX - padding.left) / 2} y={padding.top + 42} fontSize="9" fill="#d97706"
        textAnchor="middle" opacity="0.5">cash-flow basso ma robusto</text>

      <text x={midX + (W - padding.right - midX) / 2} y={H - padding.bottom - 18} fontSize="12" fill="#dc2626"
        textAnchor="middle" fontWeight="600" letterSpacing="0.15em" opacity="0.8">TRAPPOLA DA YIELD</text>
      <text x={midX + (W - padding.right - midX) / 2} y={H - padding.bottom - 3} fontSize="9" fill="#dc2626"
        textAnchor="middle" opacity="0.5">yield contabili in declino strutturale</text>

      <text x={padding.left + (midX - padding.left) / 2} y={H - padding.bottom - 18} fontSize="12" fill="#78716c"
        textAnchor="middle" fontWeight="600" letterSpacing="0.15em" opacity="0.7">ZONA NEUTRA</text>

      {/* Grid */}
      {[4, 5, 6, 7, 8, 9, 10, 11, 12].map((v) => (
        <line key={v} x1={xScale(v)} y1={padding.top} x2={xScale(v)} y2={H - padding.bottom} stroke="#e7e5e4" strokeWidth="0.5" />
      ))}
      {[3, 4, 5, 6, 7, 8, 9].map((v) => (
        <line key={v} x1={padding.left} y1={yScale(v)} x2={W - padding.right} y2={yScale(v)} stroke="#e7e5e4" strokeWidth="0.5" />
      ))}

      {/* Dividers */}
      <line x1={midX} y1={padding.top} x2={midX} y2={H - padding.bottom} stroke="#a8a29e" strokeWidth="1" strokeDasharray="6 3" opacity="0.5" />
      <line x1={padding.left} y1={midY} x2={W - padding.right} y2={midY} stroke="#a8a29e" strokeWidth="1" strokeDasharray="6 3" opacity="0.5" />

      {/* Axes */}
      <line x1={padding.left} y1={H - padding.bottom} x2={W - padding.right} y2={H - padding.bottom} stroke="#a8a29e" strokeWidth="1" />
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={H - padding.bottom} stroke="#a8a29e" strokeWidth="1" />

      {/* Axis labels */}
      <text x={W / 2} y={H - 28} fontSize="11" fill="#78716c" textAnchor="middle" letterSpacing="0.15em" fontWeight="500">Yield Long-term lordo %</text>
      <text x={22} y={H / 2} fontSize="11" fill="#78716c" textAnchor="middle" letterSpacing="0.15em" fontWeight="500" transform={`rotate(-90 22 ${H / 2})`}>Sostenibilità 10y</text>

      {/* Ticks */}
      {[4, 6, 8, 10, 12].map((v) => (
        <text key={v} x={xScale(v)} y={H - padding.bottom + 20} fontSize="10" fill="#a8a29e" textAnchor="middle" fontWeight="500">{v}%</text>
      ))}
      {[3, 5, 7, 9].map((v) => (
        <text key={v} x={padding.left - 12} y={yScale(v) + 4} fontSize="10" fill="#a8a29e" textAnchor="end" fontWeight="500">{v}</text>
      ))}

      {/* Data points */}
      {zones.filter((z) => z.yieldLT != null).map((z) => {
        const cx = xScale(Math.min(yieldExtent[1], Math.max(yieldExtent[0], z.yieldLT!)));
        const cy = yScale(Math.min(scoreExtent[1], Math.max(scoreExtent[0], z.score10y)));
        const r = 5 + (z.coc != null ? Math.max(0, Math.min(15, z.coc + 5)) * 0.5 : 3);
        const isActive = hovered === z.id || selected === z.id;
        const provColor = PROVINCES[z.province].color;
        return (
          <g
            key={z.id}
            className="cursor-pointer"
            onMouseEnter={() => setHovered(z.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => setSelected(selected === z.id ? null : z.id)}
          >
            {isActive && (
              <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke={provColor} strokeWidth="1.5" opacity="0">
                <animate attributeName="r" from={r + 2} to={r + 14} dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            {z.trend === "down" && (
              <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke="#dc2626" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
            )}
            {z.trend === "up" && (
              <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke="#16a34a" strokeWidth="1" opacity="0.35" />
            )}
            <circle
              cx={cx} cy={cy} r={r} fill={provColor}
              opacity={isActive ? 1 : 0.8}
              stroke={isActive ? "#1c1917" : "white"}
              strokeWidth={isActive ? 2 : 1}
              filter="url(#scatterDotShadow)"
              className="transition-all duration-200"
            />
            {isActive && (
              <g className="pointer-events-none">
                <rect x={cx - 48} y={cy - r - 26} width="96" height="20" rx="6"
                  fill="white" stroke="#d6d3d1" strokeWidth="0.5" filter="url(#scatterDotShadow)" />
                <text x={cx} y={cy - r - 12} fontSize="10" fill="#1c1917" textAnchor="middle"
                  fontWeight="600">{z.name.split(" ").slice(0, 3).join(" ")}</text>
              </g>
            )}
            {!isActive && (z.score10y >= 8 || z.yieldLT! >= 9) && (
              <text x={cx} y={cy - r - 5} fontSize="9" fill="#57534e" textAnchor="middle" fontWeight="500"
                className="pointer-events-none" opacity="0.7">{z.name.split(" ").slice(0, 2).join(" ")}</text>
            )}
          </g>
        );
      })}

      {/* Legend */}
      <g transform="translate(30, 610)">
        <rect x="-10" y="-14" width="320" height="34" rx="6" fill="white" stroke="#e7e5e4" strokeWidth="0.5" />
        <text x="0" y="2" fontSize="8" letterSpacing="0.2em" fill="#a8a29e" fontWeight="500">DIMENSIONE = CASH-ON-CASH</text>
        <text x="0" y="15" fontSize="8" fill="#a8a29e">colore = provincia</text>
      </g>
    </svg>
  );
}
