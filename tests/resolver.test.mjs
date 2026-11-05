import assert from "node:assert/strict";
import test from "node:test";
import { classifyRoll, compareVersions, resolveAnimationConfig, resolvePlaceable } from "../scripts/resolver.mjs";

test("compares the numeric portion of API versions", () => {
  assert.equal(compareVersions("1.2.0", "1.2.0"), 0);
  assert.equal(compareVersions("1.3.0-beta", "1.2.0"), 1);
  assert.equal(compareVersions("1.1.9", "1.2.0"), -1);
});

test("classifies success, failure, and critical outcomes", () => {
  assert.equal(classifyRoll({ isSuccess: true }), "success");
  assert.equal(classifyRoll({ isSuccess: false }), "failure");
  assert.equal(classifyRoll({ isCriticalSuccess: true }), "criticalSuccess");
  assert.equal(classifyRoll({ isCriticalFailure: true }), "criticalFailure");
});

test("resolves Foundry token wrappers without accepting arbitrary objects", () => {
  const token = { center: { x: 1, y: 2 } };
  assert.equal(resolvePlaceable(token), token);
  assert.equal(resolvePlaceable({ object: token }), token);
  assert.equal(resolvePlaceable({ actor: {} }), null);
});

test("prefers per-item outcome paths and marks failed rolls as misses", () => {
  const settings = { animateRolls: true, rollPath: "world.default" };
  const context = {
    item: { flags: { "gum-animations": { animations: { roll: { path: "item.default", failurePath: "item.failure", scale: 1.5 } } } } },
    result: { isSuccess: false }
  };
  const config = resolveAnimationConfig({ context, eventType: "roll", getSetting: key => settings[key] });
  assert.equal(config.path, "item.failure");
  assert.equal(config.outcome, "failure");
  assert.equal(config.missed, true);
  assert.equal(config.scale, 1.5);
});

test("does not resolve disabled or unconfigured event families", () => {
  assert.equal(resolveAnimationConfig({ context: {}, eventType: "damage", getSetting: () => false }), null);
});
