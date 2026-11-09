import { MODULE_ID } from "../constants.mjs";

const CONTROL_CLASS = `${MODULE_ID}-persistent-effect`;

export function isGumEffectItem(document) {
  return document?.documentName === "Item" && document?.type === "effect";
}

function environment({ gameRef = globalThis.game, automatedAnimations = globalThis.AutomatedAnimations } = {}) {
  return {
    gameRef,
    automatedAnimations,
    gumApi: gameRef?.gum?.api,
    notifications: globalThis.ui?.notifications,
    localize: key => gameRef?.i18n?.localize?.(key) || key
  };
}

export function canConfigurePersistentEffect(item, options = {}) {
  const { gameRef, automatedAnimations, gumApi } = environment(options);
  return isGumEffectItem(item)
    && item.isOwner !== false
    && gameRef?.modules?.get?.("autoanimations")?.active === true
    && typeof automatedAnimations?.openAnimationMenu === "function"
    && typeof gumApi?.effects?.getBridge === "function";
}

export async function openPersistentEffectAnimation(item, options = {}) {
  const { automatedAnimations, gumApi, notifications, localize } = environment(options);
  if (!isGumEffectItem(item)) return null;
  if (typeof gumApi?.effects?.getBridge !== "function") {
    notifications?.error?.(localize("GUMAnimations.Errors.EffectBridgeUnavailable"));
    return null;
  }
  if (typeof automatedAnimations?.openAnimationMenu !== "function") {
    notifications?.warn?.(localize("GUMAnimations.Errors.AutomatedAnimationsUnavailable"));
    return null;
  }

  try {
    const bridge = await gumApi.effects.getBridge(item);
    if (!bridge) {
      notifications?.error?.(localize("GUMAnimations.Errors.EffectBridgeUnavailable"));
      return null;
    }
    await automatedAnimations.openAnimationMenu(bridge);
    return bridge;
  } catch (error) {
    console.error("GUM Animations | Não foi possível abrir a animação persistente do efeito.", error);
    notifications?.error?.(localize("GUMAnimations.Errors.EffectAnimationOpenFailed"));
    return null;
  }
}

function addControl(controls, item, control) {
  if (!Array.isArray(controls) || controls.some(entry => entry.class === CONTROL_CLASS)) return;
  if (!canConfigurePersistentEffect(item, control.options)) return;
  controls.unshift(control.value);
}

export function registerEffectAnimationControls({
  hooks = globalThis.Hooks,
  gameRef = globalThis.game,
  automatedAnimations = null
} = {}) {
  if (!hooks?.on) return false;
  const label = () => gameRef?.i18n?.localize?.("GUMAnimations.Controls.PersistentEffect") || "A-A Effect";
  const options = () => ({
    gameRef,
    automatedAnimations: automatedAnimations ?? globalThis.AutomatedAnimations
  });
  const open = item => openPersistentEffectAnimation(item, options());

  hooks.on("getHeaderControlsApplicationV2", (app, controls) => {
    const item = app?.document;
    addControl(controls, item, {
      options: options(),
      value: {
        class: CONTROL_CLASS,
        icon: "fa-solid fa-shield-halved",
        label: label(),
        onClick: () => void open(item)
      }
    });
  });

  hooks.on("getItemSheetHeaderButtons", (sheet, buttons) => {
    const item = sheet?.item;
    addControl(buttons, item, {
      options: options(),
      value: {
        class: CONTROL_CLASS,
        icon: "fas fa-shield-halved",
        label: label(),
        onclick: () => void open(item)
      }
    });
  });
  return true;
}
