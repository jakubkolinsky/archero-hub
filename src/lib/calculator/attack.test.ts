import assert from "node:assert/strict";
import { test } from "node:test";

import { calculateAttack, equipmentStat, type AttackContribution } from "./attack.ts";

// Reference build: Atreus, user-supplied calculator screenshot (2026-11-18).
// Expected: Count 67,255 · Attack% 132 · base 156,031 · AV 157,231 · Attack 251,569.
const flat = (label: string, source: string, value: number): AttackContribution => ({ label, source, stage: "count", value });
const pct = (label: string, source: string, value: number): AttackContribution => ({ label, source, stage: "percent", value });

const referenceBuild: AttackContribution[] = [
  flat("Hero 10000 assist Lv100", "Hero assist effect", 80),
  pct("Hero 10000 assist Lv100", "Hero assist effect", 2),
  flat("Goldwish Cudgel star 6, evolution 45", "Relic", 1317),
  pct("Goldwish Cudgel star 6, evolution 45", "Relic", 18),
  flat("Starrite Statue Lv1", "Dragon", 1620),
  flat("Voideon Statue Lv120", "Dragon", 3969),
  flat("Equipment altar Lv0", "Altar", 0),
  pct("Equipment altar break 10", "Altar", 15),
  flat("Hero altar Lv0", "Altar", 0),
  pct("Hero altar break 12", "Altar", 23),
  { label: "Lv.13 Tourmaline in set 5", source: "Gem", stage: "outsideFlat", value: 1200 },
  flat("Sigil: War Frenzy Lv195", "Imprint", 10405),
  pct("Sigil: War Frenzy Lv195", "Imprint", 7),
  flat("Sigil: Destruction Aura Lv195", "Imprint", 10405),
  pct("Sigil: Destruction Aura Lv195", "Imprint", 9),
  flat("Sigil: Spinning Rim Lv195", "Imprint", 10405),
  flat("Sigil: Swift Counter Lv195", "Imprint", 10405),
  pct("Divine Insight: Trident (Chaos) Lv1", "Equipment rarity unlock", 15),
  pct("Divine Insight: Warbracer (Chaos) Lv1", "Equipment rarity unlock", 20),
  flat("Divine Insight: Trident (Chaos) Lv1", "Equipment", equipmentStat(3750, 34.5, 30)),
  flat("Divine Insight: Warbracer (Chaos) Lv1", "Equipment", equipmentStat(2250, 34.5, 30)),
  flat("Star Cluster Fury", "Weapon skin", 296),
  flat("Sovereign Bow", "Weapon skin", 370),
  flat("Atreus base", "Hero base", 150),
  flat("Atreus level 153", "Hero level", 1216),
  flat("Atreus star 8", "Hero training / stars", 1513),
  flat("Atreus assist Lv100", "Hero assist", 2355),
  flat("Atreus hero-specific bonus", "Hero-specific bonus", 261),
  flat("Urasil level 20 unlock (all heroes)", "Hero level unlock", 40),
  pct("Taranis level 60 unlock (all heroes)", "Hero level unlock", 4),
  pct("Helix level 160 unlock (all heroes)", "Hero level unlock", 5),
  flat("Meowgik level 20 unlock (all heroes)", "Hero level unlock", 50),
  pct("Meowgik level 60 unlock (all heroes)", "Hero level unlock", 4),
  pct("King Arthur level 120 unlock (all heroes)", "Hero level unlock", 10),
  flat("Atreus star 2", "Hero star skill", 30),
  flat("Phoren star 7 (all heroes)", "Hero star skill", 200),
  flat("Helix star 2 (all heroes)", "Hero star skill", 40),
  flat("Hero Powerup 34%", "Hero Powerup", 1779),
  flat("Irridescent Wings Lv1, star 0 (equipped)", "Wings", 280),
  flat("Irridescent Wings Lv1, star 0 (equipped)", "Wings", 200),
  { label: "War Frenzy damage bonus", source: "Sigil combat effect", stage: "multiplier", value: 60 },
];

test("equipment stat applies slot and rarity boosts with truncation", () => {
  assert.equal(equipmentStat(3750, 34.5, 30), 6168);
  assert.equal(equipmentStat(2250, 34.5, 30), 3701);
});

test("reference build reproduces every stage of the in-game Attack", () => {
  const result = calculateAttack(referenceBuild);
  assert.equal(result.count, 67255);
  assert.equal(result.percent, 132);
  assert.equal(result.base, 156031);
  assert.equal(result.outsideFlat, 1200);
  assert.equal(result.attackValue, 157231);
  assert.equal(result.multiplier, 60);
  assert.equal(result.attack, 251569);
});

test("without the War Frenzy combat buff, Attack equals AV", () => {
  const withoutBuff = calculateAttack(referenceBuild.filter((c) => c.stage !== "multiplier"));
  assert.equal(withoutBuff.attack, 157231);
});

test("outside flat is not multiplied by Attack%", () => {
  const result = calculateAttack([
    { label: "base", source: "test", stage: "count", value: 1000 },
    { label: "pct", source: "test", stage: "percent", value: 50 },
    { label: "gem", source: "test", stage: "outsideFlat", value: 100 },
  ]);
  assert.equal(result.attackValue, 1600);
});

test("weapon term is added to Count before Attack%", () => {
  const result = calculateAttack([
    { label: "Atreus base", source: "Hero base", stage: "count", value: 150 },
    { label: "weapon", source: "Weapon", stage: "weapon", value: 50 },
    { label: "pct", source: "test", stage: "percent", value: 10 },
  ]);
  assert.equal(result.base, 220);
  assert.equal(result.attack, 220);
});

test("empty Atreus build is the hero base Attack", () => {
  assert.equal(calculateAttack([{ label: "Atreus base", source: "Hero base", stage: "count", value: 150 }]).attack, 150);
});
