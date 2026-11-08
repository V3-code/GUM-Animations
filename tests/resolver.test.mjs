import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyContext,
  classifyRoll,
  compareVersions,
  mappingMatches,
  normalizeMapping,
  resolveAnimationConfig,
  resolveMapping,
  resolvePlaceable
} from "../scripts/resolver.mjs";

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

test("normalizes mapping defaults and preserves supported filters", () => {
  const mapping = normalizeMapping({ eventType: "damage", result: "active", placement: "target", scale: "1.25" });
  assert.equal(mapping.eventType, "damage");
  assert.equal(mapping.result, "active");
  assert.equal(mapping.placement, "target");
  assert.equal(mapping.scale, 1.25);
  assert.ok(mapping.id);
});

test("matches semantic event, item, action, attack, and outcome filters", () => {
  const context = {
    item: { id: "bow", uuid: "Actor.a.Item.bow", type: "skill" },
    action: { type: "skill", id: "shot", attackType: "ranged" },
    result: { isSuccess: true }
  };
  const mapping = {
    eventType: "roll",
    itemUuid: "Actor.a.Item.bow",
    itemType: "skill",
    actionType: "skill",
    actionId: "shot",
    attackType: "ranged",
    result: "success",
    path: "custom.arrow"
  };
  assert.equal(mappingMatches(mapping, context, "roll"), true);
  assert.equal(mappingMatches({ ...mapping, result: "failure" }, context, "roll"), false);
});

test("uses the first matching mapping before a generic event fallback", () => {
  const settings = {
    mappings: [
      { id: "specific", eventType: "roll", itemType: "spell", path: "spell.fire" },
      { id: "general", eventType: "roll", path: "roll.general", placement: "source" }
    ],
    animateRolls: true,
    rollPath: "legacy.default"
  };
  const context = { item: { type: "skill" }, result: { isSuccess: true }, action: {} };
  const config = resolveAnimationConfig({ context, eventType: "roll", getSetting: key => settings[key] });
  assert.equal(config.path, "roll.general");
  assert.equal(config.mappingId, "general");
  assert.equal(config.placement, "source");
});

test("explicit item animation flags have priority over world mappings", () => {
  const settings = {
    mappings: [{ id: "world", eventType: "roll", path: "world.path" }],
    animateRolls: true,
    rollPath: "legacy.default"
  };
  const context = {
    item: { flags: { "gum-animations": { animations: { roll: { successPath: "item.success" } } } } },
    result: { isSuccess: true }
  };
  const config = resolveAnimationConfig({ context, eventType: "roll", getSetting: key => settings[key] });
  assert.equal(config.path, "item.success");
  assert.equal(config.mappingId, null);
});

test("classifies non-roll state transitions", () => {
  assert.equal(classifyContext({ result: { active: true } }, "conditionState"), "active");
  assert.equal(classifyContext({ result: { active: false } }, "effectState"), "inactive");
  assert.equal(resolveMapping([{ eventType: "conditionState", result: "active", path: "condition.on" }], { result: { active: true } }, "conditionState")?.path, "condition.on");
});
