import assert from "node:assert/strict";
import test from "node:test";
import { createAutomatedAnimationsAdapter } from "../scripts/adapters/automated-animations.mjs";

const sourceToken = { center: { x: 0, y: 0 } };
const targetToken = { center: { x: 10, y: 10 } };
const item = { id: "spell", type: "spell" };

test("routes a successful GUM roll through the configured Item", async () => {
  const calls = [];
  const adapter = createAutomatedAnimationsAdapter({
    isModuleActive: () => true,
    getApi: () => ({ playAnimation: (...args) => calls.push(args) })
  });
  const context = { item, sourceToken, targets: [targetToken], result: { isSuccess: true } };
  assert.equal(adapter.canHandle({ eventType: "roll", context }), true);
  await adapter.handle({ eventType: "roll", context });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], sourceToken);
  assert.equal(calls[0][1], item);
  assert.deepEqual(calls[0][2].targets, [targetToken]);
  assert.deepEqual(calls[0][2].hitTargets, [targetToken]);
  assert.equal(calls[0][2].playOnMiss, false);
});

test("marks failed rolls as misses and respects the failure setting", async () => {
  const calls = [];
  const allowed = createAutomatedAnimationsAdapter({
    isModuleActive: () => true,
    getPlayOnFailure: () => true,
    getApi: () => ({ playAnimation: (...args) => calls.push(args) })
  });
  const context = { item, sourceToken, targets: [targetToken], result: { isSuccess: false } };
  await allowed.handle({ eventType: "roll", context });
  assert.deepEqual(calls[0][2].hitTargets, []);
  assert.equal(calls[0][2].playOnMiss, true);

  const blocked = createAutomatedAnimationsAdapter({
    isModuleActive: () => true,
    getPlayOnFailure: () => false,
    getApi: () => ({ playAnimation: () => { throw new Error("should not run"); } })
  });
  assert.equal(await blocked.handle({ eventType: "roll", context }), false);
});

test("handles consumption without duplicating normal item activation", () => {
  const adapter = createAutomatedAnimationsAdapter({ isModuleActive: () => true, getApi: () => ({ playAnimation() {} }) });
  const base = { item, sourceToken };
  assert.equal(adapter.canHandle({ eventType: "itemUse", context: { ...base, result: { trigger: "consume" } } }), true);
  assert.equal(adapter.canHandle({ eventType: "itemUse", context: { ...base, result: { trigger: "activate" } } }), false);
});

test("is unavailable when Automated Animations is inactive", () => {
  const adapter = createAutomatedAnimationsAdapter({ isModuleActive: () => false, getApi: () => null });
  assert.equal(adapter.isAvailable(), false);
});
