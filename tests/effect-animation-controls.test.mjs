import assert from "node:assert/strict";
import test from "node:test";

import {
  canConfigurePersistentEffect,
  isGumEffectItem,
  openPersistentEffectAnimation,
  registerEffectAnimationControls
} from "../scripts/integrations/effect-animation-controls.mjs";

const effectItem = () => ({ documentName: "Item", type: "effect", isOwner: true, id: "effect" });
const environment = bridge => {
  const calls = [];
  const gameRef = {
    modules: new Map([["autoanimations", { active: true }]]),
    gum: { api: { effects: { getBridge: async item => (calls.push(["bridge", item]), bridge) } } },
    i18n: { localize: key => key }
  };
  const automatedAnimations = {
    openAnimationMenu: async document => calls.push(["open", document])
  };
  return { calls, gameRef, automatedAnimations };
};

test("recognizes only owned GUM Effect Items with both public integrations available", () => {
  const item = effectItem();
  const setup = environment({ documentName: "ActiveEffect" });
  assert.equal(isGumEffectItem(item), true);
  assert.equal(canConfigurePersistentEffect(item, setup), true);
  assert.equal(canConfigurePersistentEffect({ ...item, type: "spell" }, setup), false);
  assert.equal(canConfigurePersistentEffect({ ...item, isOwner: false }, setup), false);
  setup.gameRef.modules.get("autoanimations").active = false;
  assert.equal(canConfigurePersistentEffect(item, setup), false);
});

test("opens Automated Animations on the native ActiveEffect bridge", async () => {
  const item = effectItem();
  const bridge = { documentName: "ActiveEffect", id: "bridge" };
  const setup = environment(bridge);
  assert.equal(await openPersistentEffectAnimation(item, setup), bridge);
  assert.deepEqual(setup.calls, [["bridge", item], ["open", bridge]]);
});

test("registers distinct controls for current and legacy Item sheets", () => {
  const item = effectItem();
  const setup = environment({ documentName: "ActiveEffect" });
  const listeners = new Map();
  assert.equal(registerEffectAnimationControls({
    hooks: { on: (name, callback) => listeners.set(name, callback) },
    gameRef: setup.gameRef,
    automatedAnimations: setup.automatedAnimations
  }), true);

  const current = [];
  listeners.get("getHeaderControlsApplicationV2")({ document: item }, current);
  assert.equal(current.length, 1);
  assert.equal(current[0].class, "gum-animations-persistent-effect");
  assert.equal(typeof current[0].onClick, "function");

  const legacy = [];
  listeners.get("getItemSheetHeaderButtons")({ item }, legacy);
  assert.equal(legacy.length, 1);
  assert.equal(typeof legacy[0].onclick, "function");
});
