"use client";

import { useEffect, useMemo, useState } from "react";
import {
  attackStages,
  calculateUserBuild,
  emptyCalculatorState,
  hpStages,
  newRow,
  normalizeCalculatorState,
  referenceRows,
  type CalculatorRow,
  type CalculatorState,
  type EquippedSlot,
  type StatKind,
} from "@/lib/calculator/user-build";
import type { GuidedState } from "@/lib/calculator/guided";
import { CalculatorQuestions, formatBonus, questionSteps } from "@/components/calculator-questions";

const STORAGE_KEY = "archero-hub-calculator-v1";

const format = (value: number) => value.toLocaleString("en-US");

export function StatCalculator({ equipped, heroName }: { equipped: EquippedSlot[]; heroName: string | null }) {
  const [state, setState] = useState<CalculatorState>(emptyCalculatorState);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<StatKind>("attack");
  const [mode, setMode] = useState<"questions" | "manual">("questions");
  const [stepIndex, setStepIndex] = useState(0);
  const [undo, setUndo] = useState<{ label: string; state: CalculatorState } | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) setState(normalizeCalculatorState(JSON.parse(saved) as Partial<CalculatorState>));
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

  const result = useMemo(() => calculateUserBuild(state, equipped, heroName), [state, equipped, heroName]);
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

  function slotValue(slot: EquippedSlot, stat: StatKind) {
    const stats = state.slotStats[slot.slotId];
    return stats && stats.itemId === slot.itemId ? stats[stat] : "";
  }

  function updateGuided(update: (current: GuidedState) => GuidedState) {
    setState((current) => ({ ...current, guided: update(current.guided) }));
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
        <p className="text-[11px] leading-4 text-stone-400">{hasEntries ? "From your answers" : "Answer a few questions to calculate"}</p>
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
              <p className="mt-1 hidden max-w-xl text-xs leading-5 text-stone-400 sm:block">Answer a few questions about your account; outfit, skin and hero bonuses are looked up for you. Uses the verified game formula. Game data is imported and not yet fully checked. Saved in this browser.</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-md border border-white/15 px-3 py-2 text-xs font-bold uppercase text-stone-300 hover:border-white/40 hover:text-white">Close</button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-2 flex border border-white/15">
              {(["questions", "manual"] as const).map((option) => <button key={option} onClick={() => setMode(option)} aria-pressed={mode === option} className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide ${mode === option ? "bg-white text-black" : "text-stone-300 hover:bg-white/10"}`}>{option === "questions" ? "Questions" : "Manual"}</button>)}
            </span>
            {mode === "manual" && (["attack", "hp"] as const).map((kind) => <button key={kind} onClick={() => setTab(kind)} className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${tab === kind ? "bg-[#ff3e47] text-white" : "text-stone-300 hover:bg-white/10"}`}>
              {kind === "attack" ? `Attack · ${format(result.attack.attack)}` : `HP · ${format(result.hp.maxHp)}`}
            </button>)}
            <span className="ml-auto flex flex-wrap gap-2">
              {mode === "manual" && <button onClick={() => replaceState({ ...state, rows: [...state.rows.filter((row) => row.stat !== "attack"), ...referenceRows()] }, "Example loaded")} className="border border-white/15 px-3 py-1.5 text-[11px] font-bold uppercase text-stone-300 hover:border-white/40 hover:text-white">Load example (Atreus)</button>}
              <button onClick={() => replaceState(emptyCalculatorState, "Cleared")} disabled={!hasEntries && !state.rows.length} className="border border-white/15 px-3 py-1.5 text-[11px] font-bold uppercase text-stone-300 hover:border-white/40 hover:text-white disabled:opacity-40">Clear all</button>
            </span>
          </div>
          {mode === "questions" && <ol className="mt-4 flex gap-1 overflow-x-auto [scrollbar-width:none]">
            {questionSteps.map((step, index) => <li key={step.id} className="shrink-0"><button onClick={() => setStepIndex(index)} aria-current={index === stepIndex ? "step" : undefined} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide ${index === stepIndex ? "bg-[#ff3e47] text-white" : "text-stone-400 hover:bg-white/10 hover:text-white"}`}><span className="tabular-nums opacity-70">{index + 1}</span>{step.title}</button></li>)}
          </ol>}
          {undo && <p className="mt-3 text-xs text-stone-300">{undo.label}. <button onClick={() => { setState(undo.state); setUndo(null); }} className="font-bold text-[#ffbe63] underline underline-offset-2">Undo</button></p>}
        </div>

        <div className="grid gap-6 p-5 sm:px-7 lg:grid-cols-[1fr_280px]">
          {mode === "questions" ? <div className="min-w-0">
            <h3 className="text-lg font-black text-white">{questionSteps[stepIndex].question}</h3>
            <div className="mt-3">
              <CalculatorQuestions step={questionSteps[stepIndex].id} guided={state.guided} onGuided={updateGuided} equipped={equipped} heroName={heroName} slotValue={slotValue} onSlot={setSlotStat} />
            </div>
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <button onClick={() => setStepIndex((index) => Math.max(0, index - 1))} disabled={stepIndex === 0} className="border border-white/15 px-4 py-2 text-xs font-bold uppercase text-stone-300 hover:border-white/40 hover:text-white disabled:opacity-30">Back</button>
              {stepIndex < questionSteps.length - 1
                ? <button onClick={() => setStepIndex((index) => index + 1)} className="bg-[#ff3e47] px-4 py-2 text-xs font-black uppercase text-white hover:bg-[#ff555e]">Next: {questionSteps[stepIndex + 1].title}</button>
                : <button onClick={() => setOpen(false)} className="bg-[#ff3e47] px-4 py-2 text-xs font-black uppercase text-white hover:bg-[#ff555e]">Done</button>}
            </div>
          </div> : <div className="min-w-0 space-y-6">
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
          </div>}

          <aside className="h-fit border border-white/10 bg-black/30 p-4 lg:sticky lg:top-40">
            {mode === "questions" && <div className="mb-4 grid grid-cols-2 gap-1 border-b border-white/10 pb-3">
              {(["attack", "hp"] as const).map((kind) => <button key={kind} onClick={() => setTab(kind)} className={`rounded-md px-2 py-1.5 text-left ${tab === kind ? "bg-white/10" : "hover:bg-white/5"}`}>
                <span className="block text-[10px] font-bold uppercase tracking-wide text-stone-400">{kind === "attack" ? "Attack" : "HP"}</span>
                <span className="block text-base font-black tabular-nums text-white">{format(kind === "attack" ? result.attack.attack : result.hp.maxHp)}</span>
              </button>)}
            </div>}
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
            <Counted contributions={tab === "attack" ? result.attack.contributions : result.hp.contributions} stat={tab} />
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

function Counted({ contributions, stat }: { contributions: { label: string; source: string; stage: string; value: number }[]; stat: StatKind }) {
  const [expanded, setExpanded] = useState(false);
  if (!contributions.length) return null;
  const shown = expanded ? contributions : contributions.slice(0, 6);
  return <div className="mt-4 border-t border-white/10 pt-3">
    <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Counted ({contributions.length})</p>
    <ul className="mt-2 space-y-1 text-[11px]">
      {shown.map((line, index) => <li key={`${line.label}-${index}`} className="flex justify-between gap-2"><span className="min-w-0 truncate text-stone-300" title={`${line.source}: ${line.label}`}>{line.label}</span><span className="shrink-0 tabular-nums text-[#8dda93]">{formatBonus({ stat, stage: line.stage as never, value: line.value })}</span></li>)}
    </ul>
    {contributions.length > 6 && <button onClick={() => setExpanded((value) => !value)} className="mt-2 text-[11px] font-bold text-[#ffbe63] underline underline-offset-2">{expanded ? "Show less" : `Show all ${contributions.length}`}</button>}
  </div>;
}
