import { NextRequest, NextResponse } from "next/server";
import { getDb, logScrape } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { source, updates } = await req.json() as {
    source: string;
    updates: { zoneId: string; price?: number; yieldLT?: number; yieldST?: number; dom?: number }[];
  };

  if (!source || !updates || !Array.isArray(updates)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const db = getDb();
  let count = 0;

  const updatePrice = db.prepare(
    "UPDATE zones SET price = ?, updated_at = datetime('now') WHERE id = ?"
  );
  const insertHistory = db.prepare(
    "INSERT INTO price_history (zone_id, price, source) VALUES (?, ?, ?)"
  );
  const updateField = db.prepare(
    "UPDATE zones SET yield_lt = COALESCE(?, yield_lt), yield_st = COALESCE(?, yield_st), dom = COALESCE(?, dom), updated_at = datetime('now') WHERE id = ?"
  );

  const tx = db.transaction(() => {
    for (const u of updates) {
      if (u.price) {
        updatePrice.run(u.price, u.zoneId);
        insertHistory.run(u.zoneId, u.price, source);
      }
      if (u.yieldLT || u.yieldST || u.dom) {
        updateField.run(u.yieldLT || null, u.yieldST || null, u.dom || null, u.zoneId);
      }
      count++;
    }
  });

  try {
    tx();
    logScrape(source, "success", count);
    return NextResponse.json({ success: true, updated: count });
  } catch (err) {
    const msg = (err as Error).message;
    logScrape(source, "error", 0, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const db = getDb();
  const logs = db.prepare("SELECT * FROM scrape_logs ORDER BY run_at DESC LIMIT 20").all();
  return NextResponse.json(logs);
}
