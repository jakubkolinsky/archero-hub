"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Build, GameMode, Item, builds, gameModes, slotDefinitions } from "@/lib/catalog";

const tierColors: Record<Item["tier"], string> = {
  SS: "bg-[#ff555e] text-[#1f1718]",
  S: "bg-[#ff7d76] text-[#1f1718]",
  A: "bg-[#ffbe63] text-[#1f1718]",
  B: "bg-[#e6df64] text-[#1f1718]",
  C: "bg-[#8dda93] text-[#172118]",
  D: "bg-[#6fc0e7] text-[#132129]",
  Unranked: "bg-stone-600 text-white",
};

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
  const equippedItems = slotDefinitions.map((slot) => catalogItems.find((item) => item.id === slots[slot.id])).filter((item): item is Item => Boolean(item));
  const averageScore = equippedItems.length ? Math.round(equippedItems.reduce((total, item) => total + item.score, 0) / equippedItems.length) : 0;

  function changeMode(nextMode: GameMode) {
    setMode(nextMode);
    setOverrides({});
    setSelectedSlot(null);
  }

  function toggleOwned(id: string) {
    setOwned((current) => current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]);
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-y border-white/10 py-3">
        <div className="flex flex-wrap gap-2">
          {gameModes.map((item) => <button key={item} onClick={() => changeMode(item)} className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${mode === item ? "bg-[#ff3e47] text-white" : "text-stone-400 hover:bg-white/10 hover:text-white"}`}>{item}</button>)}
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-stone-400"><input checked={ownedOnly} onChange={(event) => setOwnedOnly(event.target.checked)} type="checkbox" className="size-3.5 accent-[#ff3e47]" /> Owned only</label>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_290px]">
        <section className="border border-white/10 bg-[#242424] p-4 shadow-2xl shadow-black/20 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
            <div><p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#ff555e]">Recommended loadout</p><h1 className="mt-1 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">{recommendedBuild.name}</h1><p className="mt-2 max-w-xl text-sm text-stone-400">{recommendedBuild.description}</p></div>
            <div className="border-l-2 border-[#ff3e47] pl-4 text-right"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-stone-500">Build score</p><p className="mt-1 text-3xl font-black text-white">{averageScore}<span className="text-sm text-stone-500">/100</span></p></div>
          </div>

          <div className="relative mt-6 overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_50%_42%,rgba(255,154,70,.2),transparent_27%),radial-gradient(circle_at_50%_62%,rgba(77,202,183,.2),transparent_36%),#141414] p-3 sm:p-5">
            <div className="pointer-events-none absolute inset-x-1/4 top-[18%] aspect-square rounded-full border border-[#ffd261]/20 bg-[#ffd261]/5 blur-3xl" />
            <div className="relative grid gap-3 sm:grid-cols-[minmax(132px,1fr)_minmax(220px,1.45fr)_minmax(132px,1fr)]">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
                <ArenaSlot slotId="weapon" />
                <ArenaSlot slotId="dragon" />
                <ArenaSlot slotId="pet-one" />
                <ArenaSlot slotId="bracelet" />
              </div>

              <div className="flex min-h-[420px] flex-col justify-center border-x border-white/10 px-3 py-5 sm:min-h-[590px] sm:px-7">
                <p className="text-center text-[10px] font-bold uppercase tracking-[.24em] text-[#ffbe63]">Hero center</p>
                <LoadoutSlot slot={slotDefinitions[0]} item={catalogItems.find((catalogItem) => catalogItem.id === slots.hero)} unavailable={ownedOnly && !owned.includes(slots.hero)} onClick={() => setSelectedSlot("hero")} large />
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <ArenaSlot slotId="book" />
                  <ArenaSlot slotId="ring-two" />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-xs"><Stat label="Attack" value="Pending" /><Stat label="HP" value="Pending" /></div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
                <ArenaSlot slotId="armor" />
                <ArenaSlot slotId="ring-one" />
                <ArenaSlot slotId="pet-two" />
                <ArenaSlot slotId="locket" />
              </div>
            </div>
          </div>
        </section>

        <aside className="border border-white/10 bg-[#202020] p-5">
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#ff555e]">Build brief</p>
          <h2 className="mt-2 text-xl font-black uppercase text-white">{mode}</h2>
          <div className="mt-6 space-y-5 text-sm"><div><p className="font-bold text-[#8dda93]">Strengths</p><p className="mt-1 leading-6 text-stone-400">{recommendedBuild.strengths}</p></div><div><p className="font-bold text-[#ff7d76]">Watch out</p><p className="mt-1 leading-6 text-stone-400">{recommendedBuild.weaknesses}</p></div></div>
          <div className="mt-7 border-y border-white/10 py-4"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-stone-500">Inventory</p><p className="mt-1 text-sm font-bold text-white">{owned.length} items marked owned</p><p className="mt-1 text-xs leading-5 text-stone-500">Choose any slot to browse items. Your inventory stays in this browser.</p></div>
          <p className="mt-5 text-xs leading-5 text-stone-500">Hover an item for its current tier, score, and verified notes. Attack and HP calculations will unlock as the stat catalog is reviewed.</p>
        </aside>
      </div>

      {activeSlot && <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="item-picker-title">
        <div className="max-h-[88vh] w-full max-w-5xl overflow-y-auto border border-white/15 bg-[#202020] p-5 shadow-2xl sm:p-7">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#ff555e]">Inventory</p><h2 id="item-picker-title" className="mt-1 text-2xl font-black uppercase text-white">Choose {activeSlot.label}</h2></div><button onClick={() => setSelectedSlot(null)} className="rounded-md border border-white/15 px-3 py-2 text-xs font-bold uppercase text-stone-400 hover:border-white/40 hover:text-white">Close</button></div>
          {choices.length ? <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{choices.map((item) => <InventoryItem key={item.id} item={item} owned={owned.includes(item.id)} onChoose={() => { setOverrides((current) => ({ ...current, [activeSlot.id]: item.id })); setSelectedSlot(null); }} onToggleOwned={() => toggleOwned(item.id)} />)}</div> : <p className="mt-8 border border-dashed border-white/15 p-6 text-sm text-stone-400">No owned {activeSlot.category.toLowerCase()} items. Disable “Owned only” or mark items as owned.</p>}
        </div>
      </div>}
    </section>
  );

  function ArenaSlot({ slotId }: { slotId: string }) {
    const slot = slotDefinitions.find((definition) => definition.id === slotId);
    if (!slot) return null;

    const item = catalogItems.find((catalogItem) => catalogItem.id === slots[slot.id]);
    return <LoadoutSlot slot={slot} item={item} unavailable={item ? ownedOnly && !owned.includes(item.id) : false} onClick={() => setSelectedSlot(slot.id)} />;
  }
}

function LoadoutSlot({ slot, item, unavailable, onClick, large = false }: { slot: typeof slotDefinitions[number]; item: Item | undefined; unavailable: boolean; onClick: () => void; large?: boolean }) {
  return <button onClick={onClick} className={`group relative mt-3 w-full border p-3 text-left transition hover:-translate-y-0.5 hover:border-[#ff555e] ${large ? "min-h-44" : "min-h-28"} ${unavailable ? "border-[#ff555e]/60 bg-[#ff555e]/5" : "border-white/10 bg-[#111]"}`}>
    <span className="text-[9px] font-bold uppercase tracking-[.16em] text-stone-500">{slot.label}</span>
    {item ? <div className={`mt-3 flex ${large ? "items-center gap-4" : "gap-2"} `}><ItemArt item={item} size={large ? 72 : 42} /><span className="min-w-0"><span className={`${large ? "text-lg" : "text-xs"} block truncate font-bold text-white`}>{item.name}</span><span className="mt-1 block text-[10px] text-stone-500">{item.tier} · {item.score} score</span></span></div> : <span className="mt-8 block text-xs text-stone-500">Choose item</span>}
    {item && <ItemTooltip item={item} />}
  </button>;
}

function InventoryItem({ item, owned, onChoose, onToggleOwned }: { item: Item; owned: boolean; onChoose: () => void; onToggleOwned: () => void }) {
  return <article className="group relative border border-white/10 bg-[#151515] p-4 transition hover:border-[#ff555e]"><div className="flex gap-3"><ItemArt item={item} size={52} /><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><h3 className="truncate font-bold text-white">{item.name}</h3><span className={`grid size-6 place-items-center text-[10px] font-black ${tierColors[item.tier]}`}>{item.tier === "Unranked" ? "?" : item.tier}</span></div><p className="mt-1 text-xs text-stone-500">{item.score}/100 · {item.meta}</p></div></div><p className="mt-4 text-sm leading-5 text-stone-400">{item.description}</p><div className="mt-4 flex justify-between border-t border-white/10 pt-3"><button onClick={onToggleOwned} className={`text-xs font-bold ${owned ? "text-[#8dda93]" : "text-stone-500 hover:text-white"}`}>{owned ? "Owned" : "Mark owned"}</button><button onClick={onChoose} className="bg-[#ff3e47] px-3 py-1.5 text-xs font-black uppercase text-white hover:bg-[#ff555e]">Equip</button></div><ItemTooltip item={item} />
  </article>;
}

function ItemArt({ item, size }: { item: Item; size: number }) {
  if (item.imageUrl) return <Image src={item.imageUrl} alt="" width={size} height={size} className="shrink-0 object-contain" />;
  return <span style={{ width: size, height: size }} className={`grid shrink-0 place-items-center bg-gradient-to-br ${item.accent} text-lg font-black text-white`}>{item.name.charAt(0)}</span>;
}

function ItemTooltip({ item }: { item: Item }) {
  return <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-0 z-20 hidden w-64 border border-white/15 bg-[#0e0e0e] p-3 text-left shadow-2xl group-hover:block group-focus-within:block"><span className="block text-xs font-black uppercase text-white">{item.name}</span><span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-[#ff555e]">{item.tier} tier · {item.score}/100</span><span className="mt-2 block text-xs leading-5 text-stone-400">{item.description}</span><span className="mt-2 block border-t border-white/10 pt-2 text-[10px] text-stone-500">Attack / HP: pending in-game verification</span></span>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <span><span className="block text-[10px] font-bold uppercase tracking-wide text-stone-500">{label}</span><span className="mt-1 block font-black text-stone-300">{value}</span></span>;
}
