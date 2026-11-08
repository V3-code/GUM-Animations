import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the hub subscribes every public GUM lifecycle family", async () => {
  const main = await readFile(new URL("../scripts/main.mjs", import.meta.url), "utf8");
  for (const hook of [
    "ROLL_COMPLETED",
    "DAMAGE_ROLLED",
    "DAMAGE_APPLIED",
    "EFFECT_APPLIED",
    "EFFECT_REMOVED",
    "EFFECT_STATE_CHANGED",
    "CONDITION_STATE_CHANGED",
    "STATE_EFFECT_GROUP_CHANGED",
    "ITEM_USE_COMPLETED"
  ]) assert.match(main, new RegExp(`gumApi\\.hooks\\.${hook}`));
});

test("the Automated Animations adapter uses its public playback API", async () => {
  const adapter = await readFile(new URL("../scripts/adapters/automated-animations.mjs", import.meta.url), "utf8");
  assert.match(adapter, /getApi\(\)\.playAnimation\(sourceToken, context\.item, options\)/);
  assert.doesNotMatch(adapter, /new\s+Sequence/);
});

test("the manifest keeps visual engines optional", async () => {
  const manifest = JSON.parse(await readFile(new URL("../module.json", import.meta.url), "utf8"));
  assert.equal(manifest.relationships.requires, undefined);
  assert.equal(manifest.relationships.recommends[0].id, "autoanimations");
  assert.equal(manifest.styles, undefined);
});
