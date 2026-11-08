import { EVENT_TYPES, MAPPINGS_SETTING, MODULE_ID, PLACEMENTS, RESULT_FILTERS } from "./constants.mjs";
import { previewAnimation } from "./player.mjs";
import { normalizeMapping, normalizeMappings } from "./resolver.mjs";

function localizeOptions(prefix, values) {
  return values.map(value => ({ value, label: game.i18n.localize(`${prefix}.${value}`) }));
}

function sequencerPaths() {
  const database = globalThis.Sequencer?.Database;
  if (typeof database?.getPathsUnder !== "function") return [];
  const namespaces = String(game.settings.get(MODULE_ID, "assetNamespaces") || "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
  const paths = new Set();
  for (const namespace of namespaces) {
    try {
      for (const path of database.getPathsUnder(namespace) || []) paths.add(path);
    } catch (error) {
      console.warn(`GUM Animations | Não foi possível listar o namespace ${namespace}.`, error);
    }
  }
  return Array.from(paths).sort((a, b) => a.localeCompare(b));
}

export class MappingConfig extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "gum-animations-mapping-config",
      title: "GUMAnimations.Mapping.Title",
      template: "modules/gum-animations/templates/mapping-config.hbs",
      width: 980,
      height: 720,
      resizable: true,
      closeOnSubmit: false,
      submitOnChange: false
    });
  }

  getData() {
    return {
      mappings: normalizeMappings(game.settings.get(MODULE_ID, MAPPINGS_SETTING)),
      eventTypes: localizeOptions("GUMAnimations.Events", Object.values(EVENT_TYPES)),
      results: localizeOptions("GUMAnimations.Results", RESULT_FILTERS),
      placements: localizeOptions("GUMAnimations.Placements", PLACEMENTS),
      assetPaths: sequencerPaths()
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("[data-action='add']").on("click", event => this.#addMapping(event));
    html.find("[data-action='delete']").on("click", event => this.#deleteMapping(event));
    html.find("[data-action='move-up']").on("click", event => this.#moveMapping(event, -1));
    html.find("[data-action='move-down']").on("click", event => this.#moveMapping(event, 1));
    html.find("[data-action='preview']").on("click", event => this.#previewMapping(event));
    html.find(".gum-animation-item-drop").on("dragover", event => event.preventDefault());
    html.find(".gum-animation-item-drop").on("drop", event => this.#dropItem(event));
  }

  async _updateObject(_event, formData) {
    const expanded = foundry.utils.expandObject(formData);
    const mappings = Object.values(expanded.mappings || {}).map(normalizeMapping);
    await game.settings.set(MODULE_ID, MAPPINGS_SETTING, mappings);
    ui.notifications.info(game.i18n.localize("GUMAnimations.Mapping.Saved"));
  }

  #currentMappings() {
    const expanded = foundry.utils.expandObject(this._getSubmitData());
    return Object.values(expanded.mappings || {}).map(normalizeMapping);
  }

  async #addMapping(event) {
    event.preventDefault();
    const mappings = this.#currentMappings();
    mappings.push(normalizeMapping({ name: game.i18n.localize("GUMAnimations.Mapping.NewRule") }));
    await game.settings.set(MODULE_ID, MAPPINGS_SETTING, mappings);
    this.render(false);
  }

  async #deleteMapping(event) {
    event.preventDefault();
    const id = event.currentTarget.closest("[data-mapping-id]")?.dataset.mappingId;
    const mappings = this.#currentMappings().filter(mapping => mapping.id !== id);
    await game.settings.set(MODULE_ID, MAPPINGS_SETTING, mappings);
    this.render(false);
  }

  async #moveMapping(event, direction) {
    event.preventDefault();
    const id = event.currentTarget.closest("[data-mapping-id]")?.dataset.mappingId;
    const mappings = this.#currentMappings();
    const index = mappings.findIndex(mapping => mapping.id === id);
    const destination = index + direction;
    if (index < 0 || destination < 0 || destination >= mappings.length) return;
    [mappings[index], mappings[destination]] = [mappings[destination], mappings[index]];
    await game.settings.set(MODULE_ID, MAPPINGS_SETTING, mappings);
    this.render(false);
  }

  async #previewMapping(event) {
    event.preventDefault();
    const row = event.currentTarget.closest("[data-mapping-id]");
    const value = suffix => row.querySelector(`[name$='.${suffix}']`)?.value;
    const config = {
      path: value("path"),
      placement: value("placement") || "auto",
      scale: Number(value("scale")) || 1,
      missed: ["failure", "criticalFailure"].includes(value("result")),
      persist: row.querySelector("[name$='.persist']")?.checked === true
    };
    const source = canvas.tokens.controlled?.[0] || null;
    const target = Array.from(game.user.targets || [])[0] || null;
    try {
      await previewAnimation(config, source, target);
    } catch (error) {
      ui.notifications.warn(error.message);
    }
  }

  async #dropItem(event) {
    event.preventDefault();
    const data = TextEditor.getDragEventData(event.originalEvent || event);
    if (data.type !== "Item" || !data.uuid) return;
    const item = await fromUuid(data.uuid).catch(() => null);
    if (!item) return;
    const row = event.currentTarget.closest("[data-mapping-id]");
    row.querySelector("[name$='.itemUuid']").value = item.uuid;
    row.querySelector("[name$='.itemType']").value = item.type || "";
    const name = row.querySelector("[name$='.name']");
    if (!name.value.trim()) name.value = item.name;
  }
}
