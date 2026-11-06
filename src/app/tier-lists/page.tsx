import { connection } from "next/server";
import { TierListExplorer } from "@/components/tier-list-explorer";
import { getCatalogItems } from "@/lib/catalog-database";

export const instant = false;

export default async function TierListsPage() {
  await connection();
  const catalogItems = await getCatalogItems();

  return <TierListExplorer catalogItems={catalogItems} />;
}
