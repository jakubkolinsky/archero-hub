import type { AttackContribution, AttackStage } from "./attack.ts";
import type { HpContribution, HpStage } from "./hp.ts";
import gameData from "./game-data.json" with { type: "json" };

/**
 * Guided calculator ("questionnaire"): the player answers simple questions —
 * which outfits they own, which weapon skins, how far each hero is raised —
 * and the matching Attack/HP bonuses are looked up from imported game data.
 *
 * Data comes from the imported workbooks and is not yet curator-verified, so
 * looked-up values are shown and weapon skin values can be overridden.
 *
 * Scope assumptions (from the reference build and player reports):
 * - Outfit unlock effects and level effects marked "all heroes" apply to every
 *   hero; other level effects only apply when playing the outfit's hero.
 * - Weapon skin "shared" bonuses are flat Attack for every hero.
 * - Hero Level and 2☆/7☆ milestones apply to all heroes; Brave and 8☆
 *   milestones only to that hero.
 */

export type OutfitLevel = { level: number; allHeroes: boolean; effect: string };
export type OutfitData = { slug: string; name: string; hero: string | null; unlock: string; levels: OutfitLevel[]; image: string | null };
export type WeaponSkinData = { name: string; weapon: string; bonus: number };
export type MilestoneData = { hero: string; milestone: string; effect: string };
export type GameData = { outfits: OutfitData[]; weaponSkins: WeaponSkinData[]; heroMilestones: MilestoneData[] };

export const calculatorGameData = gameData as GameData;

export type ParsedStat = { stat: "attack" | "hp"; stage: "count" | "percent"; value: number };

/** Reads "Attack +155", "Attack +2%", "Max HP +102", "HP 5%". Anything else (conditional damage, crit, …) is not Attack/HP. */
export function parseStatEffect(text: string): ParsedStat | null {
  const match = text.trim().match(/^(attack|attak|max\s*hp|hp)\s*\+?\s*([\d.]+)\s*(%?)$/i);
  if (!match) return null;
  const value = Number(match[2]);
  if (!Number.isFinite(value)) return null;
  return { stat: /^att/i.test(match[1]) ? "attack" : "hp", stage: match[3] ? "percent" : "count", value };
}

export const outfitLevels = [0, 5, 10, 20, 30, 40, 50, 60, 70, 80];
export const heroLevelSteps = [0, 20, 60, 120];
export const heroStarSteps = [0, 2, 7, 8];
export const braveSteps = [0, 20, 40, 100];

export type GuidedState = {
  /** Owned outfits: slug → outfit level (0 = owned, not levelled). `mine` marks an outfit of unknown hero as the current hero's. */
  outfits: Record<string, { level: number; mine?: boolean }>;
  /** Owned weapon skins: name → Attack bonus as typed (prefilled from data). */
  weaponSkins: Record<string, string>;
  /** Highest milestone reached per hero. */
  heroes: Record<string, { level: number; stars: number; brave: number }>;
  /** Answers to the numeric questions, by question id. */
  answers: Record<string, string>;
};

export const emptyGuidedState: GuidedState = { outfits: {}, weaponSkins: {}, heroes: {}, answers: {} };

export type GuidedQuestion = {
  id: string;
  stat: "attack" | "hp";
  stage: AttackStage | HpStage;
  question: string;
  hint: string;
  percent?: boolean;
};

export const guidedQuestionGroups: { title: string; questions: GuidedQuestion[] }[] = [
  {
    title: "Your hero",
    questions: [
      { id: "powerup-attack", stat: "attack", stage: "count", question: "Hero Powerup Attack", hint: "Talents / Powerup screen" },
      { id: "powerup-hp", stat: "hp", stage: "count", question: "Hero Powerup HP", hint: "Talents / Powerup screen" },
    ],
  },
  {
    title: "Altars and equipment unlocks",
    questions: [
      { id: "altar-attack", stat: "attack", stage: "percent", percent: true, question: "Altar Attack % (equipment + hero altar breaks)", hint: "Add both altars, e.g. 15 + 23 = 38" },
      { id: "altar-hp", stat: "hp", stage: "percent", percent: true, question: "Altar HP %", hint: "Add both altars" },
      { id: "rarity-attack", stat: "attack", stage: "percent", percent: true, question: "Equipment rarity unlock Attack %", hint: "e.g. Chaos weapon +15%, Chaos bracelet +20%" },
      { id: "rarity-hp", stat: "hp", stage: "percent", percent: true, question: "Equipment rarity unlock HP %", hint: "e.g. Chaos armor or locket unlocks" },
    ],
  },
  {
    title: "Collections",
    questions: [
      { id: "relic-attack", stat: "attack", stage: "count", question: "Relics: flat Attack", hint: "Relic screen totals" },
      { id: "relic-attack-pct", stat: "attack", stage: "percent", percent: true, question: "Relics: Attack %", hint: "Relic screen totals" },
      { id: "relic-hp", stat: "hp", stage: "count", question: "Relics: flat HP", hint: "Relic screen totals" },
      { id: "relic-hp-pct", stat: "hp", stage: "percent", percent: true, question: "Relics: HP %", hint: "Relic screen totals" },
      { id: "dragon-attack", stat: "attack", stage: "count", question: "Dragon statues: Attack", hint: "Dragon screen, all statues" },
      { id: "dragon-hp", stat: "hp", stage: "count", question: "Dragon statues: HP", hint: "Dragon screen, all statues" },
      { id: "sigil-attack", stat: "attack", stage: "count", question: "Sigil imprints: flat Attack", hint: "Sum of all imprints" },
      { id: "sigil-attack-pct", stat: "attack", stage: "percent", percent: true, question: "Sigil imprints: Attack %", hint: "Sum of all imprints" },
      { id: "wings-attack", stat: "attack", stage: "count", question: "Wings: Attack", hint: "Equipped wings plus owned-wings bonus" },
      { id: "wings-hp", stat: "hp", stage: "count", question: "Wings: HP", hint: "Equipped wings plus owned-wings bonus" },
      { id: "gem-attack", stat: "attack", stage: "outsideFlat", question: "Gems: Attack", hint: "Gem Attack is added after Attack %" },
      { id: "gem-hp", stat: "hp", stage: "count", question: "Gems: HP", hint: "Gem HP" },
    ],
  },
  {
    title: "In battle",
    questions: [
      { id: "combat-multiplier", stat: "attack", stage: "multiplier", percent: true, question: "Damage bonus from sigil skills", hint: "e.g. War Frenzy +60. Applied last." },
    ],
  },
];

