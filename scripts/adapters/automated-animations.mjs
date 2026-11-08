import { EVENT_TYPES } from "../constants.mjs";
import { resolvePlaceable, resolvePlaceables } from "../resolver.mjs";

export function createAutomatedAnimationsAdapter({
  getApi = () => globalThis.AutomatedAnimations,
  isModuleActive = () => globalThis.game?.modules?.get("autoanimations")?.active === true,
  getPlayOnFailure = () => globalThis.game?.settings?.get("gum-animations", "playOnFailure") !== false
} = {}) {
  return {
    id: "automated-animations",
    label: "Automated Animations",
    priority: 100,
    isAvailable: () => isModuleActive() && typeof getApi()?.playAnimation === "function",
    canHandle: ({ eventType, context }) => {
      if (!context?.item || !resolvePlaceable(context.sourceToken)) return false;
      if (eventType === EVENT_TYPES.ROLL) return true;
      return eventType === EVENT_TYPES.ITEM_USE && context.result?.trigger === "consume";
    },
    handle: async ({ eventType, context }) => {
      const sourceToken = resolvePlaceable(context.sourceToken);
      const targets = resolvePlaceables(context.targets);
      const failedRoll = eventType === EVENT_TYPES.ROLL && context.result?.isSuccess === false;
      if (failedRoll && !getPlayOnFailure()) return false;

      const options = {
        targets,
        hitTargets: failedRoll ? [] : targets,
        playOnMiss: failedRoll,
        gumContext: context
      };
      const handler = await getApi().playAnimation(sourceToken, context.item, options);
      return { handled: true, handler };
    }
  };
}
