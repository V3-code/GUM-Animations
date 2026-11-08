import assert from "node:assert/strict";
import test from "node:test";
import { AnimationPresetRegistry } from "../scripts/preset-registry.mjs";

test("allows external modules to register, describe, and apply preset providers", async () => {
  const registry = new AnimationPresetRegistry();
  registry.register({
    id: "community.spells",
    label: "Community Spells",
    version: "1.0.0",
    moduleId: "community-module",
    describe: () => [{ id: "fireball" }],
    apply: options => ({ applied: true, options })
  });
  assert.equal(registry.list()[0].id, "community.spells");
  assert.deepEqual(await registry.describe("community.spells"), [{ id: "fireball" }]);
  assert.deepEqual(await registry.apply("community.spells", { overwrite: false }), {
    applied: true,
    options: { overwrite: false }
  });
});
