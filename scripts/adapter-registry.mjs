function normalizeAdapter(adapter) {
  if (!adapter?.id || typeof adapter.handle !== "function") {
    throw new TypeError("GUM Animations | Um adaptador precisa de id e handle().");
  }
  return Object.freeze({
    id: String(adapter.id),
    label: String(adapter.label || adapter.id),
    priority: Number(adapter.priority) || 0,
    isAvailable: typeof adapter.isAvailable === "function" ? adapter.isAvailable : () => true,
    canHandle: typeof adapter.canHandle === "function" ? adapter.canHandle : () => true,
    handle: adapter.handle
  });
}

export class AnimationAdapterRegistry {
  #adapters = new Map();
  #logger;

  constructor({ logger = globalThis.console } = {}) {
    this.#logger = logger;
  }

  register(adapter) {
    const normalized = normalizeAdapter(adapter);
    if (this.#adapters.has(normalized.id)) throw new Error(`Adaptador já registrado: ${normalized.id}`);
    this.#adapters.set(normalized.id, normalized);
    return () => this.unregister(normalized.id);
  }

  unregister(id) {
    return this.#adapters.delete(String(id));
  }

  list() {
    return Array.from(this.#adapters.values())
      .sort((left, right) => right.priority - left.priority)
      .map(adapter => Object.freeze({
        id: adapter.id,
        label: adapter.label,
        priority: adapter.priority,
        available: this.#isAvailable(adapter)
      }));
  }

  async dispatch(eventType, context) {
    for (const adapter of Array.from(this.#adapters.values()).sort((left, right) => right.priority - left.priority)) {
      try {
        if (!await adapter.isAvailable()) continue;
        if (!await adapter.canHandle({ eventType, context })) continue;
        const result = await adapter.handle({ eventType, context });
        if (result === false || result?.handled === false) continue;
        return Object.freeze({ handled: true, adapterId: adapter.id, result: result ?? null });
      } catch (error) {
        this.#logger?.error?.(`GUM Animations | Falha no adaptador "${adapter.id}".`, error);
      }
    }
    return Object.freeze({ handled: false, adapterId: null, result: null });
  }

  #isAvailable(adapter) {
    try {
      return adapter.isAvailable() === true;
    } catch (_error) {
      return false;
    }
  }
}
