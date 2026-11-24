"use client";

import { useEffect, useMemo, useState } from "react";
import {
  attackStages,
  calculateUserBuild,
  emptyCalculatorState,
  hpStages,
  newRow,
  referenceRows,
  type CalculatorRow,
  type CalculatorState,
  type EquippedSlot,
  type StatKind,
} from "@/lib/calculator/user-build";

const STORAGE_KEY = "archero-hub-calculator-v1";

const format = (value: number) => value.toLocaleString("en-US");

export function StatCalculator({ equipped }: { equipped: EquippedSlot[] }) {
  const [state, setState] = useState<CalculatorState>(emptyCalculatorState);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<StatKind>("attack");
  const [undo, setUndo] = useState<{ label: string; state: CalculatorState } | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) setState({ ...emptyCalculatorState, ...(JSON.parse(saved) as CalculatorState) });
      } catch {
        // Ignore unreadable saved state; the calculator starts empty.
      }
      setLoaded(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, loaded]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const result = useMemo(() => calculateUserBuild(state, equipped), [state, equipped]);
  const hasEntries = result.entered > 0;

  function replaceState(next: CalculatorState, undoLabel: string) {
    setUndo({ label: undoLabel, state });
    setState(next);
  }

  function setSlotStat(slot: EquippedSlot, stat: StatKind, value: string) {
    setState((current) => {
      const previous = current.slotStats[slot.slotId];
      const base = previous && previous.itemId === slot.itemId ? previous : { itemId: slot.itemId, attack: "", hp: "" };
      return { ...current, slotStats: { ...current.slotStats, [slot.slotId]: { ...base, [stat]: value } } };
    });
  }

  function updateRow(id: string, patch: Partial<CalculatorRow>) {
    setState((current) => ({ ...current, rows: current.rows.map((row) => (row.id === id ? { ...row, ...patch } : row)) }));
  }

  function addRow() {
    setState((current) => ({ ...current, rows: [...current.rows, newRow(tab, crypto.randomUUID())] }));
  }

  function removeRow(id: string) {
    setState((current) => ({ ...current, rows: current.rows.filter((row) => row.id !== id) }));
  }

  const stages = tab === "attack" ? attackStages : hpStages;
  const rows = state.rows.filter((row) => row.stat === tab);

  return <>
    <div className="border border-white/10 bg-black/30 px-4 py-3">
      <div className="grid grid-cols-2 gap-3">
        <StatTotal label="Attack" value={hasEntries ? format(result.attack.attack) : "—"} />
        <StatTotal label="HP" value={hasEntries ? format(result.hp.maxHp) : "—"} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
        <p className="text-[11px] leading-4 text-stone-400">{hasEntries ? "From your numbers" : "Enter your stats to calculate"}</p>
        <button onClick={() => setOpen(true)} className="shrink-0 bg-[#ff3e47] px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white hover:bg-[#ff555e]">
          {hasEntries ? "Breakdown" : "Calculator"}
        </button>
      </div>
    </div>

    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-3 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true" aria-labelledby="calculator-title" onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto border border-white/15 bg-[#202020] shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-white/10 bg-[#202020] p-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#ff555e]">Calculator</p>
              <h2 id="calculator-title" className="mt-1 text-2xl font-black uppercase text-white">Attack &amp; HP</h2>
              <p className="mt-1 max-w-xl text-xs leading-5 text-stone-400">Uses the verified game formula with the numbers you enter from the game. Nothing here is verified item data. Saved in this browser.</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-md border border-white/15 px-3 py-2 text-xs font-bold uppercase text-stone-300 hover:border-white/40 hover:text-white">Close</button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(["attack", "hp"] as const).map((kind) => <button key={kind} onClick={() => setTab(kind)} className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${tab === kind ? "bg-[#ff3e47] text-white" : "text-stone-300 hover:bg-white/10"}`}>
              {kind === "attack" ? `Attack · ${format(result.attack.attack)}` : `HP · ${format(result.hp.maxHp)}`}
            </button>)}
            <span className="ml-auto flex flex-wrap gap-2">
              <button onClick={() => replaceState({ ...state, rows: [...state.rows.filter((row) => row.stat !== "attack"), ...referenceRows()] }, "Example loaded")} className="border border-white/15 px-3 py-1.5 text-[11px] font-bold uppercase text-stone-300 hover:border-white/40 hover:text-white">Load example (Atreus)</button>
              <button onClick={() => replaceState(emptyCalculatorState, "Cleared")} disabled={!hasEntries && !state.rows.length} className="border border-white/15 px-3 py-1.5 text-[11px] font-bold uppercase text-stone-300 hover:border-white/40 hover:text-white disabled:opacity-40">Clear all</button>
            </span>
          </div>
          {undo && <p className="mt-3 text-xs text-stone-300">{undo.label}. <button onClick={() => { setState(undo.state); setUndo(null); }} className="font-bold text-[#ffbe63] underline underline-offset-2">Undo</button></p>}
        </div>

        <div className="grid gap-6 p-5 sm:px-7 lg:grid-cols-[1fr_280px]">
          <div className="min-w-0 space-y-6">
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-[.16em] text-stone-300">Equipped items <span className="font-normal normal-case tracking-normal text-stone-500">· flat {tab === "attack" ? "Attack" : "HP"} shown in game</span></h3>
              <div className="mt-2 divide-y divide-white/5 border border-white/10">
                {equipped.map((slot) => {
                  const stats = state.slotStats[slot.slotId];
                  const value = stats && stats.itemId === slot.itemId ? stats[tab] : "";
                  return <label key={slot.slotId} className="grid grid-cols-[1fr_120px] items-center gap-3 px-3 py-2">
                    <span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-wide text-stone-500">{slot.slotLabel}</span><span className="block truncate text-sm font-semibold text-white">{slot.itemName}</span></span>
                    <input inputMode="decimal" value={value} onChange={(event) => setSlotStat(slot, tab, event.target.value)} placeholder="0" aria-label={`${slot.itemName} ${tab === "attack" ? "Attack" : "HP"}`} className="w-full border border-white/15 bg-black/40 px-2 py-1.5 text-right text-sm text-white placeholder:text-stone-600 focus:border-[#ff555e] focus:outline-none" />
                  </label>;
                })}
              </div>
            </section>

            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-[.16em] text-stone-300">Other sources</h3>
              <div className="mt-2 space-y-2">
                {rows.map((row) => <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 border border-white/10 p-2 sm:grid-cols-[minmax(0,1fr)_150px_110px_auto]">
                  <input value={row.label} onChange={(event) => updateRow(row.id, { label: event.target.value })} placeholder="e.g. Relic, gem, sigil" aria-label="Source name" className="col-span-3 min-w-0 border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-white placeholder:text-stone-600 focus:border-[#ff555e] focus:outline-none sm:col-span-1" />
                  <select value={row.stage} onChange={(event) => updateRow(row.id, { stage: event.target.value as CalculatorRow["stage"] })} aria-label="Formula step" className="min-w-0 border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-white focus:border-[#ff555e] focus:outline-none">
                    {stages.map((option) => <option key={option.stage} value={option.stage}>{option.label}</option>)}
                  </select>
                  <input inputMode="decimal" value={row.value} onChange={(event) => updateRow(row.id, { value: event.target.value })} placeholder="0" aria-label="Value" className="min-w-0 border border-white/15 bg-black/40 px-2 py-1.5 text-right text-sm text-white placeholder:text-stone-600 focus:border-[#ff555e] focus:outline-none" />
                  <button onClick={() => removeRow(row.id)} aria-label={`Remove ${row.label || "line"}`} className="px-2 py-1.5 text-xs font-bold text-stone-400 hover:text-[#ff555e]">✕</button>
                </div>)}
                <button onClick={addRow} className="w-full border border-dashed border-white/20 py-2 text-xs font-bold uppercase tracking-wide text-stone-300 hover:border-[#ff555e] hover:text-white">+ Add line</button>
              </div>
              <ul className="mt-3 grid gap-1 text-[11px] leading-4 text-stone-400 sm:grid-cols-2">
                {stages.map((option) => <li key={option.stage}><span className="font-bold text-stone-300">{option.label}:</span> {option.hint}</li>)}
              </ul>
            </section>
          </div>

          <aside className="h-fit border border-white/10 bg-black/30 p-4 lg:sticky lg:top-40">
            <h3 className="text-[11px] font-bold uppercase tracking-[.16em] text-[#ff555e]">How it adds up</h3>
            {tab === "attack" ? <dl className="mt-3 space-y-2 text-xs">
              <Step label="Flat Attack" value={format(result.attack.count)} />
              {result.attack.weapon !== 0 && <Step label="+ Weapon" value={format(result.attack.weapon)} />}
              <Step label="× (1 + Attack %)" value={`${result.attack.percent}%`} />
              <Step label="= Base" value={format(result.attack.base)} strong />
              <Step label="+ Outside flat" value={format(result.attack.outsideFlat)} />
              {result.attack.outsidePercent !== 0 && <Step label="× (1 + Outside %)" value={`${result.attack.outsidePercent}%`} />}
              <Step label="= AV" value={format(result.attack.attackValue)} strong />
              <Step label="× (1 + Multiplier)" value={`${result.attack.multiplier}%`} />
              <Step label="= Attack" value={format(result.attack.attack)} big />
            </dl> : <dl className="mt-3 space-y-2 text-xs">
              <Step label="Flat HP" value={format(result.hp.count)} />
              <Step label="× (1 + HP %)" value={`${result.hp.percent}%`} />
              <Step label="= Max HP" value={format(result.hp.maxHp)} big />
            </dl>}
            <p className="mt-4 border-t border-white/10 pt-3 text-[11px] leading-4 text-stone-400">Each step drops decimals, like the game. {tab === "hp" && "The HP formula is not yet checked against a full in-game build."}</p>
            {result.invalid.length > 0 && <p role="alert" className="mt-3 text-[11px] leading-4 text-[#ff7d76]">Not a number, left out: {result.invalid.join(", ")}</p>}
          </aside>
        </div>
      </div>
    </div>}
  </>;
}

function StatTotal({ label, value }: { label: string; value: string }) {
  return <span><span className="block text-[10px] font-bold uppercase tracking-wide text-stone-400">{label}</span><span className="mt-1 block text-lg font-black text-white">{value}</span></span>;
}

function Step({ label, value, strong = false, big = false }: { label: string; value: string; strong?: boolean; big?: boolean }) {
  return <div className={`flex items-baseline justify-between gap-3 ${strong ? "border-t border-white/10 pt-2" : ""}`}>
    <dt className={strong || big ? "font-bold text-stone-200" : "text-stone-400"}>{label}</dt>
    <dd className={`tabular-nums ${big ? "text-xl font-black text-white" : strong ? "font-bold text-white" : "text-stone-200"}`}>{value}</dd>
  </div>;
}
