function normalizeProvider(provider) {
  if (!provider?.id) throw new TypeError("GUM Animations | Um provedor de presets precisa de id.");
  return Object.freeze({
    id: String(provider.id),
    label: String(provider.label || provider.id),
    version: String(provider.version || "0.0.0"),
    moduleId: provider.moduleId ? String(provider.moduleId) : null,
    describe: typeof provider.describe === "function" ? provider.describe : () => [],
    apply: typeof provider.apply === "function" ? provider.apply : null
  });
}

export class AnimationPresetRegistry {
  #providers = new Map();

  register(provider) {
    const normalized = normalizeProvider(provider);
    if (this.#providers.has(normalized.id)) throw new Error(`Provedor de presets já registrado: ${normalized.id}`);
    this.#providers.set(normalized.id, normalized);
    return () => this.unregister(normalized.id);
  }

  unregister(id) {
    return this.#providers.delete(String(id));
  }

  list() {
    return Array.from(this.#providers.values()).map(provider => Object.freeze({
      id: provider.id,
      label: provider.label,
      version: provider.version,
      moduleId: provider.moduleId,
      canApply: Boolean(provider.apply)
    }));
  }

  async describe(id) {
    const provider = this.#providers.get(String(id));
    if (!provider) throw new Error(`Provedor de presets não encontrado: ${id}`);
    return provider.describe();
  }

  async apply(id, options = {}) {
    const provider = this.#providers.get(String(id));
    if (!provider) throw new Error(`Provedor de presets não encontrado: ${id}`);
    if (!provider.apply) throw new Error(`O provedor "${id}" não oferece aplicação automática.`);
    return provider.apply(options);
  }
}
