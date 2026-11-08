import { MODULE_ID } from "./constants.mjs";

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

export function registerSettings() {
  registerBoolean("enabled", true);
  registerBoolean("playOnFailure", true);
  registerBoolean("debug", false, "client");
}
