import { MODULE_ID } from "./constants.mjs";
import { resolveAnimationConfig, resolvePlaceable } from "./resolver.mjs";

const customResolvers = [];

export function registerResolver(resolver) {
  if (typeof resolver !== "function") throw new TypeError("GUM Animations | O resolver deve ser uma função.");
  customResolvers.push(resolver);
  return () => {
    const index = customResolvers.indexOf(resolver);
    if (index >= 0) customResolvers.splice(index, 1);
  };
}

function databaseHasPath(path) {
  const database = globalThis.Sequencer?.Database;
  if (!database) return false;
  if (typeof database.entryExists === "function") return database.entryExists(path);
  if (typeof database.getEntry === "function") return Boolean(database.getEntry(path));
  return true;
}

function getSetting(key) {
  return globalThis.game?.settings?.get(MODULE_ID, key);
}

export async function resolveConfig(context, eventType) {
  for (const resolver of customResolvers) {
    const resolved = await resolver({ context, eventType });
    if (resolved === false) return null;
    if (resolved?.path) return resolved;
  }
  return resolveAnimationConfig({ context, eventType, getSetting });
}

export async function previewAnimation(config, source, target = null) {
  if (!config?.path || !globalThis.Sequence) return false;
  if (!databaseHasPath(config.path)) throw new Error(`Caminho não encontrado: ${config.path}`);
  const resolvedSource = resolvePlaceable(source);
  const resolvedTarget = resolvePlaceable(target);
  const placement = config.placement || "auto";
  const origin = placement === "target" ? (resolvedTarget || resolvedSource) : (resolvedSource || resolvedTarget);
  if (!origin) throw new Error("Selecione um token de origem ou um alvo para visualizar a animação.");

  const sequence = new globalThis.Sequence({ moduleName: MODULE_ID });
  const effect = sequence.effect().file(config.path).atLocation(origin);
  if (Number(config.scale) > 0 && Number(config.scale) !== 1) effect.scale(Number(config.scale));
  const shouldStretch = resolvedSource && resolvedTarget && resolvedSource !== resolvedTarget
    && (placement === "auto" || placement === "stretch");
  if (shouldStretch) effect.stretchTo(resolvedTarget);
  if (config.missed && shouldStretch && typeof effect.missed === "function") effect.missed(true);
  if (config.persist && typeof effect.persist === "function") effect.persist();
  await sequence.play();
  return true;
}

export async function playLifecycleAnimation(context, eventType) {
  if (!getSetting("enabled") || !globalThis.Sequence) return false;
  const config = await resolveConfig(context, eventType);
  if (!config) return false;
  if (!databaseHasPath(config.path)) {
    if (getSetting("debug")) console.warn(`GUM Animations | Caminho não encontrado: ${config.path}`, context);
    return false;
  }

  const source = resolvePlaceable(context?.sourceToken);
  const target = Array.from(context?.targets || []).map(resolvePlaceable).find(Boolean);
  const origin = source || target;
  if (!origin) {
    if (getSetting("debug")) console.warn("GUM Animations | Evento sem origem visual utilizável.", context);
    return false;
  }

  await previewAnimation(config, source, target);

  if (getSetting("debug")) console.debug(`GUM Animations | ${eventType}`, { context, config });
  return true;
}
