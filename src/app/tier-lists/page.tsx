import { connection } from "next/server";
import { SnapshotNotice } from "@/components/snapshot-notice";
import { TierListExplorer } from "@/components/tier-list-explorer";
import { getTierListCatalog } from "@/lib/catalog-database";

export const instant = false;

export default async function TierListsPage() {
  await connection();
  const { source, ...tierListCatalog } = await getTierListCatalog();

  return <>
    <SnapshotNotice source={source} />
    <TierListExplorer {...tierListCatalog} />
  </>;
}
