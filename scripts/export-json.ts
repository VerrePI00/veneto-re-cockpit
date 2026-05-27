/**
 * Export SQLite database to zones.json for Netlify deploy.
 * Run after any scraping to keep the JSON file in sync.
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "immobiliare.db");
const JSON_PATH = path.join(process.cwd(), "data", "zones.json");

const db = new Database(DB_PATH);
const rows = db.prepare("SELECT * FROM zones ORDER BY province, name").all();

fs.writeFileSync(JSON_PATH, JSON.stringify(rows, null, 2));
console.log(`✓ Exported ${rows.length} zones to data/zones.json`);
db.close();
