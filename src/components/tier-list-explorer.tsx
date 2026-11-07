"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Category, Item } from "@/lib/catalog";
import { PublishedTierList, PublishedTierRanking } from "@/lib/catalog-database";

const boardCategories: { label: string; category: Category }[] = [
  { label: "Weapons", category: "Weapon" },
  { label: "Heroes", category: "Hero" },
  { label: "Pets", category: "Pet" },
  { label: "Dragons", category: "Dragon" },
  { label: "Armor", category: "Armor" },
  { label: "Rings", category: "Ring" },
];

const tiers: Item["tier"][] = ["SS", "S", "A", "B", "C", "D", "Unranked"];
const tierColors: Record<Item["tier"], string> = {
  SS: "bg-[#f23843]",
  S: "bg-[#ff7d76]",
  A: "bg-[#ffbe63]",
  B: "bg-[#e6df64]",
  C: "bg-[#8dda93]",
  D: "bg-[#6fc0e7]",
  Unranked: "bg-stone-600",
};

export function TierListExplorer({
  catalogItems,
  publishedTierLists,
  publishedTierRankings,
}: {
  catalogItems: Item[];
  publishedTierLists: PublishedTierList[];
  publishedTierRankings: PublishedTierRanking[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<Category | "All">("All");
  const [selectedTierListId, setSelectedTierListId] = useState("current");
  const rankedItems = useMemo(() => {
    if (selectedTierListId === "current") {
      return catalogItems;
    }

    const rankings = new Map(
      publishedTierRankings
        .filter((ranking) => ranking.tierListId === selectedTierListId)
        .map((ranking) => [ranking.itemId, ranking]),
    );

    return catalogItems.map((item) => {
      const ranking = item.databaseId ? rankings.get(item.databaseId) : undefined;

      return ranking
        ? { ...item, tier: ranking.tier, score: ranking.score }
        : { ...item, tier: "Unranked" as const, score: 0 };
    });
  }, [catalogItems, publishedTierRankings, selectedTierListId]);
  const boards = useMemo(() => boardCategories.filter(({ category }) => selectedCategory === "All" || selectedCategory === category).map((definition) => ({ ...definition, items: rankedItems.filter((item) => item.category === definition.category) })), [rankedItems, selectedCategory]);

  return <main className="min-h-screen bg-[#2b2b2b] text-[#f4f3ef]">
    <header className="border-b border-white/10 bg-[linear-gradient(110deg,rgba(8,8,8,.78),rgba(8,8,8,.3)),radial-gradient(circle_at_78%_10%,rgba(53,147,143,.55),transparent_35%)]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8"><Link href="/" className="text-sm font-black uppercase tracking-[.15em] text-white">Archero<span className="text-[#ff3e47]">Hub</span></Link><Link href="/" className="text-xs font-bold uppercase tracking-wide text-stone-300 hover:text-white">Loadout</Link></nav>
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-5 text-center sm:px-8"><p className="text-xs font-bold uppercase tracking-[.35em] text-stone-300">Community meta</p><h1 className="mt-2 text-4xl font-black uppercase tracking-tight text-[#ff3e47] sm:text-6xl">Tier List</h1></div>
    </header>

    <section className="mx-auto max-w-7xl px-4 py-5 sm:px-8">
      <div className="flex flex-col items-center gap-4 border-b border-white/15 pb-4">
        <label className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-stone-300">Ranking version
          <select value={selectedTierListId} onChange={(event) => setSelectedTierListId(event.target.value)} className="rounded-md border border-white/15 bg-[#151515] px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#ff3e47]">
            <option value="current">Current community draft</option>
            {publishedTierLists.map((tierList) => <option key={tierList.id} value={tierList.id}>{tierList.gameVersion} historical · {tierList.title}</option>)}
          </select>
        </label>
        <div className="flex flex-wrap justify-center gap-1">{[{ label: "All categories", category: "All" as const }, ...boardCategories].map((entry) => <button key={entry.category} onClick={() => setSelectedCategory(entry.category)} className={`rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wide transition ${selectedCategory === entry.category ? "bg-[#ff3e47] text-white" : "text-stone-300 hover:bg-white/10 hover:text-white"}`}>{entry.label}</button>)}</div>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] font-bold uppercase tracking-wide text-stone-400"><Legend color="bg-[#f23843]" label="SS" /><Legend color="bg-[#ff7d76]" label="S" /><Legend color="bg-[#ffbe63]" label="A" /><Legend color="bg-[#e6df64]" label="B" /><Legend color="bg-[#8dda93]" label="C" /><Legend color="bg-[#6fc0e7]" label="D" /><Legend color="bg-stone-600" label="Unranked" /></div>

      <div className="mt-7 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {boards.map((board) => <TierBoard key={board.category} title={board.label} items={board.items} />)}
      </div>
    </section>
  </main>;
}

function TierBoard({ title, items }: { title: string; items: Item[] }) {
  return <section><h2 className="mb-2 text-center text-lg font-black uppercase tracking-wide text-white">{title}</h2><div className="border border-white/10 bg-[#151515]">{tiers.map((tier) => <TierRow key={tier} tier={tier} items={items.filter((item) => item.tier === tier).sort((a, b) => b.score - a.score)} />)}</div></section>;
}

function TierRow({ tier, items }: { tier: Item["tier"]; items: Item[] }) {
  const label = tier === "Unranked" ? "?" : tier;
  return <div className="grid min-h-20 grid-cols-[48px_1fr] border-b border-white/10 last:border-b-0"><div className={`grid place-items-center text-xl font-black text-[#161616] ${tierColors[tier]}`}>{label}</div><div className="flex flex-wrap content-center gap-2 p-2">{items.map((item) => <TierItem key={item.id} item={item} />)}{!items.length && <span className="px-1 text-[10px] text-stone-700">No entries</span>}</div></div>;
}

function TierItem({ item }: { item: Item }) {
  return <article className="group relative w-14 text-center"><div className={`grid size-12 place-items-center border-2 ${tierColors[item.tier]} border-transparent bg-[#272727] p-1 shadow-lg`}>{item.imageUrl ? <Image src={item.imageUrl} alt={item.name} width={40} height={40} className="size-10 object-contain" /> : <span className="text-sm font-black text-white">{item.name.charAt(0)}</span>}</div><p className="mt-1 truncate text-[8px] font-semibold text-stone-300">{item.name}</p><div className="pointer-events-none absolute bottom-[calc(100%+8px)] left-0 z-10 hidden w-56 border border-white/15 bg-[#111] p-3 text-left shadow-2xl group-hover:block"><p className="text-xs font-black text-white">{item.name}</p><p className="mt-1 text-[10px] font-bold uppercase text-[#ff555e]">{item.tier} · {item.score}/100</p><p className="mt-2 text-xs leading-5 text-stone-400">{item.description}</p><p className="mt-2 border-t border-white/10 pt-2 text-[10px] text-stone-500">Attack / HP: pending verification</p></div></article>;
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${color}`} />{label}</span>;
}
