/**
 * Attack formula (GetAttackBase), verified against a reference build:
 *
 *   base   = trunc((Count + Weapon) × (1 + Attack%))
 *   AV     = trunc((base + Outside flat) × (1 + Outside%))
 *   Attack = trunc(AV × (1 + Attack multiplier))
 *
 * - Count: every flat Attack source (hero, equipment, relics, dragons, sigil
 *   imprints, skins, assists, wings, …) except "outside" sources.
 * - Weapon: the weapon term shown separately by the reference calculator. It
 *   is summed with Count before the percent step, so it can also be listed as
 *   Count; in the reference build it was empty and the weapon sat in Count.
 * - Attack%: every percent Attack source (altar breaks, rarity unlocks, sigil
 *   imprint %, all-hero level unlocks, …).
 * - Outside flat: added after the percent step (e.g. gem Attack). It IS part
 *   of Attack: the reference footer shows 156,031 + 1,200 = 157,231 before
 *   the multiplier. Conditional bonuses (vs bosses, ground, melee, …) are a
 *   different thing and never enter Attack.
 * - Attack multiplier: combat buffs applied last, such as a sigil skill's
 *   "Damage bonus" (War Frenzy +60%). Mode-dependent (e.g. Hero Duel).
 *
 * Percent values are expressed in percent units (15 means 15%).
 */

export type AttackStage = "count" | "weapon" | "percent" | "outsideFlat" | "outsidePercent" | "multiplier";

export type AttackContribution = {
  label: string;
  source: string;
  stage: AttackStage;
  value: number;
};

export type AttackBreakdown = {
  count: number;
  weapon: number;
  percent: number;
  base: number;
  outsideFlat: number;
  outsidePercent: number;
  attackValue: number;
  multiplier: number;
  attack: number;
  contributions: AttackContribution[];
};

// Percents are scaled to integers so 0.1-style float errors never move a truncation.
const PERCENT_SCALE = 1000;

export function applyPercent(value: number, percent: number): number {
  const scaled = Math.round(percent * PERCENT_SCALE);
  return Math.trunc((value * (100 * PERCENT_SCALE + scaled)) / (100 * PERCENT_SCALE));
}

function sumStage(contributions: AttackContribution[], stage: AttackStage): number {
  const total = contributions
    .filter((contribution) => contribution.stage === stage)
    .reduce((sum, contribution) => sum + Math.round(contribution.value * PERCENT_SCALE), 0);
  return total / PERCENT_SCALE;
}

export function calculateAttack(contributions: AttackContribution[]): AttackBreakdown {
  const count = sumStage(contributions, "count");
  const weapon = sumStage(contributions, "weapon");
  const percent = sumStage(contributions, "percent");
  const outsideFlat = sumStage(contributions, "outsideFlat");
  const outsidePercent = sumStage(contributions, "outsidePercent");
  const multiplier = sumStage(contributions, "multiplier");

  const base = applyPercent(count + weapon, percent);
  const attackValue = applyPercent(base + outsideFlat, outsidePercent);
  const attack = applyPercent(attackValue, multiplier);

  return { count, weapon, percent, base, outsideFlat, outsidePercent, attackValue, multiplier, attack, contributions };
}

/**
 * Equipment main-stat value: trunc(level value × (1 + slot boost + rarity boost)).
 * Example: 3750 at 34.5% slot + 30% rarity boost → 6168.
 */
export function equipmentStat(levelValue: number, slotBoostPercent: number, rarityBoostPercent: number): number {
  return applyPercent(levelValue, slotBoostPercent + rarityBoostPercent);
}