const globalMilestone = (milestone: string) => /^Level /.test(milestone) || /^[27]☆$/.test(milestone);

/** Numeric threshold of a milestone, by kind. */
function milestoneStep(milestone: string): { kind: "level" | "stars" | "brave"; at: number } | null {
  const level = milestone.match(/^Level (\d+)$/);
  if (level) return { kind: "level", at: Number(level[1]) };
  const stars = milestone.match(/^(\d+)☆$/);
  if (stars) return { kind: "stars", at: Number(stars[1]) };
  const brave = milestone.match(/^Brave (\d+)$/);
  if (brave) return { kind: "brave", at: Number(brave[1]) };
  return null;
}

export type GuidedMilestone = MilestoneData & { stat: ParsedStat; global: boolean; kind: "level" | "stars" | "brave"; at: number };

/** Attack/HP milestones per hero. */
export function statMilestones(data: GameData = calculatorGameData): GuidedMilestone[] {
  return data.heroMilestones.flatMap((entry) => {
    const stat = parseStatEffect(entry.effect);
    const step = milestoneStep(entry.milestone);
    return stat && step ? [{ ...entry, stat, global: globalMilestone(entry.milestone), ...step }] : [];
  });
}

export type GuidedLine = { label: string; source: string; stat: "attack" | "hp"; stage: AttackStage | HpStage; value: number };

export function outfitLabel(outfit: OutfitData) {
  return outfit.name || "Unnamed outfit";
}

/** Bonuses one owned outfit gives the current hero. */
export function outfitLines(outfit: OutfitData, owned: { level: number; mine?: boolean }, heroName: string | null): GuidedLine[] {
  const forMyHero = outfit.hero ? outfit.hero === heroName : Boolean(owned.mine);
  const effects = [
    { text: outfit.unlock, label: `${outfitLabel(outfit)} (owned)` },
    ...outfit.levels
      .filter((level) => level.level <= owned.level && (level.allHeroes || forMyHero))
      .map((level) => ({ text: level.effect, label: `${outfitLabel(outfit)} Lv${level.level}` })),
  ];
  return effects.flatMap(({ text, label }) => {
    const stat = parseStatEffect(text);
    return stat ? [{ label, source: "Outfit", ...stat }] : [];
  });
}

export function guidedLines(state: GuidedState, heroName: string | null, data: GameData = calculatorGameData): { lines: GuidedLine[]; invalid: string[] } {
  const lines: GuidedLine[] = [];
  const invalid: string[] = [];

  for (const outfit of data.outfits) {
    const owned = state.outfits[outfit.slug];
    if (owned) lines.push(...outfitLines(outfit, owned, heroName));
  }

  for (const [name, text] of Object.entries(state.weaponSkins)) {
    if (!text.trim()) continue;
    const value = parseNumber(text);
    if (value === null) invalid.push(name);
    else lines.push({ label: name, source: "Weapon skin", stat: "attack", stage: "count", value });
  }

  for (const milestone of statMilestones(data)) {
    const reached = state.heroes[milestone.hero];
    if (!reached || reached[milestone.kind] < milestone.at) continue;
    if (!milestone.global && milestone.hero !== heroName) continue;
    lines.push({ label: `${milestone.hero} ${milestone.milestone}`, source: milestone.global ? "Hero milestone (all heroes)" : "Hero milestone", ...milestone.stat });
  }

  for (const group of guidedQuestionGroups) {
    for (const question of group.questions) {
      const text = state.answers[question.id] ?? "";
      if (!text.trim()) continue;
      const value = parseNumber(text);
      if (value === null) invalid.push(question.question);
      else lines.push({ label: question.question, source: group.title, stat: question.stat, stage: question.stage, value });
    }
  }

  return { lines, invalid };
}

export function splitLines(lines: GuidedLine[]): { attack: AttackContribution[]; hp: HpContribution[] } {
  return {
    attack: lines.filter((line) => line.stat === "attack").map(({ label, source, stage, value }) => ({ label, source, stage: stage as AttackStage, value })),
    hp: lines.filter((line) => line.stat === "hp").map(({ label, source, stage, value }) => ({ label, source, stage: stage as HpStage, value })),
  };
}

function parseNumber(text: string): number | null {
  const cleaned = text.trim().replace(/[\s,%+]/g, "");
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}
