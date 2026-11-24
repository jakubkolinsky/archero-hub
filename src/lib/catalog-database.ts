import { createClient } from "@supabase/supabase-js";
import { Category, Item, curatedItemAliases, items as curatedItems } from "@/lib/catalog";
import catalogSnapshot from "@/lib/catalog-snapshot.json";

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
  spirit: "Spirit",
  relic: "Relic",
  glyph: "Glyph",
  rune: "Rune",
  hero: "Hero",
  hero_assist: "Hero Assist",
  totem: "Totem",
  skin: "Skin",
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

// Supabase requests give up after this long so a paused or slow database falls
// back to the snapshot instead of hanging the page.
const DATABASE_TIMEOUT_MS = 4000;

export type CatalogSource = "live" | "snapshot";

type TierCatalog = {
  catalogItems: Item[];
  publishedTierLists: PublishedTierList[];
  publishedTierRankings: PublishedTierRanking[];
};

type Snapshot = {
  items: CatalogRow[];
  tierLists: TierListRow[];
  tierRankings: TierRankingRow[];
};

function createCatalogClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(url, publishableKey, {
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(DATABASE_TIMEOUT_MS) }) },
  });
}

function mergeWithCurated(rows: CatalogRow[]): Item[] {
  const catalogItems = new Map(curatedItems.map((item) => [item.id, item]));

  for (const item of rows.map(toCatalogItem)) {
    catalogItems.set(item.id, item);
  }

  return [...catalogItems.values()];
}

function toTierLists(rows: TierListRow[]): PublishedTierList[] {
  return rows.map((tierList) => ({ id: tierList.id, title: tierList.title, gameVersion: tierList.game_version }));
}

function toTierRankings(rows: TierRankingRow[]): PublishedTierRanking[] {
  return rows.map((ranking) => ({
    itemId: ranking.item_id,
    tierListId: ranking.tier_list_id,
    tier: ranking.tier,
    score: ranking.score,
  }));
}

function snapshotTierCatalog(): TierCatalog {
  const snapshot = catalogSnapshot as Snapshot;
  return {
    catalogItems: mergeWithCurated(snapshot.items),
    publishedTierLists: toTierLists(snapshot.tierLists),
    publishedTierRankings: toTierRankings(snapshot.tierRankings),
  };
}

async function loadLiveCatalogItems(): Promise<Item[]> {
  const supabase = createCatalogClient();
  const { data, error } = await supabase
    .from("items")
    .select("id, name, slug, image_url, category, description")
    .eq("active", true)
    .order("name");

  if (error) {
    throw new Error(`Unable to load the catalog: ${error.message}`);
  }

  return mergeWithCurated(data as CatalogRow[]);
}

async function loadLiveTierCatalog(): Promise<TierCatalog> {
  const supabase = createCatalogClient();
  const [catalogItems, tierListsResult] = await Promise.all([
    loadLiveCatalogItems(),
    supabase
      .from("tier_lists")
      .select("id, title, game_version")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false }),
  ]);

  if (tierListsResult.error) {
    throw new Error(`Unable to load tier lists: ${tierListsResult.error.message}`);
  }

  const tierLists = toTierLists(tierListsResult.data as TierListRow[]);

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

  return { catalogItems, publishedTierLists: tierLists, publishedTierRankings: toTierRankings(data as TierRankingRow[]) };
}

/** Live catalog, or the bundled snapshot when the database is unavailable. */
export async function getCatalogItems(): Promise<{ catalogItems: Item[]; source: CatalogSource }> {
  try {
    return { catalogItems: await loadLiveCatalogItems(), source: "live" };
  } catch (error) {
    console.error("Catalog database unavailable, using snapshot:", error);
    return { catalogItems: snapshotTierCatalog().catalogItems, source: "snapshot" };
  }
}

/** Live tier lists, or the bundled snapshot when the database is unavailable. */
export async function getTierListCatalog(): Promise<TierCatalog & { source: CatalogSource }> {
  try {
    return { ...(await loadLiveTierCatalog()), source: "live" };
  } catch (error) {
    console.error("Tier list database unavailable, using snapshot:", error);
    return { ...snapshotTierCatalog(), source: "snapshot" };
  }
}
