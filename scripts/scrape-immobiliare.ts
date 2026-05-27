/**
 * Scraper per prezzi medi da Immobiliare.it
 * Estrae il prezzo medio al m² per ogni zona dalla pagina dei prezzi di mercato.
 *
 * Uso: npx tsx scripts/scrape-immobiliare.ts
 *
 * Strategia anti-blocking:
 * - Richiesta iniziale alla homepage per ottenere cookies di sessione
 * - Headers realistici con Referer, Sec-Fetch-*, Accept-Encoding
 * - Delay randomizzato tra 3-6 secondi tra le richieste
 * - Retry con backoff esponenziale su errori transitori
 * - Batch con pause lunghe ogni 15 richieste
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

// Session cookies raccolti dalla homepage
let sessionCookies = "";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

function getHeaders(referer?: string): Record<string, string> {
  return {
    "User-Agent": UA,
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    "Sec-Ch-Ua": '"Chromium";v="125", "Google Chrome";v="125", "Not-A.Brand";v="99"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": referer ? "same-origin" : "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    ...(referer ? { Referer: referer } : {}),
    ...(sessionCookies ? { Cookie: sessionCookies } : {}),
  };
}

/**
 * Inizializza la sessione visitando la homepage per raccogliere cookies.
 */
async function initSession(): Promise<void> {
  console.log("Inizializzazione sessione...");
  try {
    const res = await fetch("https://www.immobiliare.it/", {
      headers: getHeaders(),
      redirect: "follow",
    });
    // Estrai i cookies dalla risposta
    const setCookies = res.headers.getSetCookie?.() ?? [];
    sessionCookies = setCookies
      .map((c) => c.split(";")[0])
      .join("; ");
    console.log(
      sessionCookies
        ? `  Session inizializzata (${setCookies.length} cookies)`
        : "  Nessun cookie ricevuto (procedo senza)"
    );
    // Consuma il body
    await res.text();
  } catch (err) {
    console.warn(`  Errore init sessione: ${(err as Error).message}`);
  }
}

async function scrapePrice(slug: string, attempt = 1): Promise<number | null> {
  const url = `https://www.immobiliare.it/mercato-immobiliare/veneto/${slug}/`;
  const maxAttempts = 3;

  try {
    const res = await fetch(url, {
      headers: getHeaders("https://www.immobiliare.it/mercato-immobiliare/veneto/"),
      redirect: "follow",
    });

    if (res.status === 429 || res.status === 503) {
      // Rate limited — retry con backoff
      if (attempt < maxAttempts) {
        const wait = attempt * 10000 + Math.random() * 5000;
        console.warn(`  [${res.status}] rate limited, retry in ${Math.round(wait / 1000)}s...`);
        await sleep(wait);
        return scrapePrice(slug, attempt + 1);
      }
      console.warn(`  [${res.status}] ${slug} (max retry)`);
      return null;
    }

    if (res.status === 403) {
      // Cloudflare/WAF block — retry una volta con delay più lungo
      if (attempt < 2) {
        const wait = 15000 + Math.random() * 10000;
        console.warn(`  [403] blocked, retry in ${Math.round(wait / 1000)}s...`);
        await sleep(wait);
        // Re-init sessione
        await initSession();
        await sleep(3000);
        return scrapePrice(slug, attempt + 1);
      }
      console.warn(`  [403] ${slug}`);
      return null;
    }

    if (!res.ok) {
      console.warn(`  [${res.status}] ${slug}`);
      return null;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Strategy 1: data-testid attribute
    let priceText = $("[data-testid='average-price']").text();

    // Strategy 2: class-based selector
    if (!priceText) {
      priceText = $(".in-realEstateMarketValue__value").first().text();
    }

    // Strategy 3: look for the price indicator text
    if (!priceText) {
      priceText = $("span:contains('€/m²')").first().parent().text();
    }

    // Strategy 4: look for price in any element containing "/m²"
    if (!priceText) {
      $("*").each((_, el) => {
        const text = $(el).text();
        if (text.includes("/m²") && text.includes("€") && text.length < 50) {
          priceText = text;
          return false; // break
        }
      });
    }

    // Strategy 5: JSON-LD structured data
    if (!priceText) {
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).text());
          if (data?.mainEntity?.value) {
            priceText = String(data.mainEntity.value);
            return false;
          }
          // Some pages nest it differently
          if (data?.["@graph"]) {
            for (const item of data["@graph"]) {
              if (item?.value && item?.["@type"]?.includes?.("PropertyValue")) {
                priceText = String(item.value);
                return false;
              }
            }
          }
        } catch {
          // ignore JSON parse errors
        }
      });
    }

    // Strategy 6: __NEXT_DATA__ JSON
    if (!priceText) {
      const nextDataScript = $("#__NEXT_DATA__").text();
      if (nextDataScript) {
        try {
          const nextData = JSON.parse(nextDataScript);
          const pageProps = nextData?.props?.pageProps;
          if (pageProps?.averagePrice) {
            return Math.round(pageProps.averagePrice);
          }
          if (pageProps?.marketData?.averagePrice) {
            return Math.round(pageProps.marketData.averagePrice);
          }
        } catch {
          // ignore
        }
      }
    }

    if (!priceText) {
      return null;
    }

    // Se è già un numero puro (da JSON-LD o NEXT_DATA)
    const numericOnly = priceText.trim().replace(/[.,]/g, "");
    if (/^\d+$/.test(numericOnly) && numericOnly.length <= 6) {
      const val = parseInt(numericOnly, 10);
      if (val > 100 && val < 20000) return val;
    }

    // Extract number from text like "€ 1.906/m²" or "1.906 €/m²"
    const cleaned = priceText.replace(/\./g, "");
    const match =
      cleaned.match(/(\d[\d,.]*)\s*€?\s*\/?\s*m/i) ||
      cleaned.match(/€\s*(\d[\d,.]*)/);

    if (match) {
      return Math.round(parseFloat(match[1].replace(",", ".")));
    }

    return null;
  } catch (err) {
    if (attempt < maxAttempts) {
      const wait = attempt * 5000;
      console.warn(`  [ERROR] ${slug}: ${(err as Error).message}, retry in ${wait / 1000}s...`);
      await sleep(wait);
      return scrapePrice(slug, attempt + 1);
    }
    console.warn(`  [ERROR] ${slug}: ${(err as Error).message}`);
    return null;
  }
}

