"use client";

import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

const GLOSSARY: Record<string, string> = {
  "CoC": "Cash-on-Cash: rendimento annuo netto rapportato al solo capitale proprio investito (equity), al netto di mutuo, tasse e spese operative.",
  "Cash-on-Cash": "Rendimento annuo netto rapportato al solo capitale proprio investito (equity), al netto di mutuo, tasse e spese operative.",
  "LTV": "Loan-to-Value: percentuale del valore dell'immobile finanziata tramite mutuo. Un LTV del 70% significa che il 70% è coperto dal mutuo e il 30% è equity propria.",
  "TAEG": "Tasso Annuo Effettivo Globale: il costo complessivo annuo del mutuo, comprensivo di interessi e spese accessorie.",
  "Yield LT": "Rendimento lordo da affitto long-term: rapporto tra canone annuo di locazione tradizionale e valore dell'immobile, espresso in percentuale.",
  "Yield ST": "Rendimento lordo da affitto short-term: rapporto tra ricavo annuo da affitti brevi (es. Airbnb) e valore dell'immobile.",
  "Score 10y": "Indice di sostenibilità a 10 anni: valutazione sintetica (1-10) che combina trend demografici, domanda locativa, infrastrutture e prospettive di rivalutazione nel prossimo decennio.",
  "Sostenibilità 10y": "Indice di sostenibilità a 10 anni: valutazione sintetica (1-10) che combina trend demografici, domanda locativa, infrastrutture e prospettive di rivalutazione nel prossimo decennio.",
  "Flip Score": "Punteggio (1-10) che misura l'attrattività di una zona per operazioni fix-and-flip. Considera stock in classe F/G, premio energetico, DOM, sconto OMI e ticket d'ingresso.",
  "IRR": "Internal Rate of Return (Tasso Interno di Rendimento): rendimento annualizzato dell'investimento, tiene conto del timing dei flussi di cassa.",
  "DOM": "Days on Market: numero medio di giorni necessari per vendere un immobile nella zona. Valori bassi indicano alta liquidità del mercato.",
  "OMI": "Osservatorio del Mercato Immobiliare dell'Agenzia delle Entrate. Pubblica le quotazioni ufficiali al m² per ogni zona censuaria italiana, divise per tipologia e stato di conservazione.",
  "Capex": "Capital Expenditure: spesa in conto capitale per ristrutturazione o miglioramento dell'immobile, espressa tipicamente in €/m².",
  "Premio energetico": "Differenza percentuale di valore tra un immobile in classe energetica alta (A/B) rispetto a uno in classe bassa (E/F/G) nella stessa zona.",
  "Stock F/G": "Percentuale di immobili nella zona con classe energetica F o G, i più inefficienti. Un valore alto indica maggiore opportunità di riqualificazione energetica.",
  "Cedolare secca": "Regime fiscale opzionale per gli affitti che prevede un'imposta sostitutiva fissa del 21% (10% per canone concordato) al posto dell'IRPEF ordinaria.",
  "OPEX": "Operating Expenses: spese operative ricorrenti dell'immobile (gestione, manutenzione, assicurazione, IMU, periodi di vacancy). Stimate al 35% del canone lordo.",
  "Margine": "Differenza tra il ricavo netto di vendita e il costo totale all-in (acquisto + ristrutturazione + oneri). Indica il profitto lordo dell'operazione di flip.",
  "Equity": "Capitale proprio investito dall'acquirente, ovvero la parte del prezzo non coperta dal mutuo.",
  "All-in": "Costo totale dell'operazione: prezzo d'acquisto + oneri notarili e fiscali + ristrutturazione + spese tecniche + costi di mantenimento durante l'holding.",
  "Apprez. annuo": "Apprezzamento annuo: variazione percentuale attesa del valore degli immobili nella zona su base annuale.",
  "Sconto OMI": "Differenza percentuale tra il prezzo effettivo di acquisto e la quotazione OMI ufficiale. Immobili da ristrutturare si acquistano tipicamente con sconti del 15-30% rispetto all'OMI.",
  "Holding": "Periodo di detenzione dell'immobile durante un'operazione di flip, dal momento dell'acquisto alla rivendita. Espresso in mesi.",
  "Premio cattura": "Percentuale del premio energetico teorico che si riesce effettivamente a catturare nella rivendita. Dipende dalla qualità della ristrutturazione e dal mercato locale.",
  "Driver di domanda": "Fattori che sostengono la domanda immobiliare nella zona: università, ospedali, poli industriali, turismo, infrastrutture di trasporto, etc.",
};

type InfoTipProps = {
  term: string;
  className?: string;
};

export function InfoTip({ term, className }: InfoTipProps) {
  const explanation = GLOSSARY[term];
  if (!explanation) return null;

  return (
    <Tooltip>
      <TooltipTrigger
        className={`inline-flex items-center justify-center w-4 h-4 rounded-full border border-stone-300 text-stone-400 hover:text-stone-600 hover:border-stone-400 hover:bg-stone-100 transition-colors cursor-help ml-1 align-middle ${className ?? ""}`}
      >
        <Info className="w-2.5 h-2.5" />
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-xs text-xs leading-relaxed bg-white text-stone-700 border border-stone-200 shadow-lg rounded-lg px-3 py-2"
      >
        <span className="font-semibold text-stone-900">{term}</span>
        <br />
        {explanation}
      </TooltipContent>
    </Tooltip>
  );
}
