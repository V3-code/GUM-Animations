import { EVENT_SETTINGS, EVENT_TYPES, MODULE_ID, PLACEMENTS, RESULT_FILTERS } from "./constants.mjs";

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

export function classifyContext(context = {}, eventType = null) {
  if (eventType === EVENT_TYPES.ROLL) return classifyRoll(context.result);
  if (context.result?.active === true) return "active";
  if (context.result?.active === false) return "inactive";
  return "any";
}

function createId() {
  const randomID = globalThis.foundry?.utils?.randomID;
  return typeof randomID === "function"
    ? randomID()
    : `mapping-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeMapping(mapping = {}) {
  const result = RESULT_FILTERS.includes(mapping.result) ? mapping.result : "any";
  const placement = PLACEMENTS.includes(mapping.placement) ? mapping.placement : "auto";
  return {
    id: String(mapping.id || createId()),
    enabled: mapping.enabled !== false,
    name: String(mapping.name || "").trim(),
    eventType: Object.values(EVENT_TYPES).includes(mapping.eventType) ? mapping.eventType : EVENT_TYPES.ROLL,
    itemUuid: String(mapping.itemUuid || "").trim(),
    itemType: String(mapping.itemType || "").trim(),
    actionType: String(mapping.actionType || "").trim(),
    actionId: String(mapping.actionId || "").trim(),
    attackType: String(mapping.attackType || "").trim(),
    result,
    path: String(mapping.path || "").trim(),
    placement,
    scale: Number(mapping.scale) > 0 ? Number(mapping.scale) : 1,
    persist: mapping.persist === true
  };
}

export function normalizeMappings(mappings) {
  return Array.from(mappings || []).map(normalizeMapping);
}

export function mappingMatches(mapping, context = {}, eventType = null) {
  const rule = normalizeMapping(mapping);
  if (!rule.enabled || !rule.path || rule.eventType !== eventType) return false;
  const item = context.item;
  const itemIds = new Set([item?.uuid, item?.id].filter(Boolean).map(String));
  if (rule.itemUuid && !itemIds.has(rule.itemUuid)) return false;
  if (rule.itemType && String(item?.type || "") !== rule.itemType) return false;
  if (rule.actionType && String(context.action?.type || "") !== rule.actionType) return false;
  if (rule.actionId && String(context.action?.id || "") !== rule.actionId) return false;
  if (rule.attackType && String(context.action?.attackType || "") !== rule.attackType) return false;
  if (rule.result !== "any" && classifyContext(context, eventType) !== rule.result) return false;
  return true;
}

export function resolveMapping(mappings, context, eventType) {
  return normalizeMappings(mappings).find(mapping => mappingMatches(mapping, context, eventType)) || null;
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
  if (!descriptor) return null;

  const itemConfig = getItemAnimationConfig(context?.item, eventType);
  const outcome = eventType === "roll" ? classifyRoll(context?.result) : null;
  const outcomePath = outcome ? itemConfig[`${outcome}Path`] : null;
  const explicitItemPath = String(outcomePath || itemConfig.path || "").trim();
  const mapping = explicitItemPath ? null : resolveMapping(getSetting("mappings"), context, eventType);
  const genericPath = getSetting(descriptor.enabled) === true ? getSetting(descriptor.path) : "";
  const path = String(explicitItemPath || mapping?.path || genericPath || "").trim();
  if (!path) return null;

  return Object.freeze({
    path,
    outcome,
    missed: eventType === "roll" && context?.result?.isSuccess === false,
    placement: itemConfig.placement || mapping?.placement || "auto",
    scale: Number(itemConfig.scale) > 0 ? Number(itemConfig.scale) : (mapping?.scale || 1),
    persist: (itemConfig.persist === true || mapping?.persist === true) && context?.result?.active !== false,
    mappingId: mapping?.id || null
  });
}
