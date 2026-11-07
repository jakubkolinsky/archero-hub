import { createClient } from "@supabase/supabase-js";
import { Category, Item, items as curatedItems } from "@/lib/catalog";

type CatalogRow = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  category: string;
  description: string | null;
};

export type PublishedTierList = {
  id: string;
  title: string;
  gameVersion: string;
};

export type PublishedTierRanking = {
  itemId: string;
  tierListId: string;
  tier: Item["tier"];
  score: number;
};

type TierListRow = {
  id: string;
  title: string;
  game_version: string;
};

type TierRankingRow = {
  item_id: string;
  tier_list_id: string;
  tier: Exclude<Item["tier"], "Unranked">;
  score: number;
};

const categoryBySlug: Record<string, Category> = {
  weapon: "Weapon",
  armor: "Armor",
  ring: "Ring",
  pet: "Pet",
  bracelet: "Bracelet",
  locket: "Locket",
  book: "Book",
  dragon: "Dragon",
  relic: "Relic",
  glyph: "Glyph",
  rune: "Rune",
  hero: "Hero",
  hero_assist: "Hero Assist",
  totem: "Totem",
  skin: "Skin",
};

const curatedItemAliases: Record<string, string> = {
  "demon-blade-rain": "demon-blade",
  "enlightenment": "enlightenment-book",
  "expedition-fist": "expedition-fists",
};

function getCuratedItem(row: CatalogRow) {
  const itemId = curatedItemAliases[row.slug] ?? row.slug;

  return curatedItems.find((item) => item.id === itemId || item.name === row.name);
}

function toCatalogItem(row: CatalogRow): Item {
  const curatedItem = getCuratedItem(row);
  const category = categoryBySlug[row.category];

  if (!category) {
    throw new Error(`Unsupported catalog category: ${row.category}`);
  }

  return {
    id: curatedItem?.id ?? row.slug,
    databaseId: row.id,
    name: row.name,
    category,
    tier: curatedItem?.tier ?? "Unranked",
    score: curatedItem?.score ?? 0,
    description: row.description ?? curatedItem?.description ?? "Imported catalog record pending in-game verification.",
    strengths: curatedItem?.strengths ?? "Pending verification",
    weaknesses: curatedItem?.weaknesses ?? "Pending verification",
    bestModes: curatedItem?.bestModes ?? [],
    accent: curatedItem?.accent ?? "from-stone-300 to-stone-700",
    meta: curatedItem?.meta ?? "Situational",
    imageUrl: row.image_url,
  };
}

function createCatalogClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(url, publishableKey);
}

export async function getCatalogItems(): Promise<Item[]> {
  const supabase = createCatalogClient();
  const { data, error } = await supabase
    .from("items")
    .select("id, name, slug, image_url, category, description")
    .eq("active", true)
    .order("name");

  if (error) {
    throw new Error(`Unable to load the catalog: ${error.message}`);
  }

  const importedItems = (data as CatalogRow[]).map(toCatalogItem);
  const catalogItems = new Map(curatedItems.map((item) => [item.id, item]));

  for (const item of importedItems) {
    catalogItems.set(item.id, item);
  }

  return [...catalogItems.values()];
}

export async function getTierListCatalog(): Promise<{
  catalogItems: Item[];
  publishedTierLists: PublishedTierList[];
  publishedTierRankings: PublishedTierRanking[];
}> {
  const supabase = createCatalogClient();
  const [catalogItems, tierListsResult] = await Promise.all([
    getCatalogItems(),
    supabase
      .from("tier_lists")
      .select("id, title, game_version")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false }),
  ]);

  if (tierListsResult.error) {
    throw new Error(`Unable to load tier lists: ${tierListsResult.error.message}`);
  }

  const tierLists = (tierListsResult.data as TierListRow[]).map((tierList) => ({
    id: tierList.id,
    title: tierList.title,
    gameVersion: tierList.game_version,
  }));

  if (!tierLists.length) {
    return { catalogItems, publishedTierLists: [], publishedTierRankings: [] };
  }

  const { data, error } = await supabase
    .from("tier_rankings")
    .select("item_id, tier_list_id, tier, score")
    .in("tier_list_id", tierLists.map((tierList) => tierList.id));

  if (error) {
    throw new Error(`Unable to load tier rankings: ${error.message}`);
  }

  return {
    catalogItems,
    publishedTierLists: tierLists,
    publishedTierRankings: (data as TierRankingRow[]).map((ranking) => ({
      itemId: ranking.item_id,
      tierListId: ranking.tier_list_id,
      tier: ranking.tier,
      score: ranking.score,
    })),
  };
}
