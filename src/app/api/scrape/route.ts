import { NextRequest, NextResponse } from "next/server";
import { addPriceRecord, updateZone, logScrape } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { source, updates } = await req.json() as {
    source: string;
    updates: { zoneId: string; price?: number; yieldLT?: number; yieldST?: number; dom?: number }[];
  };

  if (!source || !updates || !Array.isArray(updates)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  let count = 0;

  try {
    for (const u of updates) {
      if (u.price) {
        addPriceRecord(u.zoneId, u.price, source);
      }
      const fields: Partial<Record<string, unknown>> = {};
      if (u.yieldLT != null) fields.yieldLT = u.yieldLT;
      if (u.yieldST != null) fields.yieldST = u.yieldST;
      if (u.dom != null) fields.dom = u.dom;
      if (Object.keys(fields).length > 0) {
        updateZone(u.zoneId, fields);
      }
      count++;
    }
    logScrape(source, "success", count);
    return NextResponse.json({ success: true, updated: count });
  } catch (err) {
    const msg = (err as Error).message;
    logScrape(source, "error", 0, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Scrape API — use POST to update data." });
}
