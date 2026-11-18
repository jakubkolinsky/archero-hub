import assert from "node:assert/strict";
import { test } from "node:test";

import { calculateHp } from "./hp.ts";

test("empty Atreus build is the hero base HP", () => {
  const result = calculateHp([{ label: "Atreus base", source: "Hero base", stage: "count", value: 600 }]);
  assert.equal(result.maxHp, 600);
});

test("HP percents are summed once and truncated", () => {
  const result = calculateHp([
    { label: "base", source: "test", stage: "count", value: 1001 },
    { label: "a", source: "test", stage: "percent", value: 10.5 },
    { label: "b", source: "test", stage: "percent", value: 4.5 },
  ]);
  assert.equal(result.percent, 15);
  assert.equal(result.maxHp, 1151); // 1001 × 1.15 = 1151.15
});
