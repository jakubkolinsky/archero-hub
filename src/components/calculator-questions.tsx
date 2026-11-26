"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  braveSteps,
  calculatorGameData,
  guidedQuestionGroups,
  heroLevelSteps,
  heroStarSteps,
  outfitLabel,
  outfitLevels,
  outfitLines,
  statMilestones,
  type GuidedLine,
  type GuidedQuestion,
  type GuidedState,
  type OutfitData,
} from "@/lib/calculator/guided";
import type { EquippedSlot, StatKind } from "@/lib/calculator/user-build";

export const questionSteps = [
  { id: "gear", title: "Gear", question: "What Attack and HP does each equipped item show?" },
  { id: "hero", title: "Heroes", question: "How far have you raised your heroes?" },
  { id: "outfits", title: "Outfits", question: "Which outfits do you own?" },
  { id: "skins", title: "Weapon skins", question: "Which weapon skins do you own?" },
  { id: "more", title: "Altars & more", question: "A few numbers from other screens" },
] as const;

export type QuestionStepId = (typeof questionSteps)[number]["id"];

const inputClass = "w-full border border-white/15 bg-black/40 px-2 py-1.5 text-right text-sm text-white placeholder:text-stone-600 focus:border-[#ff555e] focus:outline-none";
const selectClass = "border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-white focus:border-[#ff555e] focus:outline-none";

export const formatBonus = (line: Pick<GuidedLine, "stat" | "stage" | "value">) => {
  const percent = line.stage === "percent" || line.stage === "outsidePercent" || line.stage === "multiplier";
  return `+${line.value.toLocaleString("en-US")}${percent ? "%" : ""} ${line.stat === "attack" ? "Atk" : "HP"}`;
};

type Props = {
  step: QuestionStepId;
  guided: GuidedState;
  onGuided: (update: (current: GuidedState) => GuidedState) => void;
  equipped: EquippedSlot[];
  heroName: string | null;
  slotValue: (slot: EquippedSlot, stat: StatKind) => string;
  onSlot: (slot: EquippedSlot, stat: StatKind, value: string) => void;
};

export function CalculatorQuestions(props: Props) {
  switch (props.step) {
    case "gear":
      return <GearStep {...props} />;
    case "hero":
      return <HeroStep {...props} />;
    case "outfits":
      return <OutfitStep {...props} />;
    case "skins":
      return <WeaponSkinStep {...props} />;
    case "more":
      return <MoreStep {...props} />;
  }
}

function GearStep({ equipped, slotValue, onSlot }: Props) {
  const gear = equipped.filter((slot) => slot.slotId !== "hero");
  return <div>
    <p className="text-xs leading-5 text-stone-400">Open each item in the game and type the Attack and HP it shows. Leave a box empty if the item has none. Swap items in the loadout first if yours differ.</p>
    <div className="mt-3 divide-y divide-white/5 border border-white/10">
      <div className="grid grid-cols-[1fr_96px_96px] gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-stone-500"><span>Item</span><span className="text-right">Attack</span><span className="text-right">HP</span></div>
      {gear.map((slot) => <div key={slot.slotId} className="grid grid-cols-[1fr_96px_96px] items-center gap-2 px-3 py-2">
        <span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-wide text-stone-500">{slot.slotLabel}</span><span className="block truncate text-sm font-semibold text-white">{slot.itemName}</span></span>
        {(["attack", "hp"] as const).map((stat) => <input key={stat} inputMode="decimal" value={slotValue(slot, stat)} onChange={(event) => onSlot(slot, stat, event.target.value)} placeholder="0" aria-label={`${slot.itemName} ${stat === "attack" ? "Attack" : "HP"}`} className={inputClass} />)}
      </div>)}
    </div>
  </div>;
}

