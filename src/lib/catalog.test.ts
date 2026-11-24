import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { builds, curatedItemAliases, items, slotDefinitions } from "./catalog.ts";

type SnapshotItem = { slug: string; name: string; category: string };
const snapshot = JSON.parse(readFileSync(new URL("./catalog-snapshot.json", import.meta.url), "utf8")) as { items: SnapshotItem[] };

// Mirrors catalog-database: a database row becomes the curated id (via alias) or its own slug.
const catalogIds = new Map<string, SnapshotItem>();
for (const row of snapshot.items) {
  const curatedId = curatedItemAliases[row.slug] ?? row.slug;
  const curated = items.find((item) => item.id === curatedId || item.name === row.name);
  catalogIds.set(curated?.id ?? row.slug, row);
}

test("every recommended build slot points at a real catalog item of the right category", () => {
  for (const build of builds) {
    for (const slot of slotDefinitions) {
      const itemId = build.slots[slot.id];
      const row = catalogIds.get(itemId);
      assert.ok(row, `${build.name} ${slot.label}: "${itemId}" is not in the catalog`);
      assert.equal(row.category, slot.category.toLowerCase(), `${build.name} ${slot.label}: "${itemId}" is a ${row.category}`);
    }
  }
});

test("curated draft items all exist in the real catalog", () => {
  const realIds = new Set(catalogIds.keys());
  const placeholders = items.filter((item) => !realIds.has(item.id)).map((item) => item.name);
  assert.deepEqual(placeholders, []);
});
