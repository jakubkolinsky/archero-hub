import { createClient } from "@supabase/supabase-js";
import { Category, Item, items as curatedItems } from "@/lib/catalog";

type CatalogRow = {
  name: string;
  slug: string;
  image_url: string | null;
  category: string;
  description: string | null;
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

export async function getCatalogItems(): Promise<Item[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  const supabase = createClient(url, publishableKey);
  const { data, error } = await supabase
    .from("items")
    .select("name, slug, image_url, category, description")
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
