import { AnimationAdapterRegistry } from "./adapter-registry.mjs";
import { createAutomatedAnimationsAdapter } from "./adapters/automated-animations.mjs";
import { EVENT_TYPES, MODULE_ID, MODULE_VERSION, REQUIRED_GUM_API_VERSION } from "./constants.mjs";
import { AnimationPresetRegistry } from "./preset-registry.mjs";
import { compareVersions } from "./resolver.mjs";
import { registerSettings } from "./settings.mjs";

const processedEvents = new Set();
const adapters = new AnimationAdapterRegistry();
const presets = new AnimationPresetRegistry();

function debug(message, data = null) {
  if (game.settings.get(MODULE_ID, "debug")) console.debug(`GUM Animations | ${message}`, data);
}

function oncePerEvent(context, eventType) {
  const key = `${eventType}:${context?.eventId || "unknown"}`;
  if (processedEvents.has(key)) return false;
  processedEvents.add(key);
  setTimeout(() => processedEvents.delete(key), 60_000);
  return true;
}

async function dispatch(eventType, context) {
  if (!game.settings.get(MODULE_ID, "enabled")) return { handled: false, adapterId: null };
  if (!oncePerEvent(context, eventType)) return { handled: false, adapterId: null, duplicate: true };
  const result = await adapters.dispatch(eventType, context);
  debug(`${eventType}: ${result.handled ? `tratado por ${result.adapterId}` : "sem adaptador aplicável"}`, { context, result });
  return result;
}

function listen(hookName, eventType) {
  if (!hookName) return;
  Hooks.on(hookName, context => void dispatch(eventType, context));
}

function createPublicApi() {
  return Object.freeze({
    version: MODULE_VERSION,
    eventTypes: EVENT_TYPES,
    dispatch,
    adapters: Object.freeze({
      register: adapter => adapters.register(adapter),
      unregister: id => adapters.unregister(id),
      list: () => adapters.list()
    }),
    presets: Object.freeze({
      register: provider => presets.register(provider),
      unregister: id => presets.unregister(id),
      list: () => presets.list(),
      describe: id => presets.describe(id),
      apply: (id, options) => presets.apply(id, options)
    })
  });
}

function install(gumApi) {
  if (!gumApi || compareVersions(gumApi.version, REQUIRED_GUM_API_VERSION) < 0) {
    ui.notifications.error(game.i18n.format("GUMAnimations.Errors.IncompatibleApi", { version: REQUIRED_GUM_API_VERSION }));
    return false;
  }

  adapters.register(createAutomatedAnimationsAdapter());
  listen(gumApi.hooks.ROLL_COMPLETED, EVENT_TYPES.ROLL);
  listen(gumApi.hooks.DAMAGE_ROLLED, EVENT_TYPES.DAMAGE_ROLLED);
  listen(gumApi.hooks.DAMAGE_APPLIED, EVENT_TYPES.DAMAGE_APPLIED);
  listen(gumApi.hooks.EFFECT_APPLIED, EVENT_TYPES.EFFECT_APPLIED);
  listen(gumApi.hooks.EFFECT_REMOVED, EVENT_TYPES.EFFECT_REMOVED);
  listen(gumApi.hooks.EFFECT_STATE_CHANGED, EVENT_TYPES.EFFECT_STATE);
  listen(gumApi.hooks.CONDITION_STATE_CHANGED, EVENT_TYPES.CONDITION_STATE);
  listen(gumApi.hooks.STATE_EFFECT_GROUP_CHANGED, EVENT_TYPES.STATE_GROUP);
  listen(gumApi.hooks.ITEM_USE_COMPLETED, EVENT_TYPES.ITEM_USE);

  const api = createPublicApi();
  const module = game.modules.get(MODULE_ID);
  if (module) module.api = api;
  Hooks.callAll("gumAnimations.ready", api);
  console.info(`GUM Animations | Hub ${MODULE_VERSION} pronto com a API GUM ${gumApi.version}.`);
  debug("Adaptadores", adapters.list());
  return true;
}

Hooks.once("init", registerSettings);
Hooks.once("ready", () => {
  const gumApi = game.gum?.api;
  if (gumApi) install(gumApi);
  else Hooks.once("gum.apiReady", install);
});
