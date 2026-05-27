"use client";

import { useState, useMemo } from "react";
import type { Zone, ComputedZone, ViewKey } from "@/lib/types";
import { PROVINCES, VIEWS } from "@/lib/types";
import { calcCoC, calcFlip } from "@/lib/calculations";
import { MapView } from "./MapView";
import { ScatterView } from "./ScatterView";
import { InventoryView } from "./InventoryView";
import { FlipCalcView } from "./FlipCalcView";
import { DetailPanel } from "./DetailPanel";
import { RankingPanel } from "./RankingPanel";
import { InfoTip } from "./InfoTip";
import { Slider } from "@/components/ui/slider";
import {
  TrendingUp, TrendingDown, Building2, Calculator,
  Map, BarChart3, Package, Wrench, RefreshCw, Activity,
  MapPin, Layers, ArrowUpRight, ArrowDownRight, Database,
  ExternalLink, X,
} from "lucide-react";

const VIEW_ICONS: Record<string, React.ReactNode> = {
  MAP_SCORE: <Activity className="w-3.5 h-3.5" />,
  MAP_COC: <BarChart3 className="w-3.5 h-3.5" />,
  MAP_FLIP: <Wrench className="w-3.5 h-3.5" />,
  MAP_LT: <TrendingUp className="w-3.5 h-3.5" />,
  MAP_ST: <TrendingDown className="w-3.5 h-3.5" />,
  SCATTER: <Layers className="w-3.5 h-3.5" />,
  INVENTORY: <Package className="w-3.5 h-3.5" />,
  FLIP_CALC: <Calculator className="w-3.5 h-3.5" />,
};

function SliderControl({ label, value, infoTerm, children }: {
  label: string; value: string; infoTerm?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-stone-500 uppercase tracking-wide flex items-center gap-0.5">
          {label}
          {infoTerm && <InfoTip term={infoTerm} />}
        </span>
        <span className="text-sm font-semibold text-stone-800 tabular-nums">{value}</span>
      </div>
      {children}
    </div>
  );
}

function SourceItem({ name, url, description, color }: {
  name: string; url: string; description: string; color: string;
}) {
  return (
    <div className="flex gap-3 group">
      <div className="w-1 rounded-full shrink-0 mt-1" style={{ backgroundColor: color }} />
      <div className="flex-1 min-w-0">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-stone-800 hover:text-amber-600 transition-colors inline-flex items-center gap-1"
        >
          {name}
          <ExternalLink className="w-3 h-3 text-stone-300 group-hover:text-amber-400 transition-colors" />
        </a>
        <p className="text-xs text-stone-500 leading-relaxed mt-0.5">{description}</p>
      </div>
    </div>
  );
}

