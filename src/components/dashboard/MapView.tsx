"use client";

import { useState } from "react";
import type { ComputedZone } from "@/lib/types";
import { PROVINCES } from "@/lib/types";
import { metricColor, bubbleRadius } from "@/lib/calculations";
import { PROVINCE_PATHS, VENETO_OUTLINE, adjustZoneCoords } from "@/lib/veneto-paths";

type Props = {
  zones: ComputedZone[];
  metric: string;
  hovered: string | null;
  setHovered: (id: string | null) => void;
  selected: string | null;
  setSelected: (id: string | null) => void;
  filterProvince: string;
};

export function MapView({ zones, metric, hovered, setHovered, selected, setSelected, filterProvince }: Props) {
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);

  return (
    <svg viewBox="0 0 900 700" className="w-full h-auto block select-none">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="dotShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.15" />
        </filter>
        {/* Province fill gradients */}
        {Object.entries(PROVINCES).map(([code, p]) => (
          <linearGradient key={code} id={`prov-${code}`} x1="0" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor={p.color} stopOpacity={
              filterProvince === code
                ? hoveredProvince === code ? "0.20" : "0.12"
                : filterProvince === "ALL"
                ? hoveredProvince === code ? "0.12" : "0.06"
                : "0.02"
            } />
            <stop offset="100%" stopColor={p.color} stopOpacity={
              filterProvince === code
                ? hoveredProvince === code ? "0.12" : "0.06"
                : filterProvince === "ALL"
                ? hoveredProvince === code ? "0.06" : "0.03"
                : "0.01"
            } />
          </linearGradient>
        ))}
      </defs>

      {/* Background */}
      <rect width="900" height="700" fill="#fafaf9" />

      {/* Water areas */}
      <path
        d="M 810 310 L 835 375 L 840 395 L 830 415 L 810 430 L 785 440 L 760 448 L 735 455 L 710 465 L 690 480 L 670 495 L 650 510 L 640 545 L 650 565 L 655 590 L 670 620 L 700 650 L 900 700 L 900 200 L 860 260 Z"
        fill="#dbeafe" opacity="0.4"
      />
      <ellipse cx="138" cy="290" rx="18" ry="65" fill="#dbeafe" opacity="0.5" />

      {/* Province fills */}
      {Object.entries(PROVINCE_PATHS).map(([code, data]) => (
        <path
          key={code}
          d={data.path}
          fill={`url(#prov-${code})`}
          stroke={
            filterProvince === code
              ? PROVINCES[code].color
              : hoveredProvince === code
              ? "#a8a29e"
              : "#d6d3d1"
          }
          strokeWidth={filterProvince === code ? "1.5" : "0.8"}
          className="transition-all duration-300 cursor-pointer"
          onMouseEnter={() => setHoveredProvince(code)}
          onMouseLeave={() => setHoveredProvince(null)}
          opacity={filterProvince === "ALL" || filterProvince === code ? 1 : 0.3}
        />
      ))}

      {/* Veneto outline */}
      <path
        d={VENETO_OUTLINE}
        fill="none"
        stroke="#a8a29e"
        strokeWidth="1.5"
        strokeLinejoin="round"
        className="pointer-events-none"
      />

      {/* Geographic labels */}
      <text x="138" y="290" fontSize="8" fill="#3b82f6" fontStyle="italic" textAnchor="middle" opacity="0.5"
        transform="rotate(-80 138 290)">Lago di Garda</text>
      <text x="830" y="480" fontSize="9" fill="#3b82f6" fontStyle="italic" textAnchor="middle" opacity="0.35"
        letterSpacing="0.2em">Mare Adriatico</text>
      <text x="510" y="65" fontSize="8" fill="#78716c" fontStyle="italic" textAnchor="middle" opacity="0.5"
        letterSpacing="0.25em">DOLOMITI</text>

      {/* Province labels */}
      {Object.entries(PROVINCE_PATHS).map(([code, data]) => (
        <text
          key={`label-${code}`}
          x={data.labelX}
          y={data.labelY}
          fontSize="11"
          letterSpacing="0.35em"
          fill={
            filterProvince === code || filterProvince === "ALL"
              ? hoveredProvince === code ? PROVINCES[code].color : "#a8a29e"
              : "#d6d3d1"
          }
          textAnchor="middle"
          fontWeight="500"
          className="pointer-events-none transition-colors duration-300 uppercase"
          opacity={filterProvince === "ALL" || filterProvince === code ? 0.8 : 0.3}
        >
          {PROVINCES[code].name}
        </text>
      ))}

      {/* Zone dots */}
      {zones.map((z) => {
        const { x, y } = adjustZoneCoords(z.x, z.y);
        const value = metric === "coc" ? z.coc : (z as Record<string, unknown>)[metric] as number | null;
        const isDimmed = value == null;
        const isActive = hovered === z.id || selected === z.id;
        const r = isDimmed ? 4 : bubbleRadius(value, metric);
        const c = isDimmed ? "#d6d3d1" : metricColor(value, metric);
        return (
          <g
            key={z.id}
            className="cursor-pointer"
            onMouseEnter={() => setHovered(z.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => setSelected(selected === z.id ? null : z.id)}
          >
            {isActive && !isDimmed && (
              <>
                <circle cx={x} cy={y} r={r + 6} fill="none" stroke={c} strokeWidth="1" opacity="0">
                  <animate attributeName="r" from={r + 3} to={r + 18} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx={x} cy={y} r={r + 4} fill="none" stroke={c} strokeWidth="0.5" opacity="0">
                  <animate attributeName="r" from={r + 2} to={r + 14} dur="2s" begin="0.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.3" to="0" dur="2s" begin="0.5s" repeatCount="indefinite" />
                </circle>
              </>
            )}
            {!isDimmed && z.trend === "down" && (
              <circle cx={x} cy={y} r={r + 3} fill="none" stroke="#dc2626" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
            )}
            {!isDimmed && z.trend === "up" && (
              <circle cx={x} cy={y} r={r + 3} fill="none" stroke="#16a34a" strokeWidth="1" opacity="0.35" />
            )}
            <circle
              cx={x}
              cy={y}
              r={r}
              fill={c}
              opacity={isDimmed ? 0.3 : isActive ? 1 : 0.85}
              stroke={isActive ? "#1c1917" : "white"}
              strokeWidth={isActive ? 2 : 1}
              filter={isActive && !isDimmed ? "url(#glow)" : "url(#dotShadow)"}
              className="transition-all duration-200"
            />
            {isActive && (
              <g className="pointer-events-none">
                <rect
                  x={x - 48}
                  y={y - r - 26}
                  width="96"
                  height="20"
                  rx="6"
                  fill="white"
                  stroke="#d6d3d1"
                  strokeWidth="0.5"
                  filter="url(#dotShadow)"
                />
                <text
                  x={x}
                  y={y - r - 12}
                  fontSize="10"
                  fill="#1c1917"
                  textAnchor="middle"
                  fontWeight="600"
                  letterSpacing="0.02em"
                >
                  {z.name}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Scale legend */}
      <g transform="translate(30, 645)">
        <rect x="-10" y="-18" width="340" height="50" rx="8" fill="white" stroke="#e7e5e4" strokeWidth="0.5" />
        <text x="0" y="-2" fontSize="8" letterSpacing="0.2em" fill="#a8a29e" className="uppercase" fontWeight="500">
          Scala {metric === "score10y" ? "sostenibilita" : metric === "flipScore" ? "flip score" : metric}
        </text>
        {(metric === "score10y" ? [3, 5, 6.5, 8, 9.5] :
          metric === "flipScore" ? [2, 4, 6, 8, 9.5] :
          metric === "coc" ? [-5, 3, 8, 15, 25] :
          [3, 6, 9, 13, 18]).map((v, i) => (
          <g key={v} transform={`translate(${i * 65}, 0)`}>
            <circle cx="10" cy="18" r={bubbleRadius(v, metric) * 0.8} fill={metricColor(v, metric)} opacity="0.9" stroke="white" strokeWidth="1" />
            <text x="10" y="38" fontSize="9" fill="#78716c" textAnchor="middle" fontWeight="500">
              {metric === "score10y" || metric === "flipScore" ? v : `${v}%`}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