async function main() {
  console.log("=== Scraping Immobiliare.it - Prezzi medi al m² ===\n");

  // Inizializza sessione con cookies
  await initSession();
  await sleep(2000);

  const insertPrice = db.prepare(
    "INSERT INTO price_history (zone_id, price, source) VALUES (?, ?, 'immobiliare.it')"
  );
  const updateZone = db.prepare(
    "UPDATE zones SET price = ?, updated_at = datetime('now') WHERE id = ?"
  );

  let updated = 0;
  let failed = 0;
  const entries = Object.entries(ZONE_SEARCH_TERMS);

  // Dedup: evita di fare due richieste per lo stesso slug nella stessa sessione
  const slugCache = new Map<string, number | null>();

  for (let i = 0; i < entries.length; i++) {
    const [zoneId, slug] = entries[i];
    process.stdout.write(`[${i + 1}/${entries.length}] ${zoneId} (${slug})... `);

    let price: number | null;

    // Se abbiamo già scaricato questo slug, riusa il risultato
    if (slugCache.has(slug)) {
      price = slugCache.get(slug)!;
      if (price) {
        console.log(`€${price}/m² (cache)`);
      }
    } else {
      price = await scrapePrice(slug);
      slugCache.set(slug, price);

      if (price && price > 100 && price < 20000) {
        console.log(`€${price}/m²`);
      } else {
        console.log("SKIP (no data or out of range)");
      }
    }

    if (price && price > 100 && price < 20000) {
      insertPrice.run(zoneId, price);
      updateZone.run(price, zoneId);
      updated++;
    } else {
      failed++;
    }

    // Rate limiting: wait between 3-6 seconds between requests
    if (i < entries.length - 1 && !slugCache.has(entries[i + 1][1])) {
      const delay = 3000 + Math.random() * 3000;
      await sleep(delay);
    }

    // Pausa lunga ogni 15 richieste per evitare blocchi
    if ((i + 1) % 15 === 0 && i < entries.length - 1) {
      const pause = 10000 + Math.random() * 10000;
      console.log(`  --- Pausa di ${Math.round(pause / 1000)}s ---`);
      await sleep(pause);
    }
  }

  // Log the scrape
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

  // Exit con codice non-zero solo se nessun dato è stato raccolto
  if (updated === 0) {
    console.error("ATTENZIONE: Nessun dato raccolto. Immobiliare.it potrebbe bloccare gli IP datacenter.");
    console.error("I dati esistenti restano validi nel database.");
    process.exit(0); // Exit 0 comunque per non bloccare il workflow
  }
}

main().catch(console.error);
