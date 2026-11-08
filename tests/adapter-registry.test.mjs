import assert from "node:assert/strict";
import test from "node:test";
import { AnimationAdapterRegistry } from "../scripts/adapter-registry.mjs";

test("dispatches to the highest-priority available adapter and stops", async () => {
  const calls = [];
  const registry = new AnimationAdapterRegistry();
  registry.register({ id: "low", priority: 1, handle: () => calls.push("low") });
  registry.register({ id: "high", priority: 10, handle: () => calls.push("high") });
  const result = await registry.dispatch("roll", {});
  assert.equal(result.handled, true);
  assert.equal(result.adapterId, "high");
  assert.deepEqual(calls, ["high"]);
});

test("continues when an adapter declines or fails", async () => {
  const errors = [];
  const registry = new AnimationAdapterRegistry({ logger: { error: (...args) => errors.push(args) } });
  registry.register({ id: "fallback", priority: 1, handle: () => ({ handled: true }) });
  registry.register({ id: "declines", priority: 20, handle: () => false });
  registry.register({ id: "fails", priority: 30, handle: () => { throw new Error("boom"); } });
  const result = await registry.dispatch("roll", {});
  assert.equal(result.adapterId, "fallback");
  assert.equal(errors.length, 1);
});

test("registers and unregisters external adapters without duplicate ids", () => {
  const registry = new AnimationAdapterRegistry();
  const unregister = registry.register({ id: "external", label: "External", handle: () => true });
  assert.deepEqual(registry.list().map(entry => entry.id), ["external"]);
  assert.throws(() => registry.register({ id: "external", handle: () => true }), /já registrado/);
  unregister();
  assert.deepEqual(registry.list(), []);
});
