export type Zone = {
  id: string;
  name: string;
  province: string;
  x: number;
  y: number;
  price: number;
  rentLT: number;
  yieldLT: number | null;
  yieldST: number | null;
  score10y: number;
  trend: "up" | "stable" | "down";
  apprec: number;
  invMin: number;
  invMax: number;
  flipScore: number;
  energyPremium: number;
  typicalDiscount: number;
  dom: number;
  fgStock: number;
  flipNote: string;
  note: string;
  tags: string[];
  drivers: string[];
  risks: string[];
  updatedAt: string;
};

export type ComputedZone = Zone & {
  coc: number | null;
  stdPriceK: number;
  flip: FlipResult;
};

export type FlipResult = {
  acquisitionPrice: number;
  acquisitionFees: number;
  renovationCost: number;
  technicalFees: number;
  holdingCost: number;
  totalAllIn: number;
  resalePrice: number;
  sellingCosts: number;
  netRevenue: number;
  margin: number;
  marginPct: number;
  annualizedIRR: number;
};

export const PROVINCES: Record<string, { name: string; color: string }> = {
  VE: { name: "Venezia", color: "#c2650a" },
  TV: { name: "Treviso", color: "#4d7c0f" },
  PD: { name: "Padova", color: "#b91c1c" },
  VR: { name: "Verona", color: "#a16207" },
  VI: { name: "Vicenza", color: "#0f766e" },
  BL: { name: "Belluno", color: "#1d4ed8" },
  RO: { name: "Rovigo", color: "#7e22ce" },
};

export type ViewKey =
  | "MAP_SCORE"
  | "MAP_COC"
  | "MAP_FLIP"
  | "MAP_LT"
  | "MAP_ST"
  | "SCATTER"
  | "INVENTORY"
  | "FLIP_CALC";

export const VIEWS: Record<ViewKey, { label: string; kind: string; metric?: string }> = {
  MAP_SCORE: { label: "Sostenibilita 10y", kind: "map", metric: "score10y" },
  MAP_COC: { label: "Cash-on-Cash", kind: "map", metric: "coc" },
  MAP_FLIP: { label: "Flip Score", kind: "map", metric: "flipScore" },
  MAP_LT: { label: "Yield LT", kind: "map", metric: "yieldLT" },
  MAP_ST: { label: "Yield ST", kind: "map", metric: "yieldST" },
  SCATTER: { label: "Scatter Yield x 10y", kind: "scatter" },
  INVENTORY: { label: "Inventario", kind: "inventory" },
  FLIP_CALC: { label: "Flip Calculator", kind: "flipcalc" },
};
