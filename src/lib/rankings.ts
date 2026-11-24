import type { Item } from "@/lib/catalog";
import type { PublishedTierList, PublishedTierRanking } from "@/lib/catalog-database";

/** The tier list shown across the site: the 6.10.2 starting list, else the newest published one. */
export function selectTierListId(publishedTierLists: PublishedTierList[]): string {
  return publishedTierLists.find((tierList) => tierList.gameVersion === "6.10.2")?.id ?? publishedTierLists[0]?.id ?? "";
}

/**
 * Applies the selected published tier list to catalog items. Items without a
 * ranking become Unranked, so the loadout and the tier list always agree.
 * With no published tier list, items keep their curated draft tiers.
 */
export function applyPublishedRankings(
  catalogItems: Item[],
  publishedTierLists: PublishedTierList[],
  publishedTierRankings: PublishedTierRanking[],
): Item[] {
  const tierListId = selectTierListId(publishedTierLists);
  if (!tierListId) return catalogItems;

  const rankings = new Map(
    publishedTierRankings
      .filter((ranking) => ranking.tierListId === tierListId)
      .map((ranking) => [ranking.itemId, ranking]),
  );

  return catalogItems.map((item) => {
    const ranking = item.databaseId ? rankings.get(item.databaseId) : undefined;
    return ranking
      ? { ...item, tier: ranking.tier, score: ranking.score }
      : { ...item, tier: "Unranked" as const, score: 0 };
  });
}
