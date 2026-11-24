import { calculateAttack, type AttackBreakdown, type AttackContribution, type AttackStage } from "./attack.ts";
import { calculateHp, type HpBreakdown, type HpContribution, type HpStage } from "./hp.ts";
import { referenceBuild } from "./reference-build.ts";

/**
 * Player-entered calculator state. Values are kept as typed text so inputs can
 * be edited freely; they are parsed only when totals are computed.
 */

export type StatKind = "attack" | "hp";

export type CalculatorRow = {
  id: string;
  stat: StatKind;
  label: string;
  stage: AttackStage | HpStage;
  value: string;
};

/** Attack/HP typed for an equipped slot, keyed by slot id. */
export type SlotStats = Record<string, { itemId: string; attack: string; hp: string }>;

export type EquippedSlot = { slotId: string; slotLabel: string; itemId: string; itemName: string };

export type CalculatorState = { rows: CalculatorRow[]; slotStats: SlotStats };

export const emptyCalculatorState: CalculatorState = { rows: [], slotStats: {} };

export const attackStages: { stage: AttackStage; label: string; hint: string }[] = [
  { stage: "count", label: "Flat Attack", hint: "Hero, relics, dragons, sigil imprints, skins, wings…" },
  { stage: "weapon", label: "Weapon", hint: "Weapon term, added to flat Attack" },
  { stage: "percent", label: "Attack %", hint: "Altar breaks, rarity unlocks, all-hero unlocks…" },
  { stage: "outsideFlat", label: "Outside flat", hint: "Added after Attack %, e.g. gems" },
  { stage: "outsidePercent", label: "Outside %", hint: "Applied to the outside step" },
  { stage: "multiplier", label: "Multiplier %", hint: "Combat buffs, e.g. War Frenzy +60%" },
];

export const hpStages: { stage: HpStage; label: string; hint: string }[] = [
  { stage: "count", label: "Flat HP", hint: "Hero, equipment, relics, dragons…" },
  { stage: "percent", label: "HP %", hint: "All percent HP bonuses" },
];

/** Parses a typed number; accepts "1,200", "1 200" and "7.5". Returns null when not a number. */
export function parseValue(text: string): number | null {
  const cleaned = text.trim().replace(/[\s,]/g, "");
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

export type CalculatorResult = {
  attack: AttackBreakdown;
  hp: HpBreakdown;
  /** Rows or slot inputs whose text is not a number; they are left out of the totals. */
  invalid: string[];
  entered: number;
};

export function calculateUserBuild(state: CalculatorState, equipped: EquippedSlot[]): CalculatorResult {
  const attack: AttackContribution[] = [];
  const hp: HpContribution[] = [];
  const invalid: string[] = [];

  const add = (stat: StatKind, label: string, source: string, stage: AttackStage | HpStage, text: string) => {
    if (!text.trim()) return;
    const value = parseValue(text);
    if (value === null) {
      invalid.push(label);
      return;
    }
    if (stat === "attack") attack.push({ label, source, stage: stage as AttackStage, value });
    else hp.push({ label, source, stage: stage as HpStage, value });
  };

  for (const slot of equipped) {
    const stats = state.slotStats[slot.slotId];
    // Typed stats belong to the item that was equipped when they were entered.
    if (!stats || stats.itemId !== slot.itemId) continue;
    add("attack", slot.itemName, slot.slotLabel, "count", stats.attack);
    add("hp", slot.itemName, slot.slotLabel, "count", stats.hp);
  }

  for (const row of state.rows) {
    add(row.stat, row.label || "Unnamed line", "Player entry", row.stage, row.value);
  }

  return {
    attack: calculateAttack(attack),
    hp: calculateHp(hp),
    invalid,
    entered: attack.length + hp.length,
  };
}

/** The verified 251,569 Attack reference build as editable rows. */
export function referenceRows(): CalculatorRow[] {
  return referenceBuild.map((contribution, index) => ({
    id: `reference-${index}`,
    stat: "attack",
    label: contribution.label,
    stage: contribution.stage,
    value: String(contribution.value),
  }));
}

export function newRow(stat: StatKind, id: string): CalculatorRow {
  return { id, stat, label: "", stage: "count", value: "" };
}
