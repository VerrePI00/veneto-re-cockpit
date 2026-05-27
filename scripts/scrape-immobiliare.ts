/**
 * Scraper per prezzi medi da Immobiliare.it
 * Estrae il prezzo medio al m² per ogni zona dalla pagina dei prezzi di mercato.
 *
 * Uso: npx tsx scripts/scrape-immobiliare.ts
 *
 * Nota: Immobiliare.it ha rate limiting. Lo script usa delay tra le richieste.
 * Per uso in produzione, considera di usare le API ufficiali di Immobiliare.it Insights.
 */

import Database from "better-sqlite3";
import * as cheerio from "cheerio";
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

async function scrapePrice(slug: string): Promise<number | null> {
  const url = `https://www.immobiliare.it/mercato-immobiliare/veneto/${slug}/`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "it-IT,it;q=0.9",
      },
    });

    if (!res.ok) {
      console.warn(`  [${res.status}] ${slug}`);
      return null;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Look for the price per m² in the market data page
    // The page typically shows "Prezzo medio" in a prominent element
    const priceText = $("[data-testid='average-price']").text()
      || $(".in-realEstateMarketValue__value").first().text()
      || $("span:contains('€/m²')").first().parent().text();

    if (!priceText) {
      // Try JSON-LD structured data
      const jsonLd = $('script[type="application/ld+json"]').text();
      if (jsonLd) {
        try {
          const data = JSON.parse(jsonLd);
          if (data?.mainEntity?.value) {
            return Math.round(parseFloat(data.mainEntity.value));
          }
        } catch {
          // ignore JSON parse errors
        }
      }
      return null;
    }

    // Extract number from text like "€ 1.906/m²" or "1.906 €/m²"
    const match = priceText.replace(/\./g, "").match(/(\d[\d,.]*)\s*€?\s*\/?\s*m/i)
      || priceText.replace(/\./g, "").match(/€\s*(\d[\d,.]*)/);

    if (match) {
      return Math.round(parseFloat(match[1].replace(",", ".")));
    }

    return null;
  } catch (err) {
    console.warn(`  [ERROR] ${slug}: ${(err as Error).message}`);
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
  const entries = Object.entries(ZONE_SEARCH_TERMS);

  for (let i = 0; i < entries.length; i++) {
    const [zoneId, slug] = entries[i];
    process.stdout.write(`[${i + 1}/${entries.length}] ${zoneId} (${slug})... `);

    const price = await scrapePrice(slug);

    if (price && price > 100 && price < 20000) {
      insertPrice.run(zoneId, price);
      updateZone.run(price, zoneId);
      console.log(`€${price}/m²`);
      updated++;
    } else {
      console.log("SKIP (no data or out of range)");
      failed++;
    }

    // Rate limiting: wait between 2-4 seconds between requests
    if (i < entries.length - 1) {
      await sleep(2000 + Math.random() * 2000);
    }
  }

  // Log the scrape
  db.prepare(
    "INSERT INTO scrape_logs (source, status, zones_updated, error) VALUES (?, ?, ?, ?)"
  ).run("immobiliare.it", failed === entries.length ? "error" : "success", updated, failed > 0 ? `${failed} zones failed` : null);

  console.log(`\n=== Completato: ${updated} aggiornati, ${failed} falliti ===`);
  db.close();
}

main().catch(console.error);
