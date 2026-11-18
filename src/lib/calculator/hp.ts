import { applyPercent } from "./attack.ts";

/**
 * Max HP formula, per the reference calculator (Archero 8.3.0 game files):
 *
 *   Max HP = trunc(Count × (1 + HP%))
 *
 * - Count: every flat HP source (hero base, e.g. Atreus +600, hero level,
 *   equipment, relics, dragons, …).
 * - HP%: every percent HP source, summed and applied once.
 * - No outside step and no multiplier, unlike Attack.
 *
 * Not yet verified against a full reference build: only the empty build
 * (Atreus base 600 → 600) is confirmed.
 */

export type HpStage = "count" | "percent";

export type HpContribution = {
  label: string;
  source: string;
  stage: HpStage;
  value: number;
};

export type HpBreakdown = {
  count: number;
  percent: number;
  maxHp: number;
  contributions: HpContribution[];
};

function sumStage(contributions: HpContribution[], stage: HpStage): number {
  const total = contributions
    .filter((contribution) => contribution.stage === stage)
    .reduce((sum, contribution) => sum + Math.round(contribution.value * 1000), 0);
  return total / 1000;
}

export function calculateHp(contributions: HpContribution[]): HpBreakdown {
  const count = sumStage(contributions, "count");
  const percent = sumStage(contributions, "percent");
  return { count, percent, maxHp: applyPercent(count, percent), contributions };
}
