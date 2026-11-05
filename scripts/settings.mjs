import { EVENT_SETTINGS, MODULE_ID } from "./constants.mjs";

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
  for (const descriptor of Object.values(EVENT_SETTINGS)) {
    registerBoolean(descriptor.enabled, descriptor.defaultEnabled);
    registerPath(descriptor.path, descriptor.defaultPath);
  }
}