function HeroStep({ guided, onGuided, equipped, heroName, slotValue, onSlot }: Props) {
  const heroSlot = equipped.find((slot) => slot.slotId === "hero");
  const milestones = useMemo(() => statMilestones(), []);
  const heroes = useMemo(() => {
    const names = [...new Set(milestones.filter((milestone) => milestone.global || milestone.hero === heroName).map((milestone) => milestone.hero))];
    return names.sort((a, b) => (a === heroName ? -1 : b === heroName ? 1 : a.localeCompare(b)));
  }, [milestones, heroName]);

  function setHero(hero: string, field: "level" | "stars" | "brave", value: number) {
    onGuided((current) => {
      const previous = current.heroes[hero] ?? { level: 0, stars: 0, brave: 0 };
      return { ...current, heroes: { ...current.heroes, [hero]: { ...previous, [field]: value } } };
    });
  }

  return <div className="space-y-5">
    {heroSlot && <div className="border border-white/10 p-3">
      <p className="text-sm font-bold text-white">{heroSlot.itemName}: Attack and HP from level, stars and assist</p>
      <p className="mt-0.5 text-[11px] text-stone-400">From the hero screen. Leave out gear and outfits; they have their own questions.</p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:max-w-xs">
        {(["attack", "hp"] as const).map((stat) => <label key={stat} className="text-[10px] font-bold uppercase tracking-wide text-stone-500">{stat === "attack" ? "Attack" : "HP"}
          <input inputMode="decimal" value={slotValue(heroSlot, stat)} onChange={(event) => onSlot(heroSlot, stat, event.target.value)} placeholder="0" className={`mt-1 ${inputClass}`} />
        </label>)}
      </div>
    </div>}

    <div>
      <p className="text-xs leading-5 text-stone-400">Some hero milestones give a bonus to <b className="text-stone-200">every</b> hero. Pick how far each hero has got; only the Attack and HP bonuses are counted.{heroName && <> Brave bonuses count only for {heroName}.</>}</p>
      <div className="mt-3 divide-y divide-white/5 border border-white/10">
        {heroes.map((hero) => {
          const reached = guided.heroes[hero] ?? { level: 0, stars: 0, brave: 0 };
          const gained = milestones.filter((milestone) => milestone.hero === hero && (milestone.global || hero === heroName) && reached[milestone.kind] >= milestone.at);
          const mine = hero === heroName;
          return <div key={hero} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
            <span className="w-28 shrink-0 text-sm font-semibold text-white">{hero}{mine && <span className="ml-1 text-[10px] font-bold uppercase text-[#ff555e]">yours</span>}</span>
            <StepSelect label="Level" steps={heroLevelSteps} value={reached.level} onChange={(value) => setHero(hero, "level", value)} format={(step) => `Lv ${step}+`} />
            <StepSelect label="Stars" steps={heroStarSteps} value={reached.stars} onChange={(value) => setHero(hero, "stars", value)} format={(step) => `${step}☆+`} />
            {mine && <StepSelect label="Brave" steps={braveSteps} value={reached.brave} onChange={(value) => setHero(hero, "brave", value)} format={(step) => `Brave ${step}+`} />}
            <span className="ml-auto text-[11px] text-[#8dda93]">{gained.map((milestone) => formatBonus({ ...milestone.stat })).join(" · ")}</span>
          </div>;
        })}
      </div>
    </div>
  </div>;
}

function StepSelect({ label, steps, value, onChange, format }: { label: string; steps: number[]; value: number; onChange: (value: number) => void; format: (step: number) => string }) {
  return <select value={value} onChange={(event) => onChange(Number(event.target.value))} aria-label={label} className={selectClass}>
    {steps.map((step) => <option key={step} value={step}>{step === 0 ? `${label}: —` : format(step)}</option>)}
  </select>;
}

