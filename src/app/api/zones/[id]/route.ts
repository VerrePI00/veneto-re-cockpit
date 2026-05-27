import { NextRequest, NextResponse } from "next/server";
import { getZoneById, updateZone, getPriceHistory } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const zone = getZoneById(id);
  if (!zone) return NextResponse.json({ error: "Zone not found" }, { status: 404 });
  const history = getPriceHistory(id);
  return NextResponse.json({ ...zone, priceHistory: history });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const zone = getZoneById(id);
  if (!zone) return NextResponse.json({ error: "Zone not found" }, { status: 404 });

  const body = await req.json();
  updateZone(id, body);
  const updated = getZoneById(id);
  return NextResponse.json(updated);
}
