#!/usr/bin/env node
// Refresh src/lib/catalog-snapshot.json from the live Supabase catalog.
// The snapshot is the offline fallback shown when the database is unavailable,
// so refresh it after curator edits (icons, rankings) in Admin.
//
// Usage: node --env-file=.env.local scripts/export-catalog-snapshot.mjs
import { writeFileSync } from "node:fs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");

async function select(path) {
  const response = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status} ${await response.text()}`);
  return response.json();
}

const rows = await select("items?select=id,name,slug,image_url,category,description&active=eq.true&order=name,slug");
const lists = await select("tier_lists?select=id,title,game_version&published_at=not.is.null&order=published_at.desc");
const rankings = lists.length
  ? await select(`tier_rankings?select=item_id,tier_list_id,tier,score&tier_list_id=in.(${lists.map((l) => l.id).join(",")})`)
  : [];

// Use slugs and game versions as ids so the snapshot diffs cleanly between refreshes.
const slugById = new Map(rows.map((row) => [row.id, row.slug]));
const versionById = new Map(lists.map((list) => [list.id, list.game_version]));
const snapshot = {
  source: `Live Supabase catalog exported ${new Date().toISOString().slice(0, 10)}`,
  items: rows.map((row) => ({ ...row, id: row.slug })),
  tierLists: lists.map((list) => ({ id: list.game_version, title: list.title, game_version: list.game_version })),
  tierRankings: rankings
    .filter((ranking) => slugById.has(ranking.item_id))
    .map((ranking) => ({
      item_id: slugById.get(ranking.item_id),
      tier_list_id: versionById.get(ranking.tier_list_id),
      tier: ranking.tier,
      score: ranking.score,
    }))
    .sort((a, b) => `${a.tier_list_id}${a.item_id}`.localeCompare(`${b.tier_list_id}${b.item_id}`)),
};

writeFileSync(new URL("../src/lib/catalog-snapshot.json", import.meta.url), JSON.stringify(snapshot, null, 1) + "\n");
console.log(`${snapshot.items.length} items, ${snapshot.tierLists.length} tier lists, ${snapshot.tierRankings.length} rankings`);