function OutfitStep({ guided, onGuided, heroName }: Props) {
  const [search, setSearch] = useState("");
  const [ownedOnly, setOwnedOnly] = useState(false);
  const ownedCount = Object.keys(guided.outfits).length;
  const outfits = calculatorGameData.outfits.filter((outfit) => {
    if (ownedOnly && !guided.outfits[outfit.slug]) return false;
    const text = `${outfit.name} ${outfit.hero ?? ""} ${outfit.unlock}`.toLowerCase();
    return text.includes(search.trim().toLowerCase());
  });

  function toggle(outfit: OutfitData) {
    onGuided((current) => {
      const next = { ...current.outfits };
      if (next[outfit.slug]) delete next[outfit.slug];
      else next[outfit.slug] = { level: 0 };
      return { ...current, outfits: next };
    });
  }

  function update(outfit: OutfitData, patch: { level?: number; mine?: boolean }) {
    onGuided((current) => ({ ...current, outfits: { ...current.outfits, [outfit.slug]: { ...current.outfits[outfit.slug], ...patch } } }));
  }

  return <div>
    <p className="text-xs leading-5 text-stone-400">Tap every outfit you own, then set its level. Owning an outfit gives its bonus to all heroes; some level bonuses only count on the outfit&apos;s own hero.</p>
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search outfit or hero" aria-label="Search outfits" className="min-w-0 flex-1 border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-white placeholder:text-stone-600 focus:border-[#ff555e] focus:outline-none" />
      <label className="flex items-center gap-2 text-xs font-semibold text-stone-300"><input type="checkbox" checked={ownedOnly} onChange={(event) => setOwnedOnly(event.target.checked)} className="size-3.5 accent-[#ff3e47]" /> Owned only ({ownedCount})</label>
    </div>
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {outfits.map((outfit) => {
        const owned = guided.outfits[outfit.slug];
        const lines = owned ? outfitLines(outfit, owned, heroName) : [];
        const hasHeroOnly = outfit.levels.some((level) => !level.allHeroes);
        return <div key={outfit.slug} className={`border p-2 ${owned ? "border-[#ff555e] bg-[#ff555e]/10" : "border-white/10 bg-black/20"}`}>
          <button onClick={() => toggle(outfit)} aria-pressed={Boolean(owned)} className="flex w-full items-center gap-2 text-left">
            <span className="relative size-12 shrink-0 overflow-hidden bg-black/40">
              {outfit.image && <Image src={outfit.image} alt="" fill sizes="48px" className="object-contain" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-white">{outfitLabel(outfit)}</span>
              <span className="block truncate text-[10px] uppercase tracking-wide text-stone-500">{outfit.hero ?? "Hero not listed"}</span>
              <span className="block truncate text-[11px] text-stone-300">{outfit.unlock || "No owned bonus listed"}</span>
            </span>
          </button>
          {owned && <div className="mt-2 space-y-1.5 border-t border-white/10 pt-2">
            <label className="flex items-center justify-between gap-2 text-[11px] text-stone-400">Level
              <select value={owned.level} onChange={(event) => update(outfit, { level: Number(event.target.value) })} className={`${selectClass} py-1 text-xs`}>
                {outfitLevels.map((level) => <option key={level} value={level}>{level === 0 ? "Not levelled" : `Lv ${level}+`}</option>)}
              </select>
            </label>
            {!outfit.hero && hasHeroOnly && <label className="flex items-center gap-2 text-[11px] text-stone-400"><input type="checkbox" checked={Boolean(owned.mine)} onChange={(event) => update(outfit, { mine: event.target.checked })} className="size-3.5 accent-[#ff3e47]" /> It&apos;s my hero&apos;s outfit</label>}
            <p className="text-[11px] leading-4 text-[#8dda93]">{lines.length ? lines.map(formatBonus).join(" · ") : "No Attack or HP bonus"}</p>
          </div>}
        </div>;
      })}
      {!outfits.length && <p className="col-span-full py-6 text-center text-xs text-stone-500">No outfits match.</p>}
    </div>
  </div>;
}

function WeaponSkinStep({ guided, onGuided }: Props) {
  const byWeapon = useMemo(() => {
    const groups = new Map<string, typeof calculatorGameData.weaponSkins>();
    for (const skin of calculatorGameData.weaponSkins) groups.set(skin.weapon, [...(groups.get(skin.weapon) ?? []), skin]);
    return [...groups.entries()];
  }, []);

  function toggle(name: string, bonus: number) {
    onGuided((current) => {
      const next = { ...current.weaponSkins };
      if (name in next) delete next[name];
      else next[name] = String(bonus);
      return { ...current, weaponSkins: next };
    });
  }

  return <div>
    <p className="text-xs leading-5 text-stone-400">Every weapon skin you own adds Attack to all heroes. The value is the listed base; if your skin is levelled, type the Attack shown in the game.</p>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {byWeapon.map(([weapon, skins]) => <div key={weapon} className="border border-white/10 p-2">
        <p className="px-1 text-[10px] font-bold uppercase tracking-wide text-stone-500">{weapon}</p>
        {skins.map((skin) => {
          const owned = skin.name in guided.weaponSkins;
          return <div key={skin.name} className="flex items-center gap-2 px-1 py-1">
            <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-white"><input type="checkbox" checked={owned} onChange={() => toggle(skin.name, skin.bonus)} className="size-3.5 accent-[#ff3e47]" /><span className="truncate">{skin.name}</span></label>
            {owned
              ? <input inputMode="decimal" value={guided.weaponSkins[skin.name]} onChange={(event) => onGuided((current) => ({ ...current, weaponSkins: { ...current.weaponSkins, [skin.name]: event.target.value } }))} aria-label={`${skin.name} Attack`} className={`${inputClass} w-20 py-1`} />
              : <span className="text-[11px] text-stone-500">+{skin.bonus} Atk</span>}
          </div>;
        })}
      </div>)}
    </div>
    <p className="mt-3 text-[11px] text-stone-500">Missing a skin? Add it as a line in Manual mode.</p>
  </div>;
}

function MoreStep({ guided, onGuided }: Props) {
  const setAnswer = (question: GuidedQuestion, value: string) => onGuided((current) => ({ ...current, answers: { ...current.answers, [question.id]: value } }));
  return <div className="space-y-5">
    <p className="text-xs leading-5 text-stone-400">Skip anything you don&apos;t have. Percent answers are plain numbers: type 15 for +15%.</p>
    {guidedQuestionGroups.map((group) => <section key={group.title}>
      <h4 className="text-[11px] font-bold uppercase tracking-[.16em] text-stone-300">{group.title}</h4>
      <div className="mt-2 divide-y divide-white/5 border border-white/10">
        {group.questions.map((question) => <label key={question.id} className="grid grid-cols-[1fr_110px] items-center gap-3 px-3 py-2">
          <span className="min-w-0"><span className="block text-sm text-white">{question.question}</span><span className="block text-[11px] text-stone-500">{question.hint}</span></span>
          <span className="relative">
            <input inputMode="decimal" value={guided.answers[question.id] ?? ""} onChange={(event) => setAnswer(question, event.target.value)} placeholder="0" className={`${inputClass} ${question.percent ? "pr-6" : ""}`} />
            {question.percent && <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-stone-500">%</span>}
          </span>
        </label>)}
      </div>
    </section>)}
  </div>;
}
