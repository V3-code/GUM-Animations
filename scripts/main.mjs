import { EVENT_TYPES, MODULE_ID, REQUIRED_GUM_API_VERSION } from "./constants.mjs";
import { playLifecycleAnimation, registerResolver } from "./player.mjs";
import { compareVersions } from "./resolver.mjs";
import { registerSettings } from "./settings.mjs";

const processedEvents = new Set();

function oncePerEvent(context, eventType) {
  const key = `${eventType}:${context?.eventId || "unknown"}`;
  if (processedEvents.has(key)) return false;
  processedEvents.add(key);
  setTimeout(() => processedEvents.delete(key), 60_000);
  return true;
}

function listen(hookName, eventType) {
  if (!hookName) return;
  Hooks.on(hookName, context => {
    if (!oncePerEvent(context, eventType)) return;
    void playLifecycleAnimation(context, eventType).catch(error => {
      console.error(`GUM Animations | Falha ao processar ${eventType}.`, error);
    });
  });
}

function install(api) {
  if (!api || compareVersions(api.version, REQUIRED_GUM_API_VERSION) < 0) {
    ui.notifications.error(game.i18n.format("GUMAnimations.Errors.IncompatibleApi", { version: REQUIRED_GUM_API_VERSION }));
    return false;
  }

  const hooks = api.hooks;
  listen(hooks.ROLL_COMPLETED, EVENT_TYPES.ROLL);
  listen(hooks.DAMAGE_ROLLED, EVENT_TYPES.DAMAGE);
  listen(hooks.EFFECT_STATE_CHANGED, EVENT_TYPES.EFFECT_STATE);
  listen(hooks.CONDITION_STATE_CHANGED, EVENT_TYPES.CONDITION_STATE);
  listen(hooks.STATE_EFFECT_GROUP_CHANGED, EVENT_TYPES.STATE_GROUP);
  listen(hooks.ITEM_USE_COMPLETED, EVENT_TYPES.ITEM_USE);

  const module = game.modules.get(MODULE_ID);
  if (module) module.api = Object.freeze({
    version: "0.1.0",
    play: playLifecycleAnimation,
    registerResolver,
    eventTypes: EVENT_TYPES
  });
  console.info(`GUM Animations | Pronto com a API GUM ${api.version}.`);
  return true;
}

Hooks.once("init", registerSettings);
Hooks.once("ready", () => {
  const gumApi = game.gum?.api;
  if (gumApi) install(gumApi);
  else Hooks.once("gum.apiReady", install);
});
