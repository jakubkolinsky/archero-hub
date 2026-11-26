import assert from "node:assert/strict";
import { test } from "node:test";

import { calculatorGameData, emptyGuidedState, guidedLines, outfitLines, parseStatEffect, statMilestones } from "./guided.ts";

const outfit = (slug: string) => {
  const found = calculatorGameData.outfits.find((entry) => entry.slug === slug);
  assert.ok(found, slug);
  return found;
};

test("stat effects are read, other effects are not", () => {
  assert.deepEqual(parseStatEffect("Attack +155"), { stat: "attack", stage: "count", value: 155 });
  assert.deepEqual(parseStatEffect("Attack +2%"), { stat: "attack", stage: "percent", value: 2 });
  assert.deepEqual(parseStatEffect("Max HP + 1200"), { stat: "hp", stage: "count", value: 1200 });
  assert.deepEqual(parseStatEffect("HP  +5%"), { stat: "hp", stage: "percent", value: 5 });
  assert.deepEqual(parseStatEffect("Attak +50"), { stat: "attack", stage: "count", value: 50 });
  assert.equal(parseStatEffect("Damage to Mobs +138"), null);
  assert.equal(parseStatEffect("Weapon Damage +1%"), null);
  assert.equal(parseStatEffect(""), null);
});

test("owning Lucky Lion and Incoming Spirit adds their unlock Attack", () => {
  const { lines } = guidedLines({ ...emptyGuidedState, outfits: { "lucky-lion": { level: 0 }, "incoming-spirit": { level: 0 } } }, "Atreus");
  assert.deepEqual(lines.map((line) => [line.label, line.value]), [["Incoming Spirit (owned)", 155], ["Lucky Lion (owned)", 200]]);
});

test("outfit level effects: all-hero ones always, the rest only on the outfit's hero", () => {
  const lion = outfit("lucky-lion");
  const level30 = outfitLines(lion, { level: 30 }, "Atreus").map((line) => line.label);
  // Lv5 Max HP and Lv20 Max HP are all-heroes; Lv30 Attack +2% is hero-only.
  assert.deepEqual(level30, ["Lucky Lion (owned)", "Lucky Lion Lv5", "Lucky Lion Lv20"]);
  if (lion.hero) {
    assert.ok(outfitLines(lion, { level: 30 }, lion.hero).some((line) => line.label === "Lucky Lion Lv30"));
  } else {
    assert.ok(outfitLines(lion, { level: 30, mine: true }, "Atreus").some((line) => line.label === "Lucky Lion Lv30"));
  }
});

test("hero milestones: Level and 2/7 stars count for every hero, Brave only for your hero", () => {
  const heroes = { Meowgik: { level: 60, stars: 0, brave: 0 }, Atreus: { level: 0, stars: 0, brave: 40 }, Phoren: { level: 0, stars: 7, brave: 0 } };
  const asAtreus = guidedLines({ ...emptyGuidedState, heroes }, "Atreus").lines.map((line) => `${line.label} ${line.value}`);
  // Reference build: Meowgik Lv20 +50, Lv60 +4%; Phoren 7☆ +200; Atreus Brave 20 +80, Brave 40 +2%.
  assert.deepEqual(asAtreus.sort(), ["Atreus Brave 20 80", "Atreus Brave 40 2", "Meowgik Level 20 50", "Meowgik Level 60 4", "Phoren 7☆ 200"]);
  const asHelix = guidedLines({ ...emptyGuidedState, heroes }, "Helix").lines.map((line) => line.label);
  assert.ok(!asHelix.some((label) => label.startsWith("Atreus Brave")));
});

test("weapon skins and answers are parsed; bad text is reported", () => {
  const { lines, invalid } = guidedLines({ ...emptyGuidedState, weaponSkins: { "Star Cluster Fury": "296" }, answers: { "altar-attack": "38%", "dragon-attack": "lots" } }, null);
  assert.deepEqual(lines.map((line) => [line.label, line.stage, line.value]), [["Star Cluster Fury", "count", 296], ["Altar Attack % (equipment + hero altar breaks)", "percent", 38]]);
  assert.deepEqual(invalid, ["Dragon statues: Attack"]);
});

test("every hero milestone kind parses", () => {
  const kinds = new Set(statMilestones().map((milestone) => milestone.kind));
  assert.deepEqual([...kinds].sort(), ["brave", "level", "stars"]);
});
