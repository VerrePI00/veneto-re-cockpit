import { NextResponse } from "next/server";
import { getAllZones } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const zones = getAllZones();
  return NextResponse.json(zones);
}
