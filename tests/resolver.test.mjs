import assert from "node:assert/strict";
import test from "node:test";
import { compareVersions, resolvePlaceable, resolvePlaceables } from "../scripts/resolver.mjs";

test("compares the numeric portion of API versions", () => {
  assert.equal(compareVersions("1.2.0", "1.2.0"), 0);
  assert.equal(compareVersions("1.3.0-beta", "1.2.0"), 1);
  assert.equal(compareVersions("1.1.9", "1.2.0"), -1);
});

test("resolves Foundry token wrappers and filters invalid targets", () => {
  const token = { center: { x: 1, y: 2 } };
  assert.equal(resolvePlaceable(token), token);
  assert.equal(resolvePlaceable({ object: token }), token);
  assert.equal(resolvePlaceable({ actor: {} }), null);
  assert.deepEqual(resolvePlaceables([null, { object: token }, { actor: {} }]), [token]);
});
