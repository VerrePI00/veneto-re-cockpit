import { getAllZones } from "@/lib/db";
import { Dashboard } from "@/components/dashboard/Dashboard";

export const dynamic = "force-dynamic";

export default function Home() {
  const zones = getAllZones();
  return <Dashboard initialZones={zones} />;
}
