import assert from "node:assert/strict";
import { test } from "node:test";

import { calculateUserBuild, emptyCalculatorState, parseValue, referenceRows } from "./user-build.ts";

test("parseValue accepts thousands separators and decimals", () => {
  assert.equal(parseValue("1,200"), 1200);
  assert.equal(parseValue(" 10 405 "), 10405);
  assert.equal(parseValue("34.5"), 34.5);
  assert.equal(parseValue(""), null);
  assert.equal(parseValue("abc"), null);
});

test("the reference rows reproduce the verified Attack through the UI path", () => {
  const result = calculateUserBuild({ rows: referenceRows(), slotStats: {} }, []);
  assert.equal(result.attack.attack, 251569);
  assert.equal(result.attack.attackValue, 157231);
  assert.equal(result.invalid.length, 0);
});

test("slot stats count only for the item they were entered for", () => {
  const state = { rows: [], slotStats: { weapon: { itemId: "expedition-fists", attack: "6168", hp: "" } } };
  const same = calculateUserBuild(state, [{ slotId: "weapon", slotLabel: "Weapon", itemId: "expedition-fists", itemName: "Expedition Fist" }]);
  assert.equal(same.attack.attack, 6168);
  const swapped = calculateUserBuild(state, [{ slotId: "weapon", slotLabel: "Weapon", itemId: "brightspear", itemName: "Brightspear" }]);
  assert.equal(swapped.attack.attack, 0);
});

test("invalid text is reported and left out of totals", () => {
  const result = calculateUserBuild(
    {
      rows: [
        { id: "a", stat: "hp", label: "Base", stage: "count", value: "600" },
        { id: "b", stat: "hp", label: "Typo", stage: "percent", value: "ten" },
      ],
      slotStats: {},
    },
    [],
  );
  assert.equal(result.hp.maxHp, 600);
  assert.deepEqual(result.invalid, ["Typo"]);
});

test("an empty calculator totals zero", () => {
  const result = calculateUserBuild(emptyCalculatorState, []);
  assert.equal(result.attack.attack, 0);
  assert.equal(result.hp.maxHp, 0);
  assert.equal(result.entered, 0);
});
