/**
 * Scraper per prezzi medi da Immobiliare.it
 * Estrae il prezzo medio al m² per ogni zona dalla pagina dei prezzi di mercato.
 *
 * Uso: npx tsx scripts/scrape-immobiliare.ts
 *
 * NOTA: Immobiliare.it usa protezione anti-bot (DataDome).
 * Lo scraping funziona da IP residenziali ma NON da datacenter (GitHub Actions).
 * Per aggiornamento automatico: ./scripts/scrape-and-push.sh
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

const ZONE_SEARCH_TERMS: Record<string, string> = {
  sandona: "san-dona-di-piave",
  noventa: "noventa-di-piave",
  musile: "musile-di-piave",
  meolo: "meolo",
  quartoaltino: "quarto-d-altino",
  marcon: "marcon",
  jesolo: "jesolo",
  jesolopaese: "jesolo",
  caorle: "caorle",
  bibione: "san-michele-al-tagliamento",
  cavallino: "cavallino-treporti",
  eraclea: "eraclea",
  venezia: "venezia",
  mestre: "venezia-mestre",
  portogruaro: "portogruaro",
  chioggia: "chioggia",
  mira: "mira",
  mirano: "mirano",
  dolo: "dolo",
  treviso: "treviso",
  oderzo: "oderzo",
  motta: "motta-di-livenza",
  mogliano: "mogliano-veneto",
  casalesile: "casale-sul-sile",
  roncade: "roncade",
  conegliano: "conegliano",
  vittorio: "vittorio-veneto",
  castelfranco: "castelfranco-veneto",
  montebelluna: "montebelluna",
  asolo: "asolo",
  valdobbiadene: "valdobbiadene",
  padova: "padova",
  arcella: "padova-arcella",
  forcellini: "padova",
  mortise: "padova",
  voltabarozzo: "padova",
  abano: "abano-terme",
  montegrotto: "montegrotto-terme",
  cittadella: "cittadella",
  este: "este",
  monselice: "monselice",
  albignasego: "albignasego",
  verona: "verona",
  veronetta: "verona",
  cesiolo: "verona",
  borgotrento: "verona",
  borgovenezia: "verona",
  borgoroma: "verona",
  borgomilano: "verona",
  bardolino: "bardolino",
  peschiera: "peschiera-del-garda",
  lazise: "lazise",
  garda: "garda",
  malcesine: "malcesine",
  villafranca: "villafranca-di-verona",
  sanbonifacio: "san-bonifacio",
  bussolengo: "bussolengo",
  legnago: "legnago",
  negrar: "negrar-di-valpolicella",
  vicenza: "vicenza",
  bassano: "bassano-del-grappa",
  schio: "schio",
  thiene: "thiene",
  arzignano: "arzignano",
  valdagno: "valdagno",
  asiago: "asiago",
  marostica: "marostica",
  montecchio: "montecchio-maggiore",
  belluno: "belluno",
  cortina: "cortina-d-ampezzo",
  sanvito: "san-vito-di-cadore",
  falcade: "falcade",
  arabba: "livinallongo-del-col-di-lana",
  auronzo: "auronzo-di-cadore",
  sappada: "sappada",
  alleghe: "alleghe",
  feltre: "feltre",
  longarone: "longarone",
  pievecadore: "pieve-di-cadore",
  rovigo: "rovigo",
  adria: "adria",
  portotolle: "porto-tolle",
  rosolina: "rosolina",
  lendinara: "lendinara",
  badia: "badia-polesine",
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Estrae il prezzo medio dal HTML della pagina mercato immobiliare.
 * Immobiliare.it usa React con counter animato — il prezzo visibile
 * nel Counter è "€ 0" (placeholder). I dati reali sono nel:
 * 1. RSC payload JSON: "text":"3.343 €/m²"
 * 2. Testo descrittivo: "prezzo medio ... è di € 3.346 al metro quadro"
 * 3. Range: "da 2.030 €/m² a 6.067 €/m²"
 */
