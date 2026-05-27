/**
 * Scraper per quotazioni OMI (Osservatorio del Mercato Immobiliare)
 * dell'Agenzia delle Entrate.
 *
 * L'API OMI pubblica le quotazioni semestrali per zona.
 * URL base: https://www1.agenziaentrate.gov.it/servizi/Consultazione/
 *
 * Uso: npx tsx scripts/scrape-omi.ts
 *
 * Nota: le quotazioni OMI vengono aggiornate semestralmente (H1 e H2).
 * Questo script è un template che va adattato quando l'API cambia.
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(__dirname, "..", "data", "immobiliare.db");
if (!fs.existsSync(DB_PATH)) {
  console.error("Database not found. Run seed.ts first.");
  process.exit(1);
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// OMI zone mapping: codice catastale -> zone IDs
// Ogni comune ha un codice catastale e una o più zone OMI
const OMI_MAPPING: Record<string, { catastale: string; provincia: string; zonaOmi?: string }> = {
  sandona: { catastale: "H823", provincia: "VE" },
  noventa: { catastale: "F963", provincia: "VE" },
  musile: { catastale: "F826", provincia: "VE" },
  meolo: { catastale: "F130", provincia: "VE" },
  quartoaltino: { catastale: "H117", provincia: "VE" },
  marcon: { catastale: "E936", provincia: "VE" },
  jesolo: { catastale: "C388", provincia: "VE" },
  caorle: { catastale: "B642", provincia: "VE" },
  cavallino: { catastale: "M308", provincia: "VE" },
  venezia: { catastale: "L736", provincia: "VE" },
  treviso: { catastale: "L407", provincia: "TV" },
  padova: { catastale: "G224", provincia: "PD" },
  verona: { catastale: "L781", provincia: "VR" },
  vicenza: { catastale: "L840", provincia: "VI" },
  belluno: { catastale: "A757", provincia: "BL" },
  rovigo: { catastale: "H620", provincia: "RO" },
};

async function fetchOmiData(codCatastale: string, provincia: string) {
  // L'API OMI dell'Agenzia delle Entrate richiede:
  // 1. Una sessione HTTPS con cookie
  // 2. Navigazione per provincia -> comune -> zona -> tipologia
  //
  // Questo è un template - l'endpoint effettivo varia.
  // L'alternativa più affidabile è scaricare il CSV/Excel dai bandi OMI:
  // https://www.agenziaentrate.gov.it/portale/web/guest/schede/fabbricatiterreni/omi/banche-dati/quotazioni-immobiliari

  const url = `https://www1.agenziaentrate.gov.it/servizi/Consultazione/ricerca.htm?provincia=${provincia}&comune=${codCatastale}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "text/html",
      },
    });

    if (!res.ok) {
      return null;
    }

    // In un'implementazione completa, qui si parserebbe l'HTML
    // per estrarre le quotazioni OMI per tipo (residenziale/commerciale)
    // e per stato (ottimo/normale/scadente)
    return null;
  } catch {
    return null;
  }
}

async function main() {
  console.log("=== Scraping OMI - Quotazioni Agenzia delle Entrate ===\n");
  console.log("NOTA: Questo script è un template.");
  console.log("Le quotazioni OMI vengono aggiornate semestralmente.");
  console.log("Per dati affidabili, scarica i CSV da:");
  console.log("https://www.agenziaentrate.gov.it/portale/web/guest/schede/fabbricatiterreni/omi/banche-dati/quotazioni-immobiliari\n");

  let updated = 0;

  for (const [zoneId, mapping] of Object.entries(OMI_MAPPING)) {
    process.stdout.write(`[${zoneId}] ${mapping.catastale} (${mapping.provincia})... `);
    const data = await fetchOmiData(mapping.catastale, mapping.provincia);

    if (data) {
      updated++;
      console.log("OK");
    } else {
      console.log("SKIP (API non disponibile - usa CSV manuale)");
    }
  }

  db.prepare(
    "INSERT INTO scrape_logs (source, status, zones_updated, error) VALUES (?, ?, ?, ?)"
  ).run("omi", updated > 0 ? "success" : "skipped", updated, "Template mode - use CSV import for real data");

  console.log(`\n=== Completato: ${updated} aggiornati ===`);
  console.log("\nPer importare dati OMI da CSV, usa: npx tsx scripts/import-omi-csv.ts <file.csv>");
  db.close();
}

main().catch(console.error);
