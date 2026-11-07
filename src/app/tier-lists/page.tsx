import { connection } from "next/server";
import { TierListExplorer } from "@/components/tier-list-explorer";
import { getTierListCatalog } from "@/lib/catalog-database";

export const instant = false;

export default async function TierListsPage() {
  await connection();
  const tierListCatalog = await getTierListCatalog();

  return <TierListExplorer {...tierListCatalog} />;
}
