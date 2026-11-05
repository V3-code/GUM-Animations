export const MODULE_ID = "gum-animations";
export const REQUIRED_GUM_API_VERSION = "1.2.0";

export const EVENT_TYPES = Object.freeze({
  ROLL: "roll",
  DAMAGE: "damage",
  EFFECT_STATE: "effectState",
  CONDITION_STATE: "conditionState",
  STATE_GROUP: "stateGroup",
  ITEM_USE: "itemUse"
});

export const EVENT_SETTINGS = Object.freeze({
  [EVENT_TYPES.ROLL]: { enabled: "animateRolls", path: "rollPath", defaultEnabled: true, defaultPath: "jb2a.fire_bolt.orange" },
  [EVENT_TYPES.DAMAGE]: { enabled: "animateDamage", path: "damagePath", defaultEnabled: false, defaultPath: "" },
  [EVENT_TYPES.EFFECT_STATE]: { enabled: "animateEffectState", path: "effectStatePath", defaultEnabled: false, defaultPath: "" },
  [EVENT_TYPES.CONDITION_STATE]: { enabled: "animateConditionState", path: "conditionStatePath", defaultEnabled: false, defaultPath: "" },
  [EVENT_TYPES.STATE_GROUP]: { enabled: "animateStateGroups", path: "stateGroupPath", defaultEnabled: false, defaultPath: "" },
  [EVENT_TYPES.ITEM_USE]: { enabled: "animateItemUse", path: "itemUsePath", defaultEnabled: false, defaultPath: "" }
});