export function Dashboard({ initialZones }: { initialZones: Zone[] }) {
  const [zones] = useState(initialZones);
  const [view, setView] = useState<ViewKey>("MAP_SCORE");
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [filterProvince, setFilterProvince] = useState("ALL");
  const [filterRisk, setFilterRisk] = useState(false);
  const [ltv, setLtv] = useState(70);
  const [rate, setRate] = useState(3.4);
  const [budgetMin, setBudgetMin] = useState(80);
  const [budgetMax, setBudgetMax] = useState(150);
  const [flipSqm, setFlipSqm] = useState(60);
  const [flipCapex, setFlipCapex] = useState(450);
  const [flipDiscount, setFlipDiscount] = useState(25);
  const [flipMonths, setFlipMonths] = useState(8);
  const [flipPremium, setFlipPremium] = useState(80);
  const [showSources, setShowSources] = useState(false);
  const [lastUpdate] = useState(() => {
    const dates = zones.map((z) => z.updatedAt).filter(Boolean);
    return dates.length > 0 ? new Date(Math.max(...dates.map((d) => new Date(d).getTime()))) : new Date();
  });

  const viewConf = VIEWS[view];
  const isFlipView = view === "MAP_FLIP" || view === "FLIP_CALC";

  const computedZones: ComputedZone[] = useMemo(() => {
    return zones.map((z) => {
      const stdAssetPrice = z.price * 50;
      const coc = calcCoC(z.yieldLT, ltv, rate, stdAssetPrice);
      const stdPriceK = stdAssetPrice / 1000;
      const flip = calcFlip(z, flipSqm, flipCapex, flipDiscount, flipMonths, flipPremium);
      return { ...z, coc, stdPriceK, flip };
    });
  }, [zones, ltv, rate, flipSqm, flipCapex, flipDiscount, flipMonths, flipPremium]);

  const filtered = useMemo(() => {
    return computedZones.filter((z) => {
      if (filterProvince !== "ALL" && z.province !== filterProvince) return false;
      if (filterRisk && z.trend !== "down") return false;
      return true;
    });
  }, [computedZones, filterProvince, filterRisk]);

  const inventoryFiltered = useMemo(() => {
    return filtered.filter((z) => z.stdPriceK >= budgetMin && z.stdPriceK <= budgetMax);
  }, [filtered, budgetMin, budgetMax]);

  const detail = selected || hovered;
  const detailZone = detail ? computedZones.find((z) => z.id === detail) || null : null;

  const upCount = filtered.filter((z) => z.trend === "up").length;
  const downCount = filtered.filter((z) => z.trend === "down").length;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1680px] mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/20">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-stone-900">
                  Veneto <span className="text-amber-600">RE</span> Cockpit
                </h1>
                <p className="text-xs text-stone-400 tracking-wide mt-0.5">
                  Buy-to-Rent & Fix-and-Flip · {zones.length} zone monitorate
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="hidden lg:flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>{upCount} in crescita</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-medium">
                  <ArrowDownRight className="w-3 h-3" />
                  <span>{downCount} in calo</span>
                </div>
              </div>
              <div className="h-8 w-px bg-stone-200 hidden lg:block" />
              <div className="text-right">
                <div className="text-[10px] text-stone-400 tracking-wider uppercase font-medium">Aggiornamento</div>
                <div className="text-xs text-stone-600 font-medium mt-0.5">
                  {lastUpdate.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowSources(!showSources)}
                  className={`p-2 rounded-lg border transition-all group ${
                    showSources
                      ? "border-amber-300 bg-amber-50 text-amber-600"
                      : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                  }`}
                  title="Fonti dati"
                >
                  <Database className={`w-4 h-4 transition-colors ${showSources ? "text-amber-600" : "text-stone-400 group-hover:text-stone-600"}`} />
                </button>
                {showSources && (
                  <div className="absolute right-0 top-full mt-2 w-[380px] bg-white border border-stone-200 rounded-xl shadow-xl z-[60] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-stone-50/50">
                      <h3 className="text-sm font-bold text-stone-800">Fonti dati</h3>
                      <button onClick={() => setShowSources(false)} className="p-1 rounded-md hover:bg-stone-200 transition-colors">
                        <X className="w-3.5 h-3.5 text-stone-400" />
                      </button>
                    </div>
                    <div className="p-4 space-y-3">
                      <SourceItem
                        name="Immobiliare.it"
                        url="https://www.immobiliare.it"
                        description="Prezzi medi al m² per zona, annunci attivi, DOM (Days on Market). Aggiornamento settimanale via scraping automatico."
                        color="#e53935"
                      />
                      <SourceItem
                        name="OMI — Agenzia delle Entrate"
                        url="https://www.agenziaentrate.gov.it/portale/web/guest/schede/fabbricatiterreni/omi"
                        description="Quotazioni ufficiali al m² per zona censuaria, utilizzate come riferimento per sconti di acquisto e valutazioni di mercato."
                        color="#1565c0"
                      />
                      <SourceItem
                        name="ISTAT"
                        url="https://www.istat.it"
                        description="Dati demografici, trend di popolazione, indici di attrattività territoriale utilizzati nel calcolo dello Score 10y."
                        color="#2e7d32"
                      />
                      <SourceItem
                        name="ENEA / APE regionali"
                        url="https://www.efficienzaenergetica.enea.it"
                        description="Distribuzione classi energetiche degli edifici per zona: percentuali stock F/G e premio energetico atteso per riqualificazione."
                        color="#f57c00"
                      />
                      <SourceItem
                        name="Banca d'Italia"
                        url="https://www.bancaditalia.it"
                        description="Tassi medi mutui residenziali (TAEG), utilizzati per il calcolo del Cash-on-Cash e delle simulazioni di leva finanziaria."
                        color="#00695c"
                      />
                    </div>
                    <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/50">
                      <p className="text-[10px] text-stone-400 leading-relaxed">
                        I dati vengono aggiornati automaticamente ogni lunedì alle 06:00 UTC tramite pipeline di scraping. Ultima esecuzione: {lastUpdate.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => window.location.reload()}
                className="p-2 rounded-lg border border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-all group"
                title="Aggiorna dati"
              >
                <RefreshCw className="w-4 h-4 text-stone-400 group-hover:text-stone-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1680px] mx-auto px-6 lg:px-8 py-5 space-y-4">
        {/* View Tabs */}
        <div className="flex items-center gap-1">
          <div className="flex bg-white rounded-xl p-1 border border-stone-200 shadow-sm">
            {(Object.entries(VIEWS) as [ViewKey, typeof VIEWS[ViewKey]][]).map(([k, v]) => {
              const isFlip = k === "MAP_FLIP" || k === "FLIP_CALC";
              return (
                <button
                  key={k}
                  onClick={() => setView(k)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
                    view === k
                      ? isFlip
                        ? "bg-emerald-50 text-emerald-700 shadow-sm"
                        : "bg-amber-50 text-amber-700 shadow-sm"
                      : "text-stone-400 hover:text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  {VIEW_ICONS[k]}
                  <span className="hidden md:inline">{v.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Parameter Controls */}
        {(view === "MAP_COC" || view === "SCATTER" || view === "INVENTORY") && (
          <div className="rounded-xl bg-white border border-stone-200 p-5 shadow-sm">
            <div className={`grid gap-8 ${view === "INVENTORY" ? "grid-cols-4" : "grid-cols-3"}`}>
              <SliderControl label="Loan-to-Value" value={`${ltv}%`} infoTerm="LTV">
                <Slider value={[ltv]} onValueChange={(v) => setLtv(Array.isArray(v) ? v[0] : v)} min={0} max={85} step={5} />
              </SliderControl>
              <SliderControl label="Tasso TAEG" value={`${rate.toFixed(1)}%`} infoTerm="TAEG">
                <Slider value={[rate * 10]} onValueChange={(v) => setRate((Array.isArray(v) ? v[0] : v) / 10)} min={20} max={60} step={1} />
              </SliderControl>
              <div className="flex flex-col justify-center text-right">
                <div className="text-[10px] tracking-wider uppercase text-stone-400 font-medium">Parametri fissi</div>
                <div className="text-xs text-stone-500 mt-1 flex items-center justify-end gap-1">
                  <span>Cedolare 21%</span>
                  <InfoTip term="Cedolare secca" />
                  <span> · </span>
                  <span>OPEX 35%</span>
                  <InfoTip term="OPEX" />
                  <span> · Mutuo 20y</span>
                </div>
              </div>
              {view === "INVENTORY" && (
                <SliderControl label="Budget" value={`${budgetMin}k — ${budgetMax}k`}>
                  <div className="flex gap-3">
                    <Slider value={[budgetMin]} onValueChange={(v) => setBudgetMin(Math.min(Array.isArray(v) ? v[0] : v, budgetMax - 20))} min={40} max={300} step={10} />
                    <Slider value={[budgetMax]} onValueChange={(v) => setBudgetMax(Math.max(Array.isArray(v) ? v[0] : v, budgetMin + 20))} min={60} max={500} step={10} />
                  </div>
                </SliderControl>
              )}
            </div>
          </div>
        )}

        {isFlipView && (
          <div className="rounded-xl bg-emerald-50/50 border border-emerald-200/60 p-5 shadow-sm">
            <div className="grid grid-cols-5 gap-6">
              <SliderControl label="Superficie" value={`${flipSqm} m²`}>
                <Slider value={[flipSqm]} onValueChange={(v) => setFlipSqm(Array.isArray(v) ? v[0] : v)} min={40} max={220} step={5} />
              </SliderControl>
              <SliderControl label="Capex reno" value={`€${flipCapex}/m²`} infoTerm="Capex">
                <Slider value={[flipCapex]} onValueChange={(v) => setFlipCapex(Array.isArray(v) ? v[0] : v)} min={200} max={1200} step={25} />
              </SliderControl>
              <SliderControl label="Sconto acquisto" value={`${flipDiscount}%`} infoTerm="Sconto OMI">
                <Slider value={[flipDiscount]} onValueChange={(v) => setFlipDiscount(Array.isArray(v) ? v[0] : v)} min={0} max={40} step={2} />
              </SliderControl>
              <SliderControl label="Holding" value={`${flipMonths} mesi`} infoTerm="Holding">
                <Slider value={[flipMonths]} onValueChange={(v) => setFlipMonths(Array.isArray(v) ? v[0] : v)} min={3} max={18} step={1} />
              </SliderControl>
              <SliderControl label="Premio cattura" value={`${flipPremium}%`} infoTerm="Premio cattura">
                <Slider value={[flipPremium]} onValueChange={(v) => setFlipPremium(Array.isArray(v) ? v[0] : v)} min={40} max={100} step={5} />
              </SliderControl>
            </div>
          </div>
        )}

        {/* Province Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <MapPin className="w-3.5 h-3.5 text-stone-400 mr-1" />
          <button
            onClick={() => setFilterProvince("ALL")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
              filterProvince === "ALL"
                ? "bg-stone-800 text-white shadow-sm"
                : "text-stone-400 hover:text-stone-600 border border-stone-200 hover:border-stone-300 bg-white"
            }`}
          >
            Tutte
          </button>
          {Object.entries(PROVINCES).map(([code, p]) => (
            <button
              key={code}
              onClick={() => setFilterProvince(filterProvince === code ? "ALL" : code)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
                filterProvince === code
                  ? "text-white shadow-sm"
                  : "text-stone-400 hover:text-stone-600 border border-stone-200 hover:border-stone-300 bg-white"
              }`}
              style={filterProvince === code ? { backgroundColor: p.color, boxShadow: `0 2px 8px ${p.color}33` } : undefined}
            >
              {p.name}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => setFilterRisk(!filterRisk)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
              filterRisk
                ? "bg-red-50 text-red-600 border border-red-200"
                : "text-stone-400 hover:text-stone-600 border border-stone-200 hover:border-stone-300 bg-white"
            }`}
          >
            {filterRisk && "✓ "}Solo declino
          </button>
          <span className="text-[11px] font-mono font-semibold text-stone-400 bg-stone-100 px-2 py-1 rounded-md">
            {filtered.length}
          </span>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-[1fr_400px] gap-4 items-start">
          <div className="rounded-2xl bg-white border border-stone-200 overflow-hidden relative min-h-[640px] shadow-sm">
            <div className="absolute top-4 left-5 z-10 flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-md bg-white/80 backdrop-blur-sm border border-stone-200 shadow-sm">
                <span className="text-[10px] tracking-[0.2em] uppercase text-stone-500 font-semibold">
                  {viewConf.label}
                </span>
              </div>
            </div>

            {viewConf.kind === "map" && (
              <MapView
                zones={filtered}
                metric={viewConf.metric!}
                hovered={hovered}
                setHovered={setHovered}
                selected={selected}
                setSelected={setSelected}
                filterProvince={filterProvince}
              />
            )}
            {viewConf.kind === "scatter" && (
              <ScatterView
                zones={filtered}
                hovered={hovered}
                setHovered={setHovered}
                selected={selected}
                setSelected={setSelected}
              />
            )}
            {viewConf.kind === "inventory" && (
              <InventoryView
                zones={inventoryFiltered}
                budgetMin={budgetMin}
                budgetMax={budgetMax}
                ltv={ltv}
                hovered={hovered}
                setHovered={setHovered}
                selected={selected}
                setSelected={setSelected}
              />
            )}
            {viewConf.kind === "flipcalc" && (
              <FlipCalcView
                zones={filtered}
                flipSqm={flipSqm}
                flipCapex={flipCapex}
                flipDiscount={flipDiscount}
                flipMonths={flipMonths}
                flipPremium={flipPremium}
                hovered={hovered}
                setHovered={setHovered}
                selected={selected}
                setSelected={setSelected}
              />
            )}
          </div>

          {/* Side panels */}
          <div className="flex flex-col gap-4 sticky top-24">
            <DetailPanel zone={detailZone} view={view} ltv={ltv} />
            <RankingPanel
              zones={filtered}
              view={view}
              hovered={hovered}
              setHovered={setHovered}
              selected={selected}
              setSelected={setSelected}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-stone-200 pt-4 pb-6 mt-4">
          <p className="text-[11px] text-stone-400 leading-relaxed max-w-3xl">
            Flip Score 1-10 pesa: stock F/G, premio energetico classe A vs E-F-G, DOM, sconto acquisto OMI, ticket entrata.
            Calcolatore flip: capex turnkey + 8% fees acquisto + 10% fees tecniche + 3% vendita.
          </p>
        </footer>
      </div>
    </div>
  );
}