function extractPrice(html: string): number | null {
  // Strategy 1: RSC payload — "text":"N.NNN €/m²" (most accurate, it's the average)
  const rscMatch = html.match(/"text":"([\d.]+) €\/m²"/);
  if (rscMatch) {
    const price = parseInt(rscMatch[1].replace(/\./g, ""), 10);
    if (price > 100 && price < 20000) return price;
  }

  // Strategy 2: descriptive text with "prezzo medio" or "prezzo richiesto"
  const textMatch = html.match(
    /prezzo (?:medio|richiesto)[^€]{0,100}€\s*([\d.]+)\s*(?:al metro|\/m)/i
  );
  if (textMatch) {
    const price = parseInt(textMatch[1].replace(/\./g, ""), 10);
    if (price > 100 && price < 20000) return price;
  }

  // Strategy 3: range "da X.XXX €/m² a Y.YYY €/m²" — take midpoint
  const rangeMatch = html.match(/da\s+([\d.]+)\s*€\/m²\s*a\s+([\d.]+)\s*€\/m²/);
  if (rangeMatch) {
    const low = parseInt(rangeMatch[1].replace(/\./g, ""), 10);
    const high = parseInt(rangeMatch[2].replace(/\./g, ""), 10);
    const avg = Math.round((low + high) / 2);
    if (avg > 100 && avg < 20000) return avg;
  }

  return null;
}

async function scrapePrice(slug: string): Promise<number | null> {
  const url = `https://www.immobiliare.it/mercato-immobiliare/veneto/${slug}/`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
        "Accept-Language": "it",
      },
    });

    if (!res.ok) {
      console.warn(`[${res.status}]`);
      return null;
    }

    const html = await res.text();

    // Pagina troppo piccola = challenge/block page
    if (html.length < 5000) {
      console.warn("[BLOCKED - tiny response]");
      return null;
    }

    return extractPrice(html);
  } catch (err) {
    console.warn(`[ERROR] ${(err as Error).message}`);
    return null;
  }
}

async function main() {
  console.log("=== Scraping Immobiliare.it - Prezzi medi al m² ===\n");

  const insertPrice = db.prepare(
    "INSERT INTO price_history (zone_id, price, source) VALUES (?, ?, 'immobiliare.it')"
  );
  const updateZone = db.prepare(
    "UPDATE zones SET price = ?, updated_at = datetime('now') WHERE id = ?"
  );

  let updated = 0;
  let failed = 0;
  let consecutiveFails = 0;
  const entries = Object.entries(ZONE_SEARCH_TERMS);

  // Dedup: skip duplicate slugs
  const slugCache = new Map<string, number | null>();

  for (let i = 0; i < entries.length; i++) {
    const [zoneId, slug] = entries[i];
    process.stdout.write(`[${i + 1}/${entries.length}] ${zoneId} (${slug})... `);

    let price: number | null;

    if (slugCache.has(slug)) {
      price = slugCache.get(slug)!;
      if (price) console.log(`€${price}/m² (cache)`);
      else console.log("SKIP (cache)");
    } else {
      price = await scrapePrice(slug);
      slugCache.set(slug, price);

      if (price) {
        console.log(`€${price}/m²`);
        consecutiveFails = 0;
      } else {
        console.log("SKIP");
        consecutiveFails++;
      }
    }

    if (price) {
      insertPrice.run(zoneId, price);
      updateZone.run(price, zoneId);
      updated++;
    } else {
      failed++;
    }

    // 10 fallimenti consecutivi = probabilmente bloccato
    if (consecutiveFails >= 10) {
      console.log("\n⚠ 10 fallimenti consecutivi — IP probabilmente bloccato.");
      console.log("  Riprova tra qualche minuto.\n");
      break;
    }

    // Delay conservativo: 8-15 secondi tra richieste
    if (i < entries.length - 1 && !slugCache.has(entries[i + 1][1])) {
      const delay = 8000 + Math.random() * 7000;
      await sleep(delay);
    }
  }

  const status = updated === 0 ? "error" : failed > updated ? "partial" : "success";
  db.prepare(
    "INSERT INTO scrape_logs (source, status, zones_updated, error) VALUES (?, ?, ?, ?)"
  ).run(
    "immobiliare.it",
    status,
    updated,
    failed > 0 ? `${failed} zones failed` : null
  );

  console.log(`\n=== Completato: ${updated} aggiornati, ${failed} falliti ===`);
  db.close();
}

main().catch(console.error);
