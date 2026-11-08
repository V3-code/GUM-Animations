import { EVENT_SETTINGS, MAPPINGS_SETTING, MODULE_ID } from "./constants.mjs";
import { MappingConfig } from "./mapping-config.mjs";

function registerBoolean(key, defaultValue, scope = "world") {
  game.settings.register(MODULE_ID, key, {
    name: `GUMAnimations.Settings.${key}.Name`,
    hint: `GUMAnimations.Settings.${key}.Hint`,
    scope,
    config: true,
    type: Boolean,
    default: defaultValue
  });
}

function registerPath(key, defaultValue) {
  game.settings.register(MODULE_ID, key, {
    name: `GUMAnimations.Settings.${key}.Name`,
    hint: `GUMAnimations.Settings.${key}.Hint`,
    scope: "world",
    config: true,
    type: String,
    default: defaultValue
  });
}

export function registerSettings() {
  registerBoolean("enabled", true);
  registerBoolean("debug", false, "client");
  game.settings.registerMenu(MODULE_ID, "mappingConfig", {
    name: "GUMAnimations.Settings.mappingConfig.Name",
    label: "GUMAnimations.Settings.mappingConfig.Label",
    hint: "GUMAnimations.Settings.mappingConfig.Hint",
    icon: "fas fa-wand-magic-sparkles",
    type: MappingConfig,
    restricted: true
  });
  game.settings.register(MODULE_ID, MAPPINGS_SETTING, {
    scope: "world",
    config: false,
    type: Array,
    default: []
  });
  game.settings.register(MODULE_ID, "assetNamespaces", {
    name: "GUMAnimations.Settings.assetNamespaces.Name",
    hint: "GUMAnimations.Settings.assetNamespaces.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "jb2a"
  });
  for (const descriptor of Object.values(EVENT_SETTINGS)) {
    registerBoolean(descriptor.enabled, descriptor.defaultEnabled);
    registerPath(descriptor.path, descriptor.defaultPath);
  }
}
