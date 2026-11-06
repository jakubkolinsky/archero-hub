"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Category, GameMode, Item, categories, gameModes } from "@/lib/catalog";

const tiers = ["SS", "S", "A", "B", "C", "D", "Unranked"] as const;
const tierStyle: Record<Item["tier"], string> = { SS: "border-amber-300/40 bg-amber-300/10 text-amber-200", S: "border-orange-400/40 bg-orange-400/10 text-orange-200", A: "border-sky-400/40 bg-sky-400/10 text-sky-200", B: "border-violet-400/40 bg-violet-400/10 text-violet-200", C: "border-slate-400/40 bg-slate-400/10 text-slate-200", D: "border-slate-600 bg-slate-800 text-slate-300", Unranked: "border-stone-600 bg-stone-800 text-stone-300" };

export function TierListExplorer({ catalogItems }: { catalogItems: Item[] }) {
  const [mode, setMode] = useState<GameMode>("Chapter Push");
  const [category, setCategory] = useState<Category | "All">("All");
  const visible = useMemo(() => catalogItems.filter((item) => (category === "All" || item.category === category) && (item.bestModes.includes(mode) || item.tier === "Unranked")).sort((a, b) => b.score - a.score), [catalogItems, category, mode]);

  return <main className="min-h-screen bg-[#090b11] px-5 py-10 text-[#f7f1e7] sm:px-8"><div className="mx-auto max-w-7xl">
    <Link href="/" className="text-sm font-bold text-amber-400">← ArcheroHub</Link>
    <header className="mt-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-amber-400">Tier list database</p><h1 className="mt-3 text-4xl font-black tracking-tight">Rankings that match the run.</h1><p className="mt-3 max-w-2xl leading-7 text-stone-400">Scores are 0–100 and rankings are scoped to a specific mode. Data is a curator-managed community draft.</p></header>
    <section className="mt-9 rounded-2xl border border-white/10 bg-[#161922] p-5"><p className="text-xs font-bold uppercase tracking-[.18em] text-stone-500">Game mode</p><div className="mt-3 flex flex-wrap gap-2">{gameModes.map((item) => <FilterButton active={mode === item} key={item} onClick={() => setMode(item)}>{item}</FilterButton>)}</div><p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-stone-500">Category</p><div className="mt-3 flex flex-wrap gap-2"><FilterButton active={category === "All"} onClick={() => setCategory("All")}>All</FilterButton>{categories.map((item) => <FilterButton active={category === item} key={item} onClick={() => setCategory(item)}>{item}</FilterButton>)}</div></section>
    <section className="mt-8 space-y-5">{tiers.map((tier) => { const ranked = visible.filter((item) => item.tier === tier); if (!ranked.length) return null; return <div key={tier} className="grid gap-4 sm:grid-cols-[74px_1fr]"><div className={`grid h-16 place-items-center rounded-2xl border text-xl font-black ${tierStyle[tier]}`}>{tier}</div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{ranked.map((item) => <ItemCard key={item.id} item={item} />)}</div></div>; })}{!visible.length && <p className="rounded-2xl border border-dashed border-white/15 p-8 text-stone-400">No ranked items match this mode and category yet.</p>}</section>
  </div></main>;
}

function FilterButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${active ? "bg-amber-400 text-stone-950" : "bg-white/[.06] text-stone-400 hover:bg-white/[.1] hover:text-white"}`}>{children}</button>;
}

function ItemCard({ item }: { item: Item }) {
  return <article className="rounded-2xl border border-white/10 bg-[#161922] p-4"><div className="flex items-start gap-3">{item.imageUrl ? <Image src={item.imageUrl} alt="" width={44} height={44} className="size-11 rounded-xl object-contain" /> : <span className={`grid size-11 place-items-center rounded-xl bg-gradient-to-br ${item.accent} text-lg font-black text-white`}>{item.name.charAt(0)}</span>}<div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><h2 className="truncate font-bold">{item.name}</h2><span className="font-black text-amber-300">{item.score}</span></div><p className="mt-1 text-xs text-stone-500">{item.category} · {item.meta}</p></div></div><p className="mt-4 text-sm leading-5 text-stone-400">{item.description}</p><div className="mt-4 border-t border-white/10 pt-3 text-xs"><p className="font-bold text-emerald-300">Strength: <span className="font-normal text-stone-400">{item.strengths}</span></p><p className="mt-1 font-bold text-rose-300">Weakness: <span className="font-normal text-stone-400">{item.weaknesses}</span></p></div></article>;
}
