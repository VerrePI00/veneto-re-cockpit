import path from "path";
import fs from "fs";

// Zone type (shared with types.ts but defined here for the DB layer)
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

function rowToZone(row: Record<string, unknown>): Zone {
  return {
    id: row.id as string,
    name: row.name as string,
    province: row.province as string,
    x: row.x as number,
    y: row.y as number,
    price: row.price as number,
    rentLT: row.rent_lt as number,
    yieldLT: row.yield_lt as number | null,
    yieldST: row.yield_st as number | null,
    score10y: row.score_10y as number,
    trend: row.trend as "up" | "stable" | "down",
    apprec: row.apprec as number,
    invMin: row.inv_min as number,
    invMax: row.inv_max as number,
    flipScore: row.flip_score as number,
    energyPremium: row.energy_premium as number,
    typicalDiscount: row.typical_discount as number,
    dom: row.dom as number,
    fgStock: row.fg_stock as number,
    flipNote: row.flip_note as string,
    note: row.note as string,
    tags: typeof row.tags === "string" ? JSON.parse(row.tags || "[]") : (row.tags as string[]) || [],
    drivers: typeof row.drivers === "string" ? JSON.parse(row.drivers || "[]") : (row.drivers as string[]) || [],
    risks: typeof row.risks === "string" ? JSON.parse(row.risks || "[]") : (row.risks as string[]) || [],
    updatedAt: (row.updated_at as string) || new Date().toISOString(),
  };
}

// --- JSON-based data layer (works everywhere, no native deps) ---

const JSON_PATH = path.join(process.cwd(), "data", "zones.json");

let cachedZones: Zone[] | null = null;

function loadFromJson(): Zone[] {
  if (cachedZones) return cachedZones;
  const raw = fs.readFileSync(JSON_PATH, "utf-8");
  const rows = JSON.parse(raw) as Record<string, unknown>[];
  cachedZones = rows.map(rowToZone);
  return cachedZones;
}

// --- SQLite layer (local dev / scraping only) ---

let sqliteDb: unknown = null;

function getSqliteDb() {
  if (sqliteDb) return sqliteDb as import("better-sqlite3").Database;
  try {
    // Dynamic import to avoid bundling issues on serverless
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    const DB_PATH = path.join(process.cwd(), "data", "immobiliare.db");
    const db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
    sqliteDb = db;
    return db as import("better-sqlite3").Database;
  } catch {
    return null;
  }
}

function initSchema(db: import("better-sqlite3").Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS zones (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      province TEXT NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL,
      price REAL,
      rent_lt REAL,
      yield_lt REAL,
      yield_st REAL,
      score_10y REAL,
      trend TEXT DEFAULT 'stable',
      apprec REAL,
      inv_min INTEGER,
      inv_max INTEGER,
      flip_score REAL,
      energy_premium REAL,
      typical_discount REAL,
      dom INTEGER,
      fg_stock REAL,
      flip_note TEXT,
      note TEXT,
      tags TEXT DEFAULT '[]',
      drivers TEXT DEFAULT '[]',
      risks TEXT DEFAULT '[]',
      updated_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      zone_id TEXT NOT NULL REFERENCES zones(id),
      price REAL NOT NULL,
      source TEXT,
      recorded_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scrape_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      status TEXT NOT NULL,
      zones_updated INTEGER DEFAULT 0,
      error TEXT,
      run_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

// --- Public API ---

export function getAllZones(): Zone[] {
  // Try SQLite first (local dev), fall back to JSON (production / Netlify)
  const db = getSqliteDb();
  if (db) {
    const rows = db.prepare("SELECT * FROM zones ORDER BY province, name").all() as Record<string, unknown>[];
    return rows.map(rowToZone);
  }
  return loadFromJson();
}

export function getZoneById(id: string): Zone | null {
  const db = getSqliteDb();
  if (db) {
    const row = db.prepare("SELECT * FROM zones WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    return row ? rowToZone(row) : null;
  }
  return loadFromJson().find((z) => z.id === id) || null;
}

export function updateZone(id: string, data: Partial<Record<string, unknown>>): void {
  const db = getSqliteDb();
  if (!db) return; // read-only in JSON mode

  const fields: string[] = [];
  const values: unknown[] = [];

  const columnMap: Record<string, string> = {
    price: "price", rentLT: "rent_lt", yieldLT: "yield_lt", yieldST: "yield_st",
    score10y: "score_10y", trend: "trend", apprec: "apprec", invMin: "inv_min",
    invMax: "inv_max", flipScore: "flip_score", energyPremium: "energy_premium",
    typicalDiscount: "typical_discount", dom: "dom", fgStock: "fg_stock",
    flipNote: "flip_note", note: "note", tags: "tags", drivers: "drivers", risks: "risks",
  };

  for (const [key, col] of Object.entries(columnMap)) {
    if (key in data) {
      fields.push(`${col} = ?`);
      const val = data[key];
      values.push(Array.isArray(val) ? JSON.stringify(val) : val);
    }
  }

  if (fields.length === 0) return;
  fields.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE zones SET ${fields.join(", ")} WHERE id = ?`).run(...values);
}

export function addPriceRecord(zoneId: string, price: number, source: string): void {
  const db = getSqliteDb();
  if (!db) return;
  db.prepare("INSERT INTO price_history (zone_id, price, source) VALUES (?, ?, ?)").run(zoneId, price, source);
  db.prepare("UPDATE zones SET price = ?, updated_at = datetime('now') WHERE id = ?").run(price, zoneId);
}

export function logScrape(source: string, status: string, zonesUpdated: number, error?: string): void {
  const db = getSqliteDb();
  if (!db) return;
  db.prepare("INSERT INTO scrape_logs (source, status, zones_updated, error) VALUES (?, ?, ?, ?)").run(
    source, status, zonesUpdated, error || null
  );
}

export function getPriceHistory(zoneId: string, limit = 24): { price: number; source: string; recordedAt: string }[] {
  const db = getSqliteDb();
  if (!db) return [];
  const rows = db
    .prepare("SELECT price, source, recorded_at FROM price_history WHERE zone_id = ? ORDER BY recorded_at DESC LIMIT ?")
    .all(zoneId, limit) as { price: number; source: string; recorded_at: string }[];
  return rows.map((r) => ({ price: r.price, source: r.source, recordedAt: r.recorded_at }));
}
