import assert from "node:assert/strict";
import { test } from "node:test";

import { calculateAttack, equipmentStat } from "./attack.ts";
import { referenceBuild } from "./reference-build.ts";

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
