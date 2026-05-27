import type { Zone, FlipResult } from "./types";

export function calcCoC(yieldLT: number | null, ltv: number, rate: number, price: number): number | null {
  if (yieldLT == null || ltv >= 100) return null;
  const grossRent = price * yieldLT / 100;
  const netOpex = grossRent * 0.65;
  const equity = price * (1 - ltv / 100);
  const mortgage = price * ltv / 100;
  const avgPrincipalPaid = mortgage * 0.55;
  const annualInterest = avgPrincipalPaid * rate / 100;
  const netToEquity = netOpex - annualInterest;
  if (equity === 0) return netToEquity > 0 ? 999 : -999;
  return (netToEquity / equity) * 100;
}

export function calcFlip(
  zone: Zone, sqm: number, capexPerSqm: number,
  discountFromOMI: number, holdingMonths: number, targetClassPremium: number
): FlipResult {
  const omiTotal = zone.price * sqm;
  const acquisitionPrice = omiTotal * (1 - discountFromOMI / 100);
  const acquisitionFees = acquisitionPrice * 0.08;
  const renovationCost = sqm * capexPerSqm;
  const technicalFees = renovationCost * 0.10;
  const holdingCost = (acquisitionPrice * 0.005 + 1500) * (holdingMonths / 12);
  const totalAllIn = acquisitionPrice + acquisitionFees + renovationCost + technicalFees + holdingCost;
  const effectivePremium = zone.energyPremium * (targetClassPremium / 100);
  const resalePrice = omiTotal * (1 + effectivePremium / 100);
  const sellingCosts = resalePrice * 0.03;
  const netRevenue = resalePrice - sellingCosts;
  const margin = netRevenue - totalAllIn;
  const marginPct = (margin / totalAllIn) * 100;
  const annualizedIRR = holdingMonths > 0 ? (Math.pow(1 + margin / totalAllIn, 12 / holdingMonths) - 1) * 100 : 0;
  return { acquisitionPrice, acquisitionFees, renovationCost, technicalFees, holdingCost, totalAllIn, resalePrice, sellingCosts, netRevenue, margin, marginPct, annualizedIRR };
}

export function yieldColor(v: number | null): string {
  if (v == null) return "#3a3733";
  const clamped = Math.max(-5, Math.min(25, v));
  if (clamped < 0) return "#8a2a25";
  const t = clamped / 25;
  if (t < 0.2) {
    const k = t / 0.2;
    return `rgb(${Math.round(190 + k * 30)},${Math.round(60 + k * 110)},${Math.round(50 + k * 20)})`;
  } else if (t < 0.45) {
    const k = (t - 0.2) / 0.25;
    return `rgb(${Math.round(220 - k * 90)},${Math.round(170 + k * 20)},${Math.round(70 - k * 10)})`;
  }
  const k = (t - 0.45) / 0.55;
  return `rgb(${Math.round(130 - k * 60)},${Math.round(190 - k * 30)},${Math.round(60 + k * 30)})`;
}

export function scoreColor(v: number | null): string {
  if (v == null) return "#3a3733";
  const clamped = Math.max(2, Math.min(10, v));
  const t = (clamped - 2) / 8;
  if (t < 0.35) {
    const k = t / 0.35;
    return `rgb(${Math.round(180 + k * 40)},${Math.round(50 + k * 100)},${Math.round(50 + k * 20)})`;
  } else if (t < 0.65) {
    const k = (t - 0.35) / 0.3;
    return `rgb(${Math.round(220 - k * 100)},${Math.round(150 + k * 40)},${Math.round(70 - k * 10)})`;
  }
  const k = (t - 0.65) / 0.35;
  return `rgb(${Math.round(120 - k * 60)},${Math.round(190 - k * 30)},${Math.round(60 + k * 30)})`;
}

export function flipScoreColor(v: number | null): string {
  if (v == null) return "#3a3733";
  const clamped = Math.max(1, Math.min(10, v));
  if (clamped < 3) return "#8a2a25";
  if (clamped < 5) return "#c95450";
  if (clamped < 6.5) return "#d4a574";
  if (clamped < 8) return "#9bb069";
  return "#5fa050";
}

export function metricColor(v: number | null, metric: string): string {
  if (metric === "score10y") return scoreColor(v);
  if (metric === "flipScore") return flipScoreColor(v);
  return yieldColor(v);
}

export function bubbleRadius(v: number | null, metric: string): number {
  if (v == null) return 6;
  if (metric === "score10y") return 7 + Math.max(0, Math.min(8, v - 2)) * 1.4;
  if (metric === "flipScore") return 6 + Math.max(0, Math.min(9, v - 1)) * 1.3;
  if (metric === "coc") return 6 + Math.max(0, Math.min(30, (v ?? 0) + 5)) * 0.7;
  if (metric === "yieldLT" || metric === "yieldST") return 7 + Math.max(0, Math.min(15, v - 4)) * 0.9;
  return 8;
}

export function marginColor(pct: number): string {
  if (pct > 15) return "#5fa050";
  if (pct > 5) return "#9bb069";
  if (pct > 0) return "#d4a574";
  if (pct > -10) return "#c95450";
  return "#8a2a25";
}

export function trendInfo(trend: string) {
  const map: Record<string, { char: string; color: string; label: string }> = {
    up: { char: "▲", color: "#7fb069", label: "In ascesa" },
    stable: { char: "◆", color: "#d4a574", label: "Stabile" },
    down: { char: "▼", color: "#c95450", label: "In declino" },
  };
  return map[trend] || map.stable;
}
