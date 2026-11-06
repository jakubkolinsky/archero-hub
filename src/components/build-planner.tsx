"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Build, GameMode, Item, builds, gameModes, slotDefinitions } from "@/lib/catalog";

const tierColor: Record<Item["tier"], string> = { SS: "bg-amber-300 text-stone-950", S: "bg-orange-500 text-white", A: "bg-sky-400 text-slate-950", B: "bg-violet-400 text-slate-950", C: "bg-slate-500 text-white", D: "bg-slate-700 text-white", Unranked: "bg-stone-700 text-stone-200" };

export function BuildPlanner({ catalogItems }: { catalogItems: Item[] }) {
  const [mode, setMode] = useState<GameMode>("Chapter Push");
  const [owned, setOwned] = useState<string[]>([]);
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = window.localStorage.getItem("archero-hub-owned-items");
      if (saved) setOwned(JSON.parse(saved) as string[]);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("archero-hub-owned-items", JSON.stringify(owned));
  }, [owned]);

  const recommendedBuild = useMemo<Build>(() => builds.find((build) => build.mode === mode) ?? builds[0], [mode]);
  const slots = { ...recommendedBuild.slots, ...overrides };
  const activeSlot = slotDefinitions.find((slot) => slot.id === selectedSlot);
  const choices = activeSlot
    ? catalogItems.filter((item) => item.category === activeSlot.category && (!ownedOnly || owned.includes(item.id))).sort((a, b) => b.score - a.score)
    : [];

  function changeMode(nextMode: GameMode) {
    setMode(nextMode);
    setOverrides({});
    setSelectedSlot(null);
  }

  function toggleOwned(id: string) {
    setOwned((current) => current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]);
  }

  return (
    <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
      <div className="mb-6 rounded-2xl border border-white/10 bg-[#161922] p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-amber-400">Game mode</p>
        <div className="flex flex-wrap gap-2">
          {gameModes.map((item) => <button key={item} onClick={() => changeMode(item)} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === item ? "bg-amber-400 text-stone-950" : "bg-white/[.06] text-stone-400 hover:bg-white/[.1] hover:text-white"}`}>{item}</button>)}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-3xl border border-white/10 bg-[#12151d] p-4 sm:p-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[.2em] text-amber-400">Recommended setup</p><h2 className="mt-2 text-2xl font-bold">{recommendedBuild.name}</h2></div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-300"><input checked={ownedOnly} onChange={(event) => setOwnedOnly(event.target.checked)} type="checkbox" className="size-4 accent-amber-400" /> Owned items only</label>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {slotDefinitions.map((slot) => {
              const item = catalogItems.find((catalogItem) => catalogItem.id === slots[slot.id]);
              const unavailable = ownedOnly && item && !owned.includes(item.id);
              return <button key={slot.id} onClick={() => setSelectedSlot(slot.id)} className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${unavailable ? "border-rose-400/50 bg-rose-400/[.06]" : "border-white/10 bg-white/[.035] hover:border-amber-400/50"}`}>
                <span className="text-[10px] font-bold uppercase tracking-[.16em] text-stone-500">{slot.label}</span>
                {item ? <><ItemIcon item={item} size={44} /><span className="mt-3 block truncate text-sm font-bold">{item.name}</span><span className="mt-1 block text-xs text-stone-500">{item.tier} · {item.score} score</span></> : <span className="mt-6 block text-sm text-stone-500">Choose item</span>}
              </button>;
            })}
          </div>
        </div>

        <aside className="rounded-3xl border border-white/10 bg-[#161922] p-6">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-400">Build brief</p>
          <h2 className="mt-3 text-2xl font-bold">{recommendedBuild.name}</h2>
          <p className="mt-4 text-sm leading-6 text-stone-400">{recommendedBuild.description}</p>
          <div className="mt-7 space-y-5 text-sm"><div><p className="font-bold text-emerald-300">Strengths</p><p className="mt-1 leading-6 text-stone-400">{recommendedBuild.strengths}</p></div><div><p className="font-bold text-rose-300">Weaknesses</p><p className="mt-1 leading-6 text-stone-400">{recommendedBuild.weaknesses}</p></div></div>
          <p className="mt-8 border-t border-white/10 pt-5 text-xs leading-5 text-stone-500">Click any slot to compare alternatives. Ownership is stored only in this browser until accounts are added.</p>
        </aside>
      </div>

      {activeSlot && <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="item-picker-title">
        <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-[#161922] p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-amber-400">{activeSlot.category}</p><h2 id="item-picker-title" className="mt-2 text-2xl font-bold">Choose {activeSlot.label}</h2></div><button onClick={() => setSelectedSlot(null)} className="rounded-lg px-3 py-2 text-stone-400 hover:bg-white/10 hover:text-white" aria-label="Close item picker">Close</button></div>
          {choices.length ? <div className="mt-6 grid gap-3 sm:grid-cols-2">{choices.map((item) => <ItemChoice key={item.id} item={item} owned={owned.includes(item.id)} onChoose={() => { setOverrides((current) => ({ ...current, [activeSlot.id]: item.id })); setSelectedSlot(null); }} onToggleOwned={() => toggleOwned(item.id)} />)}</div> : <p className="mt-8 rounded-xl border border-dashed border-white/15 p-6 text-sm text-stone-400">No owned {activeSlot.category.toLowerCase()} items yet. Turn off “Owned items only” or mark an item as owned.</p>}
        </div>
      </div>}
    </section>
  );
}

function ItemChoice({ item, owned, onChoose, onToggleOwned }: { item: Item; owned: boolean; onChoose: () => void; onToggleOwned: () => void }) {
  return <article className="rounded-2xl border border-white/10 bg-black/15 p-4"><div className="flex gap-3"><ItemIcon item={item} size={48} /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className="truncate font-bold">{item.name}</h3><span className={`rounded px-1.5 py-0.5 text-xs font-black ${tierColor[item.tier]}`}>{item.tier}</span></div><p className="mt-1 text-xs text-stone-500">{item.score}/100 · {item.meta}</p></div></div><p className="mt-3 text-sm leading-5 text-stone-400">{item.description}</p><div className="mt-4 flex items-center justify-between gap-3"><button onClick={onToggleOwned} className={`text-xs font-bold ${owned ? "text-emerald-300" : "text-stone-500 hover:text-stone-300"}`}>{owned ? "Owned" : "Mark owned"}</button><button onClick={onChoose} className="rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-stone-950 hover:bg-amber-300">Use in build</button></div></article>;
}

function ItemIcon({ item, size }: { item: Item; size: number }) {
  if (item.imageUrl) {
    return <Image src={item.imageUrl} alt="" width={size} height={size} className="mt-3 size-11 shrink-0 rounded-xl object-contain" />;
  }

  return <span className={`mt-3 grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${item.accent} text-lg font-black text-white`}>{item.name.charAt(0)}</span>;
}
