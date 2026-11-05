import { EVENT_SETTINGS, MODULE_ID } from "./constants.mjs";

export function compareVersions(left, right) {
  const normalize = value => String(value || "0").split(/[.-]/).slice(0, 3).map(part => Number.parseInt(part, 10) || 0);
  const a = normalize(left);
  const b = normalize(right);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] > b[index] ? 1 : -1;
  }
  return 0;
}

export function resolvePlaceable(value) {
  if (!value) return null;
  if (value.center || value.mesh || value.documentName === "Token") return value;
  return value.object || value.document?.object || value.token?.object || null;
}

export function classifyRoll(result = {}) {
  if (result.isCriticalSuccess) return "criticalSuccess";
  if (result.isCriticalFailure) return "criticalFailure";
  return result.isSuccess ? "success" : "failure";
}

export function getItemAnimationConfig(item, eventType) {
  const animations = item?.getFlag?.(MODULE_ID, "animations")
    ?? item?.flags?.[MODULE_ID]?.animations
    ?? {};
  const config = animations[eventType];
  return typeof config === "string" ? { path: config } : (config || {});
}

export function resolveAnimationConfig({ context, eventType, getSetting }) {
  const descriptor = EVENT_SETTINGS[eventType];
  if (!descriptor || getSetting(descriptor.enabled) !== true) return null;

  const itemConfig = getItemAnimationConfig(context?.item, eventType);
  const outcome = eventType === "roll" ? classifyRoll(context?.result) : null;
  const outcomePath = outcome ? itemConfig[`${outcome}Path`] : null;
  const path = String(outcomePath || itemConfig.path || getSetting(descriptor.path) || "").trim();
  if (!path) return null;

  return Object.freeze({
    path,
    outcome,
    missed: eventType === "roll" && context?.result?.isSuccess === false,
    scale: Number(itemConfig.scale) > 0 ? Number(itemConfig.scale) : 1,
    persist: itemConfig.persist === true && context?.result?.active !== false
  });
}
